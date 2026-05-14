'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const catLabel: Record<string, string> = {
  tier1: 'Tier 1',
  ai: 'AI Tools',
  launch: 'Launch',
  nocode: 'No-Code',
  integration: 'Integration',
  marketing: 'Marketing',
  directory: 'Directory',
}

// New status hierarchy: visited → submitted → in_review → approved | rejected
const statusStyles: Record<string, string> = {
  visited: 'text-amber-400 bg-amber-400/10',
  submitted: 'text-blue-400 bg-blue-400/10',
  in_review: 'text-purple-400 bg-purple-400/10',
  approved: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
  none: 'text-zinc-600 bg-zinc-800',
}
const statusLabel: Record<string, string> = {
  visited: 'Visited',
  submitted: 'Submitted',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  none: 'Not started',
}

export default function DirectoriesPage() {
  const [dirs, setDirs] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [confirmDir, setConfirmDir] = useState<any>(null) // "Did you submit?" modal
  const pendingConfirmRef = useRef<any>(null)
  const supabase = createClient()

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: dirData }, { data: productData }] = await Promise.all([
      supabase.from('directories').select('*').order('domain_rating', { ascending: false }),
      supabase.from('products').select('*').eq('user_id', user.id).single(),
    ])

    setDirs(dirData || [])
    setProduct(productData)

    if (productData) {
      const { data: subData } = await supabase
        .from('submissions').select('*').eq('product_id', productData.id)
      setSubmissions(subData || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // When user returns to this tab AFTER visiting a directory → ask confirmation
  useEffect(() => {
    const onFocus = () => {
      if (pendingConfirmRef.current) {
        setConfirmDir(pendingConfirmRef.current)
        pendingConfirmRef.current = null
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus()
    })
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const getSub = (dirId: string) => submissions.find(s => s.directory_id === dirId)
  const getStatus = (dirId: string) => getSub(dirId)?.status || 'none'

  const upsertSubmission = async (dir: any, patch: any) => {
    if (!product) return
    const existing = getSub(dir.id)
    if (existing) {
      await supabase.from('submissions').update({
        ...patch,
        submitted_at: patch.submitted_at ?? new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabase.from('submissions').insert({
        product_id: product.id,
        directory_id: dir.id,
        submitted_via: 'manual',
        submitted_at: new Date().toISOString(),
        ...patch,
      })
    }
    // Refresh submissions
    const { data } = await supabase.from('submissions').select('*').eq('product_id', product.id)
    setSubmissions(data || [])
  }

  // Step 1: Click "Visit & submit" → opens URL + marks as 'visited' (NOT submitted!)
  const handleStartSubmit = async (dir: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!product) return
    setSubmitting(dir.id)

    const existing = getSub(dir.id)
    if (!existing || existing.status === 'none') {
      await upsertSubmission(dir, { status: 'visited', verified: false, verification_method: 'none' })
    }

    // Queue the "Did you submit?" confirm — fires when user returns to this tab
    pendingConfirmRef.current = dir

    setSubmitting(null)
    window.open(dir.url, '_blank')
  }

  // Step 2: When user comes back → confirm modal asks if they actually submitted
  const handleConfirm = async (didSubmit: boolean) => {
    if (!confirmDir) return
    if (didSubmit) {
      await upsertSubmission(confirmDir, {
        status: 'submitted',
        verified: true,
        verification_method: 'manual_confirm',
        verified_at: new Date().toISOString(),
      })
    } else {
      // Keep as visited — user can confirm later
      await upsertSubmission(confirmDir, { status: 'visited' })
    }
    setConfirmDir(null)
  }

  // Manual status override (from detail panel)
  const handleStatusChange = async (dir: any, newStatus: string) => {
    await upsertSubmission(dir, {
      status: newStatus,
      verified: newStatus === 'approved' || newStatus === 'rejected'
        ? true
        : (getSub(dir.id)?.verified ?? false),
    })
  }

  const cats = ['All', ...Array.from(new Set(dirs.map(d => d.category)))]
  const statusFilters = [
    { id: 'all', label: 'All' },
    { id: 'none', label: 'Not started' },
    { id: 'visited', label: 'Visited' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'approved', label: 'Approved' },
  ]

  const filtered = dirs.filter(d => {
    const matchCat = cat === 'All' || d.category === cat
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    const s = getStatus(d.id)
    const matchStatus = statusFilter === 'all' || statusFilter === s
    return matchCat && matchSearch && matchStatus
  })

  // Counts
  const visitedCount = submissions.filter(s => s.status === 'visited').length
  const submittedCount = submissions.filter(s => ['submitted', 'in_review', 'approved'].includes(s.status)).length
  const verifiedCount = submissions.filter(s => s.verified === true).length
  const approvedCount = submissions.filter(s => s.status === 'approved').length

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
          <h1 className="text-2xl font-bold text-white">Directories 📁</h1>
          <p className="text-zinc-500 text-sm mt-1">{dirs.length} directories — only verified submissions count.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-3">
          <Stat label="Visited" val={visitedCount} color="text-amber-400" />
          <span className="text-zinc-700">|</span>
          <Stat label="Submitted" val={submittedCount} color="text-blue-400" />
          <span className="text-zinc-700">|</span>
          <Stat label="Verified" val={verifiedCount} color="text-violet-400" />
          <span className="text-zinc-700">|</span>
          <Stat label="Approved" val={approvedCount} color="text-green-400" />
        </div>
      </div>

      <div className={selected ? 'grid grid-cols-3 gap-6' : 'block'}>
        <div className={selected ? 'col-span-2' : ''}>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <input
              type="text"
              placeholder="Search directories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 w-52"
            />
            <div className="flex gap-2 flex-wrap">
              {cats.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${cat === c ? 'bg-violet-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                  {c === 'All' ? 'All' : catLabel[c] || c}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-zinc-600">Status:</span>
            {statusFilters.map(s => (
              <button key={s.id} onClick={() => setStatusFilter(s.id)}
                className={`text-xs px-3 py-1 rounded-md transition ${statusFilter === s.id ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-600 text-xs border-b border-zinc-800 bg-zinc-950/50">
                  <th className="text-left px-4 py-3 font-medium">Directory</th>
                  <th className="text-left px-4 py-3 font-medium">DR</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filtered.map(d => {
                  const sub = getSub(d.id)
                  const status = sub?.status || 'none'
                  const isVerified = !!sub?.verified
                  return (
                    <tr key={d.id}
                      onClick={() => setSelected(selected?.id === d.id ? null : d)}
                      className={`hover:bg-zinc-800/30 transition cursor-pointer ${selected?.id === d.id ? 'bg-violet-600/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
                            {d.name[0]}
                          </div>
                          <div>
                            <p className="text-zinc-200 font-medium text-xs">{d.name}</p>
                            <p className="text-zinc-600 text-xs">{d.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${d.domain_rating >= 80 ? 'text-green-400' : d.domain_rating >= 60 ? 'text-yellow-400' : 'text-zinc-400'}`}>
                          {d.domain_rating}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                          {catLabel[d.category] || d.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[status] || statusStyles.none}`}>
                            {statusLabel[status] || status}
                          </span>
                          {isVerified && status !== 'visited' && status !== 'none' && (
                            <span title="Verified submission" className="text-green-400 text-xs">✓</span>
                          )}
                          {status === 'visited' && (
                            <span title="Visited but not confirmed as submitted" className="text-amber-500 text-xs">?</span>
                          )}
                          {sub?.submitted_via === 'extension' && (
                            <span title="Submitted via Directo extension" className="text-violet-400 text-[10px]">🧩</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {status === 'none' ? (
                          <button onClick={(e) => handleStartSubmit(d, e)}
                            disabled={submitting === d.id}
                            style={{fontSize: '12px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer'}}>
                            {submitting === d.id ? 'Opening...' : 'Visit & submit →'}
                          </button>
                        ) : status === 'visited' ? (
                          <button onClick={(e) => { e.stopPropagation(); setConfirmDir(d) }}
                            style={{fontSize: '12px', color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer'}}>
                            Confirm status
                          </button>
                        ) : (
                          <a href={d.url} target="_blank" rel="noopener noreferrer"
                             onClick={(e) => e.stopPropagation()}
                             style={{ fontSize: '12px', color: '#a78bfa' }}>
                            Visit
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="col-span-1">
            <DetailPanel
              dir={selected}
              sub={getSub(selected.id)}
              onClose={() => setSelected(null)}
              onStartSubmit={(e: React.MouseEvent) => handleStartSubmit(selected, e)}
              onStatusChange={(s) => handleStatusChange(selected, s)}
              submitting={submitting === selected.id}
            />
          </div>
        )}
      </div>

      {/* Confirm-submission modal */}
      {confirmDir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-start gap-3 mb-5">
              <div className="text-3xl">🤔</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">Did you submit to {confirmDir.name}?</h2>
                <p className="text-zinc-500 text-sm mt-1">Be honest — we only count verified submissions in your launch stats.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleConfirm(true)}
                className="bg-green-600/15 border border-green-500/30 hover:bg-green-600/25 text-green-300 text-sm font-medium py-3 rounded-lg transition">
                ✓ Yes, I submitted
              </button>
              <button onClick={() => handleConfirm(false)}
                className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-sm font-medium py-3 rounded-lg transition">
                Not yet — remind me
              </button>
            </div>
            <p className="text-zinc-600 text-xs text-center mt-4">
              💡 Tip: Install the <a href="/dashboard/extension" className="text-violet-400 hover:underline">Directo extension</a> to verify submissions automatically.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function Stat({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <span className="text-xs text-zinc-500">
      {label}: <span className={`${color} font-bold`}>{val}</span>
    </span>
  )
}

function DetailPanel({ dir, sub, onClose, onStartSubmit, onStatusChange, submitting }: any) {
  const status = sub?.status || 'none'
  const isVerified = !!sub?.verified

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky top-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">{dir.name}</h3>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-lg leading-none">×</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Domain Rating', val: dir.domain_rating },
          { label: 'Category', val: catLabel[dir.category] || dir.category },
          { label: 'Status', val: statusLabel[status] || status },
          { label: 'Verified', val: isVerified ? '✓ Yes' : 'No' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-800/60 rounded-lg p-3">
            <p className="text-zinc-600 text-xs mb-1">{s.label}</p>
            <p className="text-white text-sm font-semibold">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Status manual override */}
      {status !== 'none' && (
        <div className="bg-zinc-800/40 rounded-lg p-4 mb-5">
          <p className="text-xs text-zinc-400 font-medium mb-2">Update status manually</p>
          <div className="grid grid-cols-3 gap-1.5">
            {['visited', 'submitted', 'in_review', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => onStatusChange(s)}
                className={`text-xs px-2 py-1.5 rounded-md transition ${status === s ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                {statusLabel[s]}
              </button>
            ))}
          </div>
          {sub?.verification_method && sub.verification_method !== 'none' && (
            <p className="text-xs text-zinc-600 mt-3">
              Verified via: <span className="text-zinc-400">{sub.verification_method.replace('_', ' ')}</span>
            </p>
          )}
        </div>
      )}

      <div className="bg-zinc-800/40 rounded-lg p-4 mb-5">
        <p className="text-xs text-zinc-400 font-medium mb-2">💡 Submission Tips</p>
        <ul className="space-y-1.5 text-xs text-zinc-500">
          <li>• Clear tagline under 60 chars</li>
          <li>• Logo 512x512px PNG</li>
          <li>• Min 3 product screenshots</li>
          <li>• Compelling description</li>
        </ul>
      </div>

      <div className="space-y-2">
        <button onClick={onStartSubmit} disabled={submitting}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium py-2.5 rounded-lg transition">
          {submitting ? 'Opening...' :
           status === 'none' ? `Visit & submit to ${dir.name}` :
           status === 'visited' ? `Continue submission` :
           `Re-visit ${dir.name}`}
        </button>
        <a href={dir.url} target="_blank" rel="noopener noreferrer"
           className="block text-center w-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-medium py-2.5 rounded-lg transition">
          Open website
        </a>
      </div>
    </div>
  )
}
