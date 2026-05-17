'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Directory {
  id: string
  slug: string
  name: string
  url: string
  domain_rating: number
  category: string
}

interface QueueItem {
  itemId: string
  position: number
  status: string
  directory: Directory
}

interface Session {
  id: string
  status: 'queued'|'running'|'paused'|'done'|'cancelled'
  total: number
  completed: number
  pause_reason: string | null
  created_at: string
}

export default function LaunchPage() {
  const [dirs, setDirs] = useState<Directory[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [session, setSession] = useState<Session | null>(null)
  const [items, setItems] = useState<QueueItem[]>([])
  const [starting, setStarting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const pollRef = useRef<any>(null)

  // Initial load: directories + any active session
  useEffect(() => {
    ;(async () => {
      const [{ data: dirData }, statusRes] = await Promise.all([
        supabase.from('directories').select('id, slug, name, url, domain_rating, category')
          .order('domain_rating', { ascending: false }),
        fetch('/api/extension/launch/status').then(r => r.json()).catch(() => ({})),
      ])
      setDirs(dirData || [])
      if (statusRes?.session) {
        setSession(statusRes.session)
        setItems(statusRes.items || [])
      }
      setLoading(false)
    })()
  }, [])

  // Poll session status when one is active
  useEffect(() => {
    if (!session || ['done','cancelled'].includes(session.status)) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    pollRef.current = setInterval(async () => {
      const res = await fetch('/api/extension/launch/status').then(r => r.json()).catch(() => null)
      if (res?.session) {
        setSession(res.session)
        setItems(res.items || [])
      } else {
        // session ended
        setSession(s => s ? { ...s, status: 'done' } : null)
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [session?.id, session?.status])

  const toggle = (slug: string) => {
    setSelected(s => {
      const n = new Set(s)
      n.has(slug) ? n.delete(slug) : n.add(slug)
      return n
    })
  }
  const selectAll = () => setSelected(new Set(dirs.map(d => d.slug)))
  const clearAll = () => setSelected(new Set())

  const startLaunch = async () => {
    if (selected.size === 0) return
    setStarting(true); setErr(null)
    try {
      const slugs = dirs.filter(d => selected.has(d.slug)).map(d => d.slug)
      const res = await fetch('/api/extension/launch/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directorySlugs: slugs }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start')
      // Reload status
      const status = await fetch('/api/extension/launch/status').then(r => r.json())
      setSession(status.session)
      setItems(status.items || [])
      setSelected(new Set())
    } catch (e: any) {
      setErr(e.message)
    }
    setStarting(false)
  }

 const cancel = async () => {
  if (!session) return
  if (!confirm('Cancel this launch queue?')) return
  await fetch('/api/extension/launch/advance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: session.id, action: 'cancel' }),
  })
  setSession(null)
  setItems([])
}

  const pause = async () => {
    if (!session) return
    await fetch('/api/extension/launch/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, action: 'pause' }),
    })
    setSession(s => s ? { ...s, status: 'paused' } : null)
  }

  const resume = async () => {
    if (!session) return
    await fetch('/api/extension/launch/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, action: 'resume' }),
    })
    setSession(s => s ? { ...s, status: 'running', pause_reason: null } : null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isActive = session && ['running','paused'].includes(session.status)
  const progress = session ? Math.round((session.completed / Math.max(1, session.total)) * 100) : 0

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Launch Queue 🚀</h1>
          <p className="text-zinc-500 text-sm mt-1">Pick directories. Directo extension opens each tab, AI fills, you submit.</p>
        </div>
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
          ⚠️ {err}
        </div>
      )}

      {/* Active session panel */}
      {isActive && session && (
        <div className="bg-gradient-to-r from-violet-950/40 to-blue-950/30 border border-violet-500/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-1">
                {session.status === 'paused' ? '⏸ Paused' : '🚀 Running'}
              </p>
              <h2 className="text-xl font-bold text-white">
                {session.completed} / {session.total} directories submitted
              </h2>
              {session.pause_reason && (
                <p className="text-amber-400 text-sm mt-1">
                  Paused: <span className="font-medium">{session.pause_reason.replace('_', ' ')}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {session.status === 'running' && (
                <button onClick={pause} className="text-xs border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg hover:border-zinc-500">
                  ⏸ Pause
                </button>
              )}
              {session.status === 'paused' && (
                <button onClick={resume} className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg">
                  ▶ Resume
                </button>
              )}
              <button onClick={cancel} className="text-xs border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                Cancel
              </button>
            </div>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 mb-3">
            <div
              className="bg-gradient-to-r from-violet-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            💡 Keep your browser open. Directo extension will guide you tab-by-tab. Get notification when human input needed.
          </p>
        </div>
      )}

      {/* Queue items list (when active session) */}
      {isActive && items.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Queue progress</h3>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-zinc-800/50">
              {items.map(item => {
                const d = item.directory
                if (!d) return null
                const isActiveRow = item.status === 'active'
                return (
                  <tr key={item.itemId} className={isActiveRow ? 'bg-violet-600/5' : ''}>
                    <td className="px-4 py-3 w-10 text-center text-zinc-600 text-xs">{item.position + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-400">
                          {d.name[0]}
                        </div>
                        <div>
                          <p className="text-zinc-200 text-xs font-medium">{d.name}</p>
                          <p className="text-zinc-600 text-xs">{d.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === 'pending' && <span className="text-xs text-zinc-600">Waiting</span>}
                      {item.status === 'active' && <span className="text-xs text-violet-400 font-medium">⚡ Active now</span>}
                      {item.status === 'submitted' && <span className="text-xs text-green-400">✓ Submitted</span>}
                      {item.status === 'skipped' && <span className="text-xs text-zinc-500">⊘ Skipped</span>}
                      {item.status === 'failed' && <span className="text-xs text-red-400">✗ Failed</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Directory picker (when no active session) */}
      {!isActive && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-zinc-400">
              <span className="text-white font-medium">{selected.size}</span> of {dirs.length} selected
            </div>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 border border-zinc-800 rounded-lg">Select all</button>
              <button onClick={clearAll} className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 border border-zinc-800 rounded-lg">Clear</button>
              <button
                onClick={startLaunch}
                disabled={selected.size === 0 || starting}
                className="text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium px-5 py-1.5 rounded-lg"
              >
                {starting ? 'Starting...' : `🚀 Start launch (${selected.size})`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {dirs.map(d => {
              const isSel = selected.has(d.slug)
              return (
                <button
                  key={d.id}
                  onClick={() => toggle(d.slug)}
                  className={`text-left p-4 rounded-xl border transition ${
                    isSel
                      ? 'bg-violet-600/10 border-violet-500/40'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-400">
                        {d.name[0]}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{d.name}</p>
                        <p className="text-zinc-500 text-xs">{d.url}</p>
                      </div>
                    </div>
                    {isSel && <span className="text-violet-400 text-sm">✓</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs font-bold ${d.domain_rating >= 80 ? 'text-green-400' : d.domain_rating >= 60 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                      DR {d.domain_rating}
                    </span>
                    <span className="text-xs text-zinc-600">·</span>
                    <span className="text-xs text-zinc-500">{d.category}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Done state */}
      {session && session.status === 'done' && (
        <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-white font-semibold mb-2">Launch complete!</h3>
          <p className="text-zinc-400 text-sm mb-5">{session.completed} of {session.total} directories submitted.</p>
          <button onClick={() => setSession(null)} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-5 py-2 rounded-lg">
            Start new launch →
          </button>
        </div>
      )}

      <p className="text-zinc-600 text-xs text-center mt-6">
        Need the extension? <a href="/dashboard/extension" className="text-violet-400 hover:underline">Install it here</a>.
      </p>
    </>
  )
}
