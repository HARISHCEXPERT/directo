'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const USD_TO_INR = 85

interface UsageData {
  days: number
  summary: {
    generations: number
    inputTokens: number
    outputTokens: number
    costUsd: number
    activeUsers: number
  }
  daily: { day: string; generations: number; costUsd: number }[]
  byUser: {
    userId: string; email: string; plan: string
    generations: number; costUsd: number; lastUsed: string
  }[]
  plans: Record<string, number>
  platforms: Record<string, { count: number; cost: number }>
  revenue: { monthlyInr: number; monthlyUsd: number }
}

export default function AdminUsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      setLoading(true); setErr(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setErr('Not signed in'); setLoading(false); return }

      const res = await fetch(`/api/admin/usage?days=${days}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErr(j.error === 'Forbidden' ? 'Admin access required. Set is_admin=true on your profile.' : (j.error || 'Failed to load'))
        setLoading(false); return
      }
      setData(await res.json())
      setLoading(false)
    }
    load()
  }, [days])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (err) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3">
        ⚠️ {err}
      </div>
    )
  }

  if (!data) return null

  const costInr = data.summary.costUsd * USD_TO_INR
  const revenueInr = data.revenue.monthlyInr
  const margin = revenueInr > 0 ? ((revenueInr - costInr) / revenueInr) * 100 : 0
  const costRatio = revenueInr > 0 ? (costInr / revenueInr) * 100 : 0

  const maxDaily = Math.max(1, ...data.daily.map(d => d.generations))
  const userPlans = Object.entries(data.plans) as [string, number][]
  const totalUsers = userPlans.reduce((a, [, c]) => a + c, 0)

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin · Usage &amp; Cost 📊</h1>
          <p className="text-zinc-500 text-sm mt-1">AI cost vs revenue, per-user breakdown, plan distribution.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`text-xs px-3 py-1.5 rounded-md transition ${days === d ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* HEADLINE STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="⚡"
          label="Generations"
          value={data.summary.generations.toLocaleString()}
          sub={`${data.summary.activeUsers} active users`}
          color="text-violet-400"
        />
        <StatCard
          icon="💸"
          label="AI Cost (last 30d)"
          value={`₹${costInr.toFixed(0)}`}
          sub={`$${data.summary.costUsd.toFixed(2)} · ${(data.summary.inputTokens + data.summary.outputTokens).toLocaleString()} tokens`}
          color="text-red-400"
        />
        <StatCard
          icon="💰"
          label="Est. Monthly Revenue"
          value={`₹${revenueInr.toLocaleString()}`}
          sub={`$${data.revenue.monthlyUsd} · ${totalUsers} total users`}
          color="text-green-400"
        />
        <StatCard
          icon={margin >= 80 ? '🟢' : margin >= 50 ? '🟡' : '🔴'}
          label="Gross Margin"
          value={`${margin.toFixed(1)}%`}
          sub={`Cost ratio: ${costRatio.toFixed(1)}%`}
          color={margin >= 80 ? 'text-green-400' : margin >= 50 ? 'text-yellow-400' : 'text-red-400'}
        />
      </div>

      {/* DAILY CHART */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Daily generations · last {days} days</h3>
          <span className="text-xs text-zinc-500">
            Peak: <span className="text-white font-bold">{maxDaily}</span> / day
          </span>
        </div>
        <div className="flex items-end gap-1 h-32">
          {data.daily.length === 0 ? (
            <div className="w-full text-center text-zinc-600 text-xs self-center">No data yet</div>
          ) : data.daily.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center group relative">
              <div
                className="w-full bg-violet-600/60 hover:bg-violet-500 rounded-t transition"
                style={{ height: `${(d.generations / maxDaily) * 100}%`, minHeight: 2 }}
              />
              <div className="absolute -top-8 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                {d.day}: {d.generations} gens · ₹{(d.costUsd * USD_TO_INR).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PLAN MIX + PLATFORM MIX */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Plan distribution</h3>
          <div className="space-y-2">
            {userPlans.map(([plan, count]) => {
              const pct = totalUsers > 0 ? (count / totalUsers) * 100 : 0
              return (
                <div key={plan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400 capitalize">{plan}</span>
                    <span className="text-white font-medium">{count} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="bg-zinc-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${plan === 'free' ? 'bg-zinc-600' : plan === 'pro' ? 'bg-violet-500' : plan === 'scale' ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Platform breakdown</h3>
          <div className="space-y-2">
            {Object.entries(data.platforms).length === 0 ? (
              <p className="text-zinc-600 text-xs">No generations yet.</p>
            ) : Object.entries(data.platforms).sort((a, b) => b[1].count - a[1].count).map(([p, v]) => (
              <div key={p} className="flex items-center justify-between text-xs bg-zinc-800/40 rounded px-3 py-2">
                <span className="text-zinc-300 capitalize">{p}</span>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">{v.count} gens</span>
                  <span className="text-red-400 font-medium">₹{(v.cost * USD_TO_INR).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP USERS BY COST */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Top users by cost</h3>
          <span className="text-xs text-zinc-500">
            {data.byUser.length} users in last {days}d
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-600 text-xs border-b border-zinc-800 bg-zinc-950/50">
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-right px-4 py-3 font-medium">Gens</th>
              <th className="text-right px-4 py-3 font-medium">Cost</th>
              <th className="text-right px-4 py-3 font-medium">Last used</th>
              <th className="text-right px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {data.byUser.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-zinc-600 text-xs py-8">No usage data.</td></tr>
            ) : data.byUser.slice(0, 30).map(u => {
              const userCostInr = u.costUsd * USD_TO_INR
              // Plan price for THIS user (their monthly contribution)
              const planRev = u.plan === 'pro' ? 999 : u.plan === 'scale' ? 2499 : u.plan === 'lifetime' ? 1250 : 0
              const profitable = planRev >= userCostInr
              return (
                <tr key={u.userId} className="hover:bg-zinc-800/30 transition">
                  <td className="px-4 py-3 text-xs text-zinc-200 truncate max-w-[200px]">{u.email || '(no email)'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      u.plan === 'pro' ? 'bg-violet-500/15 text-violet-300' :
                      u.plan === 'scale' ? 'bg-blue-500/15 text-blue-300' :
                      u.plan === 'lifetime' ? 'bg-amber-500/15 text-amber-300' :
                      'bg-zinc-800 text-zinc-500'
                    }`}>{u.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-300">{u.generations}</td>
                  <td className="px-4 py-3 text-right text-xs text-red-300 font-medium">₹{userCostInr.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-500">
                    {u.lastUsed ? new Date(u.lastUsed).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.plan === 'free' ? (
                      <span className="text-[10px] text-zinc-500">free tier</span>
                    ) : profitable ? (
                      <span className="text-[10px] text-green-400">✓ profitable</span>
                    ) : (
                      <span className="text-[10px] text-red-400">⚠ loss</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* HEALTH FOOTER */}
      <div className="mt-6 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 grid grid-cols-3 gap-4 text-xs">
        <div>
          <p className="text-zinc-500 mb-1">Avg cost per generation</p>
          <p className="text-white font-bold">
            ₹{data.summary.generations > 0 ? (costInr / data.summary.generations).toFixed(2) : '0.00'}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 mb-1">Cost per active user</p>
          <p className="text-white font-bold">
            ₹{data.summary.activeUsers > 0 ? (costInr / data.summary.activeUsers).toFixed(2) : '0.00'}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 mb-1">Tokens (in / out)</p>
          <p className="text-white font-bold">
            {(data.summary.inputTokens / 1000).toFixed(1)}K / {(data.summary.outputTokens / 1000).toFixed(1)}K
          </p>
        </div>
      </div>
    </>
  )
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg">{icon}</span>
        <span className={`text-xl font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-zinc-300 text-xs font-medium">{label}</p>
      <p className="text-zinc-600 text-xs mt-0.5">{sub}</p>
    </div>
  )
}
