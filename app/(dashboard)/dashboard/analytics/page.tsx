'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AnalyticsPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [directories, setDirectories] = useState<any[]>([])
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProduct(prod)

      if (prod) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*, directories(*)')
          .eq('product_id', prod.id)
        setSubmissions(subs || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const submitted = submissions.length
  const approved = submissions.filter(s => s.status === 'approved').length
  const pending = submissions.filter(s => s.status === 'submitted').length
  const rejected = submissions.filter(s => s.status === 'rejected').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics 📊</h1>
          <p className="text-zinc-500 text-sm mt-1">Track your launch visibility and submission progress.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-md transition ${period === p ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Submitted', val: submitted, change: 'directories', color: 'text-blue-400', icon: '🚀' },
          { label: 'Approved', val: approved, change: 'live listings', color: 'text-green-400', icon: '✅' },
          { label: 'Pending', val: pending, change: 'in review', color: 'text-yellow-400', icon: '⏳' },
          { label: 'Rejected', val: rejected, change: 'need fix', color: 'text-red-400', icon: '❌' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{s.icon}</span>
              <span className={`text-2xl font-bold ${s.color}`}>{s.val}</span>
            </div>
            <p className="text-zinc-300 text-xs font-medium">{s.label}</p>
            <p className="text-zinc-600 text-xs">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Launch Coverage</h3>
          <span className="text-xs text-zinc-500">{submitted} of 86 directories</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-3 mb-3">
          <div
            className="bg-gradient-to-r from-violet-600 to-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min((submitted / 86) * 100, 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-6 text-xs">
          <span className="text-zinc-500">
            <span className="text-blue-400 font-bold">{submitted}</span> submitted
          </span>
          <span className="text-zinc-500">
            <span className="text-green-400 font-bold">{approved}</span> approved
          </span>
          <span className="text-zinc-500">
            <span className="text-zinc-400 font-bold">{86 - submitted}</span> remaining
          </span>
        </div>
      </div>

      {/* Submissions table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Submission History</h3>
          <a href="/dashboard/directories" className="text-xs text-violet-400 hover:text-violet-300">
            Submit more →
          </a>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-white font-semibold mb-2">No submissions yet</h3>
            <p className="text-zinc-500 text-sm mb-6">Start submitting to directories to track your progress.</p>
            <a
              href="/dashboard/directories"
              className="inline-block bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
            >
              Browse Directories →
            </a>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-600 text-xs border-b border-zinc-800">
                <th className="text-left pb-3 font-medium">Directory</th>
                <th className="text-left pb-3 font-medium">DR</th>
                <th className="text-left pb-3 font-medium">Submitted</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-right pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {submissions.map(s => (
                <tr key={s.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-800 rounded-md flex items-center justify-center text-xs font-bold text-zinc-400">
                        {s.directories?.name?.[0] || '?'}
                      </div>
                      <span className="text-zinc-200 text-xs font-medium">{s.directories?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-bold ${(s.directories?.domain_rating || 0) >= 80 ? 'text-green-400' : (s.directories?.domain_rating || 0) >= 60 ? 'text-yellow-400' : 'text-zinc-400'}`}>
                      {s.directories?.domain_rating || '—'}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-400 text-xs">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      s.status === 'approved' ? 'text-green-400 bg-green-400/10' :
                      s.status === 'submitted' ? 'text-blue-400 bg-blue-400/10' :
                      s.status === 'rejected' ? 'text-red-400 bg-red-400/10' :
                      'text-yellow-400 bg-yellow-400/10'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <a
                      href={s.directories?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{fontSize: '12px', color: '#a78bfa'}}
                    >
                      Visit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}