import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPrompt, PlatformId, Tone, ProductContext } from '@/lib/ai/prompts'
import { generate, DEFAULT_MODEL, CHEAP_MODEL } from '@/lib/ai/claude'

// Free tier vs paid quota. Tweak as pricing finalizes.
const FREE_TIER_MONTHLY = 5
const PRO_TIER_MONTHLY = 100
const SCALE_TIER_MONTHLY = 500

const VALID_PLATFORMS: PlatformId[] = [
  'producthunt', 'twitter', 'linkedin', 'reddit', 'hackernews', 'indiehackers',
]
const VALID_TONES: Tone[] = [
  'Founder', 'Technical', 'Casual', 'Storytelling', 'Launch-focused',
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { platform, tone, productId } = body as {
      platform: PlatformId; tone: Tone; productId?: string
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }
    if (!VALID_TONES.includes(tone)) {
      return NextResponse.json({ error: 'Invalid tone' }, { status: 400 })
    }

    // Fetch product (specific id, else latest active product)
    let productQuery = supabase.from('products').select('*').eq('user_id', user.id)
    productQuery = productId
      ? productQuery.eq('id', productId)
      : productQuery.order('created_at', { ascending: false }).limit(1)
    const { data: products } = await productQuery
    const product = products?.[0]

    if (!product) {
      return NextResponse.json({ error: 'No product found' }, { status: 404 })
    }

    // Quota check — count this month's generations
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('ai_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())

    // Get user plan from profiles (defaults to 'free')
    const { data: profile } = await supabase
      .from('profiles').select('plan').eq('id', user.id).single()
    const plan = (profile?.plan as string) || 'free'

    const quota =
      plan === 'scale' ? SCALE_TIER_MONTHLY :
      plan === 'pro'   ? PRO_TIER_MONTHLY   :
                         FREE_TIER_MONTHLY

    const used = count ?? 0
    if (used >= quota) {
      return NextResponse.json({
        error: 'quota_exceeded',
        message: `You've used ${used}/${quota} generations this month.`,
        plan, used, quota,
      }, { status: 429 })
    }

    // Free plan gets Haiku, paid plans get Sonnet
    const model = plan === 'free' ? CHEAP_MODEL : DEFAULT_MODEL

    const ctx: ProductContext = {
      name: product.name,
      url: product.url,
      description: product.description,
      category: product.category,
      twitter: product.twitter,
    }
    const { system, user: userPrompt } = buildPrompt(platform, tone, ctx)

    const result = await generate({
      system, user: userPrompt, model,
      maxTokens: platform === 'twitter' ? 1500 : 1024,
      temperature: 0.85,
    })

    // Log the generation (best-effort — don't fail the request if logging fails)
    await supabase.from('ai_generations').insert({
      user_id: user.id,
      product_id: product.id,
      platform,
      tone,
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      cost_usd: result.costUsd,
      content: result.text,
    })

    return NextResponse.json({
      text: result.text,
      platform,
      tone,
      meta: {
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd: result.costUsd,
        used: used + 1,
        quota,
        plan,
      },
    })
  } catch (e: any) {
    console.error('[generate-content] error:', e)
    return NextResponse.json(
      { error: 'generation_failed', message: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
