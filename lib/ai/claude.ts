// Anthropic client wrapper.
// Keep all model + pricing config here so we can swap models without
// hunting through the codebase.

import Anthropic from '@anthropic-ai/sdk'

// Singleton — Node.js shares this across requests on warm lambdas.
let _client: Anthropic | null = null
export function getClient(): Anthropic {
  if (_client) return _client
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

// Default model for content generation. Sonnet 4.5 = professional tone
// at reasonable cost (~₹1.40/post). Swap to claude-haiku-4-5 for free tier.
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
export const CHEAP_MODEL = 'claude-haiku-4-5'

// Anthropic pricing snapshot (USD per million tokens).
// Used for cost tracking in the ai_generations table.
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-opus-4-20250514': { input: 15, output: 75 },
}

export function computeCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const p = MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL]
  return (inputTokens * p.input) / 1_000_000 + (outputTokens * p.output) / 1_000_000
}

export interface GenerateOptions {
  system: string
  user: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface GenerateResult {
  text: string
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const model = opts.model || DEFAULT_MODEL
  const client = getClient()

  const res = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.8,
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
  })

  const textBlock = res.content.find((b) => b.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''

  const inputTokens = res.usage.input_tokens
  const outputTokens = res.usage.output_tokens

  return {
    text: text.trim(),
    model,
    inputTokens,
    outputTokens,
    costUsd: computeCostUsd(model, inputTokens, outputTokens),
  }
}
