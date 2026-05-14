'use client'

import { useEffect, useState } from 'react'

interface ExtToken {
  id: string
  label: string
  token: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

const CHROME_STORE_URL = '#' // Replace once published

export default function ExtensionPage() {
  const [tokens, setTokens] = useState<ExtToken[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [reveal, setReveal] = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/extension/tokens')
    const data = await res.json()
    setTokens(data.tokens || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const createToken = async () => {
    setCreating(true)
    const res = await fetch('/api/extension/tokens', { method: 'POST', body: JSON.stringify({}) })
    const data = await res.json()
    if (data.token) {
      setReveal(r => ({ ...r, [data.token.id]: true }))
      setTokens(t => [data.token, ...t])
    }
    setCreating(false)
  }

  const revoke = async (id: string) => {
    if (!confirm('Revoke this token? The extension using it will be disconnected.')) return
    await fetch(`/api/extension/tokens?id=${id}`, { method: 'DELETE' })
    load()
  }

  const copy = (id: string, token: string) => {
    navigator.clipboard.writeText(token)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const active = tokens.filter(t => !t.revoked_at)

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Browser Extension 🧩</h1>
        <p className="text-zinc-500 text-sm mt-1">Autofill 100+ directory forms with one click from your browser.</p>
      </div>

      {/* Install section */}
      <div className="bg-gradient-to-br from-violet-950/40 to-blue-950/30 border border-violet-500/20 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-3 gap-6 items-start">
          <div className="col-span-2">
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Step 1</span>
            <h2 className="text-xl font-bold text-white mt-1 mb-2">Install Directo for Chrome</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Get the official Directo browser extension. Works on Chrome, Edge, Brave.
            </p>
            <div className="flex gap-3">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                🧩 Add to Chrome
              </a>
              <a
                href="/extension-dev-guide"
                className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Load unpacked (dev)
              </a>
            </div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 space-y-2">
            <p className="text-zinc-300 font-medium mb-1">What it does</p>
            <p>• Auto-fills name, URL, description, tagline</p>
            <p>• Smart category matching</p>
            <p>• Tracks every submission to Directo</p>
            <p>• You handle CAPTCHA &amp; final submit</p>
          </div>
        </div>
      </div>

      {/* Token section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Step 2</span>
            <h2 className="text-lg font-bold text-white mt-1">Connection token</h2>
          </div>
          <button
            onClick={createToken}
            disabled={creating}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {creating ? 'Generating...' : '+ Generate new token'}
          </button>
        </div>
        <p className="text-zinc-500 text-sm mb-5">Click "Generate", copy the token, paste it into the extension popup.</p>

        {loading ? (
          <div className="text-zinc-600 text-sm text-center py-8">Loading...</div>
        ) : active.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
            <div className="text-4xl mb-3">🔑</div>
            <p className="text-zinc-400 text-sm mb-1">No tokens yet</p>
            <p className="text-zinc-600 text-xs">Click "Generate new token" to pair the extension</p>
          </div>
        ) : (
          <div className="space-y-2">
            {active.map(t => (
              <div key={t.id} className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white text-sm font-medium">{t.label}</p>
                    <p className="text-zinc-600 text-xs">
                      Created {new Date(t.created_at).toLocaleDateString()} ·
                      Last used {t.last_used_at ? new Date(t.last_used_at).toLocaleString() : 'never'}
                    </p>
                  </div>
                  <button
                    onClick={() => revoke(t.id)}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg"
                  >
                    Revoke
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5">
                  <code className="flex-1 text-xs text-violet-300 font-mono break-all">
                    {reveal[t.id] ? t.token : `${t.token.slice(0, 18)}${'•'.repeat(20)}${t.token.slice(-4)}`}
                  </code>
                  <button
                    onClick={() => setReveal(r => ({ ...r, [t.id]: !r[t.id] }))}
                    className="text-xs text-zinc-500 hover:text-zinc-300 px-2"
                  >
                    {reveal[t.id] ? '🙈 Hide' : '👁 Show'}
                  </button>
                  <button
                    onClick={() => copy(t.id, t.token)}
                    className="text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 px-3 py-1 rounded transition"
                  >
                    {copied === t.id ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup steps */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">How to pair</h3>
        <ol className="space-y-3 text-sm text-zinc-300">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-violet-600/20 text-violet-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <span>Install the Directo Chrome extension (link above)</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-violet-600/20 text-violet-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span>Generate a token above &amp; copy it</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-violet-600/20 text-violet-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <span>Click the Directo extension icon in browser → paste token → Connect</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-violet-600/20 text-violet-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
            <span>Visit any supported directory's submit page — Directo widget appears in bottom-right</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-violet-600/20 text-violet-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
            <span>Click <strong className="text-violet-300">⚡ Autofill</strong> — review &amp; submit</span>
          </li>
        </ol>
      </div>

      <p className="text-zinc-600 text-xs text-center mt-6">
        Keep your token secret. Anyone with this token can read your product info &amp; log submissions.
      </p>
    </>
  )
}
