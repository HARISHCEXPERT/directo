'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const platforms = [
  { id: 'producthunt', name: 'Product Hunt', icon: '🎯', color: 'text-orange-400', submit: 'https://producthunt.com/posts/new' },
  { id: 'twitter',     name: 'X (Twitter)',  icon: '🐦', color: 'text-blue-400',   submit: 'https://twitter.com/compose/post' },
  { id: 'linkedin',    name: 'LinkedIn',     icon: '💼', color: 'text-blue-500',   submit: 'https://www.linkedin.com/feed/?shareActive=true' },
  { id: 'reddit',      name: 'Reddit',       icon: '🤖', color: 'text-orange-500', submit: 'https://www.reddit.com/r/SaaS/submit' },
  { id: 'hackernews',  name: 'Hacker News',  icon: '🔶', color: 'text-orange-400', submit: 'https://news.ycombinator.com/submit' },
  { id: 'indiehackers',name: 'IndieHackers', icon: '⚡', color: 'text-violet-400', submit: 'https://www.indiehackers.com/new-post' },
] as const

type PlatformId = typeof platforms[number]['id']

const tones = ['Founder', 'Technical', 'Casual', 'Storytelling', 'Launch-focused'] as const
type Tone = typeof tones[number]

interface GenMeta {
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  used: number
  quota: number
  plan: string
}

export default function ContentPage() {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTone, setActiveTone] = useState<Tone>('Founder')
  const [copied, setCopied] = useState<string | null>(null)
  const [content, setContent] = useState<Record<string, string>>({})
  const [meta, setMeta] = useState<Record<string, GenMeta>>({})
  const [genStatus, setGenStatus] = useState<Record<string, 'idle' | 'loading' | 'error'>>({})
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; quota: number; plan: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('products').select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1)
      setProduct(data?.[0] ?? null)
      setLoading(false)
    }
    load()
  }, [])

  const generate = async (platformId: PlatformId) => {
    setErrMsg(null)
    setGenStatus(s => ({ ...s, [platformId]: 'loading' }))

    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId, tone: activeTone }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'quota_exceeded') {
          setErrMsg(data.message || 'Monthly quota exceeded — upgrade plan to continue.')
          setQuotaInfo({ used: data.used, quota: data.quota, plan: data.plan })
        } else {
          setErrMsg(data.message || 'Generation failed. Please retry.')
        }
        setGenStatus(s => ({ ...s, [platformId]: 'error' }))
        return
      }

      setContent(c => ({ ...c, [platformId]: data.text }))
      setMeta(m => ({ ...m, [platformId]: data.meta }))
      setQuotaInfo({ used: data.meta.used, quota: data.meta.quota, plan: data.meta.plan })
      setGenStatus(s => ({ ...s, [platformId]: 'idle' }))
    } catch (e: any) {
      setErrMsg(e?.message || 'Network error')
      setGenStatus(s => ({ ...s, [platformId]: 'error' }))
    }
  }

  const generateAll = async () => {
    for (const p of platforms) {
      // eslint-disable-next-line no-await-in-loop
      await generate(p.id)
    }
  }

  const handleCopy = (platformId: string) => {
    navigator.clipboard.writeText(content[platformId] || '')
    setCopied(platformId)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No product found. Add a product first.</p>
          <a href="/dashboard/products" className="bg-violet-600 text-white text-sm px-4 py-2 rounded-lg">Add Product →</a>
        </div>
      </div>
    )
  }

  const anyGenerating = Object.values(genStatus).some(s => s === 'loading')

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Content ✍️</h1>
          <p className="text-zinc-500 text-sm mt-1">AI-crafted launch copy. Native tone per platform.</p>
        </div>
        <div className="flex items-center gap-3">
          {quotaInfo && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs">
              <span className="text-zinc-500">Used: </span>
              <span className="text-white font-bold">{quotaInfo.used}</span>
              <span className="text-zinc-600"> / {quotaInfo.quota}</span>
              <span className="text-zinc-700 mx-2">|</span>
              <span className="text-violet-400 capitalize">{quotaInfo.plan}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <span className="text-xs text-zinc-500">Product:</span>
            <span className="text-xs text-white font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {errMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
          ⚠️ {errMsg}
        </div>
      )}

      {/* Tone selector + Generate-all */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-zinc-500 font-medium">Tone:</span>
          {tones.map(t => (
            <button
              key={t}
              onClick={() => setActiveTone(t)}
              className={`text-xs px-4 py-2 rounded-lg transition font-medium ${activeTone === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={generateAll}
          disabled={anyGenerating}
          className="text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          {anyGenerating ? 'Generating...' : '⚡ Generate All'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {platforms.map(p => {
          const status = genStatus[p.id] || 'idle'
          const m = meta[p.id]
          const text = content[p.id] || ''
          return (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className={`text-sm font-semibold ${p.color}`}>{p.name}</span>
                </div>
                {m && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full" title={`${m.inputTokens}in / ${m.outputTokens}out · $${m.costUsd.toFixed(4)}`}>
                    {m.model.includes('haiku') ? 'Haiku' : m.model.includes('opus') ? 'Opus' : 'Sonnet'} · ${m.costUsd.toFixed(3)}
                  </span>
                )}
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3 mb-4 h-48 overflow-y-auto relative">
                {status === 'loading' ? (
                  <div className="flex items-center gap-2 h-full justify-center">
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-500 text-xs">Writing for {p.name}...</span>
                  </div>
                ) : text ? (
                  <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">{text}</pre>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-zinc-600 text-xs">Click Generate to write a {p.name} post</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(p.id)}
                  disabled={!text}
                  className="flex-1 bg-violet-600/20 hover:bg-violet-600/30 disabled:opacity-30 border border-violet-500/20 text-violet-300 text-xs font-medium py-2 rounded-lg transition"
                >
                  {copied === p.id ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={() => generate(p.id)}
                  disabled={status === 'loading'}
                  className="flex-1 border border-zinc-700 hover:border-zinc-500 disabled:opacity-30 text-zinc-400 text-xs font-medium py-2 rounded-lg transition"
                >
                  {text ? '🔄 Regenerate' : '⚡ Generate'}
                </button>
                <a
                  href={p.submit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-xs px-3 py-2 rounded-lg transition"
                  title={`Open ${p.name}`}
                >
                  🔗
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cost transparency footer */}
      <div className="mt-8 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500">
          💡 <span className="text-zinc-400 font-medium">How this works:</span> Each platform uses a different prompt tuned for that community.
          Hacker News gets technical prose, Product Hunt gets bullets &amp; emoji, Reddit gets honest founder vibes.
          Free plan uses Claude Haiku; Pro &amp; Scale use Sonnet 4.5 for premium tone.
        </p>
      </div>
    </>
  )
}
