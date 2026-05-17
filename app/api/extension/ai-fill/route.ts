// POST /api/extension/ai-fill
// Uses Claude to map directory form fields → values from user's product.

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromExtToken, getServiceSupabase } from '@/lib/ext-auth'
import { generate, DEFAULT_MODEL, CHEAP_MODEL } from '@/lib/ai/claude'

export const runtime = 'nodejs'

interface Field {
  id: string
  type: string
  name?: string | null
  placeholder?: string | null
  label?: string | null
  ariaLabel?: string | null
  maxLength?: number | null
  required?: boolean
  options?: { value: string; text: string }[]
}

export async function POST(req: NextRequest) {
  const auth = await getUserFromExtToken(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const fields: Field[] = body.fields || []
  const directoryName: string = body.directoryName || 'this directory'
  const url: string = body.url || ''

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to fill' }, { status: 400 })
  }

  const supa = getServiceSupabase()

  // Get product + plan
  const [{ data: prods }, { data: profile }] = await Promise.all([
    supa.from('products').select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false }).limit(1),
    supa.from('profiles').select('plan').eq('id', auth.userId).single(),
  ])
  const product = prods?.[0]
  if (!product) return NextResponse.json({ error: 'No product set up' }, { status: 404 })

  const plan = (profile?.plan as string) || 'free'

  // Monthly quota check (separate from content-gen quota — bucket by source='extension_fill')
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0,0,0,0)

  const { count } = await supa
    .from('ai_generations').select('id', { count: 'exact', head: true })
    .eq('user_id', auth.userId)
    .eq('platform', 'extension_fill')
    .gte('created_at', monthStart.toISOString())

  const quota = plan === 'scale' ? 1000 : plan === 'pro' ? 100 : plan === 'lifetime' ? 50 : 5
  if ((count ?? 0) >= quota) {
    return NextResponse.json({
      error: `AI fill quota exhausted (${count}/${quota}). Upgrade your plan to continue.`,
      quotaExceeded: true,
    }, { status: 429 })
  }

  const model = plan === 'free' ? CHEAP_MODEL : DEFAULT_MODEL

  // Build the prompt
  const system = `You are an expert form-filler for SaaS directory submissions. Given a directory's form schema (a list of fields) and a product, output a JSON object mapping field IDs to the best value for that field.

RULES:
- Output ONLY a JSON object — no markdown, no commentary, no preamble.
- Keys = field IDs exactly as given.
- Values = the string to put in that field.
- For SELECT fields, you MUST choose from the provided "options" — output the option's "value" or "text", whichever is more specific.
- Skip fields where you have no good answer (omit from output, don't output empty string).
- Respect maxLength: truncate gracefully if needed.
- Adapt tone to the directory: Product Hunt = punchy 60-char tagline, Hacker News = technical & calm, Reddit = humble & honest, default = clear & benefit-led.
- Tagline-style fields (label/placeholder mentions "tagline" / "pitch" / "one-liner"): max 60 chars, no period.
- Description fields: 1-2 short sentences unless maxLength suggests otherwise. Lead with benefit, not features.
- URL fields: use the product URL exactly. Don't add UTM or anything.
- Email/Twitter fields: use values provided; if not provided, omit.
- Name/Title fields: use product name exactly.
- Don't invent founder names, team sizes, prices, or company info not given.

OUTPUT FORMAT EXAMPLE (this is what you produce):
{"__directo_f_0":"Directo","__directo_f_1":"Launch on 100+ directories with AI","__directo_f_2":"https://directo.app","__directo_f_3":"saas-tools"}`

  const productBlock = `PRODUCT:
- Name: ${product.name}
- URL: ${product.url}
- Description: ${product.description || '(not provided)'}
- Category: ${product.category || '(not provided)'}
- Twitter: ${product.twitter || '(not provided)'}`

  const directoryBlock = `DIRECTORY: ${directoryName}
SUBMIT URL: ${url}`

  const fieldsBlock = `FORM FIELDS (JSON):
${JSON.stringify(fields, null, 2)}`

  const userPrompt = `${productBlock}

${directoryBlock}

${fieldsBlock}

Now output the JSON mapping. Keys are field IDs from the FORM FIELDS list above. Output ONLY the JSON object, nothing else.`

  let result
  try {
    result = await generate({
      system,
      user: userPrompt,
      model,
      maxTokens: 1500,
      temperature: 0.5,
    })
  } catch (e: any) {
    return NextResponse.json({ error: `AI error: ${e?.message || 'unknown'}` }, { status: 500 })
  }

  // Parse the AI's JSON output (be forgiving — strip markdown fences if any)
  let mapping: Record<string, string> = {}
  try {
    let text = result.text.trim()
    // Strip ```json ... ``` if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    mapping = JSON.parse(text)
  } catch (e) {
    return NextResponse.json({
      error: 'AI returned invalid JSON',
      rawOutput: result.text.slice(0, 500),
    }, { status: 500 })
  }

  // Filter out non-existent field IDs (defensive)
  const validIds = new Set(fields.map(f => f.id))
  const cleaned: Record<string, string> = {}
  for (const [k, v] of Object.entries(mapping)) {
    if (validIds.has(k) && v != null && String(v).trim() !== '') {
      cleaned[k] = String(v)
    }
  }

  // Log the generation
  await supa.from('ai_generations').insert({
    user_id: auth.userId,
    product_id: product.id,
    platform: 'extension_fill',
    tone: directoryName,
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    content: JSON.stringify(cleaned),
  })

  return NextResponse.json({
    ok: true,
    mapping: cleaned,
    fieldsCount: fields.length,
    mappedCount: Object.keys(cleaned).length,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.costUsd,
  })
}
