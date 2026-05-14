// Central pricing config — keep server + client in sync via this file.

export type PlanId = 'free' | 'pro' | 'scale' | 'lifetime'
export type Cycle = 'monthly' | 'yearly' | 'lifetime'

export interface PlanPrice {
  id: PlanId
  name: string
  monthly?: number   // in INR
  yearly?: number    // in INR (full year, not monthly equivalent)
  lifetime?: number  // in INR (one-time)
  aiQuotaMonthly: number
  model: 'haiku' | 'sonnet' | 'opus'
  features: string[]
  popular?: boolean
  founding?: boolean
}

export const PLANS: PlanPrice[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    aiQuotaMonthly: 5,
    model: 'haiku',
    features: [
      'Directory tracker (90+ directories)',
      '5 AI posts/month (Haiku)',
      'Manual submission only',
      'Lifetime tracking',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 999,
    yearly: 9999, // 17% off
    aiQuotaMonthly: 100,
    model: 'sonnet',
    popular: true,
    features: [
      'Everything in Free',
      'Extension autofill (100+ directories)',
      '100 AI posts/month (Sonnet 4.5)',
      'Per-platform native tone',
      'Launch calendar + scheduling',
      'Analytics dashboard',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    monthly: 2499,
    yearly: 24999,
    aiQuotaMonthly: 500,
    model: 'sonnet',
    features: [
      'Everything in Pro',
      '500 AI posts/month + Opus access',
      'Multi-product workspaces (5)',
      'Priority directory mapping',
      'White-glove first launch call',
    ],
  },
  {
    id: 'lifetime',
    name: 'Founding Lifetime',
    lifetime: 14999,
    aiQuotaMonthly: 50,
    model: 'sonnet',
    founding: true,
    features: [
      'Pro features FOREVER',
      '50 AI gens/month, no expiry',
      'Founding Member badge',
      'Direct WhatsApp support',
      'First 100 users only',
    ],
  },
]

export function priceFor(plan: PlanId, cycle: Cycle): number {
  const p = PLANS.find(x => x.id === plan)
  if (!p) return 0
  if (cycle === 'monthly') return p.monthly ?? 0
  if (cycle === 'yearly') return p.yearly ?? 0
  if (cycle === 'lifetime') return p.lifetime ?? 0
  return 0
}
