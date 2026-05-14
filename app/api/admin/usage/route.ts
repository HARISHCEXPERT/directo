import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// All admin dashboard data in one round-trip.
// Returns 403 unless caller has profiles.is_admin = true.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get('days') ?? 30)))

  const [
    summaryRes,
    dailyRes,
    byUserRes,
    plansRes,
    platformRes,
  ] = await Promise.all([
    supabase.rpc('admin_usage_summary', { days }),
    supabase.rpc('admin_usage_daily', { days }),
    supabase.rpc('admin_usage_by_user', { days }),
    supabase.from('profiles').select('plan'),
    supabase.from('ai_generations').select('platform, cost_usd, created_at')
      .gte('created_at', new Date(Date.now() - days * 86400000).toISOString()),
  ])

  // Plan distribution
  const planCounts: Record<string, number> = { free: 0, pro: 0, scale: 0, lifetime: 0 }
  for (const p of plansRes.data || []) {
    const k = (p.plan as string) || 'free'
    planCounts[k] = (planCounts[k] || 0) + 1
  }

  // Platform breakdown
  const platformAgg: Record<string, { count: number; cost: number }> = {}
  for (const row of platformRes.data || []) {
    const p = (row.platform as string) || 'unknown'
    if (!platformAgg[p]) platformAgg[p] = { count: 0, cost: 0 }
    platformAgg[p].count += 1
    platformAgg[p].cost += Number(row.cost_usd) || 0
  }

  // Revenue estimate (₹ INR — adjust prices here if pricing shifts)
  const PRICES_INR = { free: 0, pro: 999, scale: 2499, lifetime: 14999 / 12 /* amortized */ }
  let monthlyRevenueInr = 0
  for (const [plan, count] of Object.entries(planCounts)) {
    monthlyRevenueInr += (PRICES_INR as any)[plan] * count
  }

  const summary = summaryRes.data?.[0] ?? {
    total_generations: 0, total_input_tokens: 0, total_output_tokens: 0,
    total_cost_usd: 0, active_users: 0,
  }

  return NextResponse.json({
    days,
    summary: {
      generations: Number(summary.total_generations),
      inputTokens: Number(summary.total_input_tokens),
      outputTokens: Number(summary.total_output_tokens),
      costUsd: Number(summary.total_cost_usd),
      activeUsers: Number(summary.active_users),
    },
    daily: (dailyRes.data || []).map((d: any) => ({
      day: d.day, generations: Number(d.generations), costUsd: Number(d.cost_usd),
    })),
    byUser: (byUserRes.data || []).map((u: any) => ({
      userId: u.user_id, email: u.email, plan: u.plan,
      generations: Number(u.generations), costUsd: Number(u.cost_usd),
      lastUsed: u.last_used,
    })),
    plans: planCounts,
    platforms: platformAgg,
    revenue: {
      monthlyInr: Math.round(monthlyRevenueInr),
      monthlyUsd: Math.round(monthlyRevenueInr / 85),
    },
  })
}
