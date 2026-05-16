import { NextRequest, NextResponse } from 'next/server'
import { getUserFromExtToken, getServiceSupabase } from '@/lib/ext-auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await getUserFromExtToken(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fields, url, directorySlug, directoryName } = await req.json()

  if (!fields || fields.length === 0) {
    return NextResponse.json({ error: 'No fields provided' }, { status: 400 })
  }

  const supa = getServiceSupabase()
  const { data: products } = await supa
    .from('products')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(1)

  const product = products?.[0]
  if (!product) {
    return NextResponse.json({ error: 'No product found' }, { status: 404 })
  }

  const { data: profile } = await supa
    .from('profiles')
    .select('plan')
    .eq('id', auth.userId)
    .single()

  const isPaid = profile?.plan && profile.plan !== 'free'
  const limit = isPaid ? 999 : 5

  const { count } = await supa
    .from('ai_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.userId)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

  const quotaLimit = isPaid ? 999 : 5
if ((count || 0) >= quotaLimit) {
    return NextResponse.json({
      error: isPaid ? 'Monthly limit reached' : 'Free tier limit (5/month) reached. Upgrade for unlimited fills.'
    }, { status: 429 })
  }

  const prompt = `You are helping auto-fill a SaaS directory submission form.

PRODUCT INFO:
Name: ${product.name}
URL: ${product.url}
Description: ${product.description}
Category: ${product.category}
Twitter: ${product.twitter || 'N/A'}

DIRECTORY: ${directoryName || directorySlug || url}

FORM FIELDS:
${JSON.stringify(fields, null, 2)}

Return a JSON object mapping each field's "id" to the best value.

RULES:
- Write DETAILED, compelling descriptions (minimum 150 words for description fields)
- For tagline fields: concise but punchy (under 60 chars)
- For description/about fields: write full paragraphs, highlight key features, benefits, use cases
- For select fields: return closest matching option value
- Respect maxLength limits strictly
- Generate platform-appropriate content (PH = exciting launch copy, HN = technical, Reddit = casual)
- Return ONLY valid JSON, no explanation
- Example: {"__directo_f_0": "Directo", "__directo_f_1": "Launch your SaaS everywhere"}`

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI returned invalid response' }, { status: 500 })
    }

    const mapping = JSON.parse(jsonMatch[0])

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const costUsd = (inputTokens * 0.00000025) + (outputTokens * 0.00000125)

    await supa.from('ai_generations').insert({
      user_id: auth.userId,
      product_id: product.id,
      platform: directorySlug || 'unknown',
      model: 'claude-haiku-4-5',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    })

    return NextResponse.json({ mapping, model: 'claude-haiku-4-5', costUsd })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}