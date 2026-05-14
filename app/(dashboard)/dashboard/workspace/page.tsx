'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const defaultTasks = [
  { id: 1, label: 'Add product details', done: true },
  { id: 2, label: 'Generate Product Hunt copy', done: false },
  { id: 3, label: 'Generate Reddit copy', done: false },
  { id: 4, label: 'Submit to BetaList', done: false },
  { id: 5, label: 'Launch LinkedIn post', done: false },
  { id: 6, label: 'Submit to IndieHackers', done: false },
  { id: 7, label: 'Post on X/Twitter', done: false },
  { id: 8, label: 'Submit to Product Hunt', done: false },
]

const platforms = ['Product Hunt', 'X (Twitter)', 'LinkedIn', 'Reddit']
const tones = ['Founder', 'Technical', 'Casual', 'Storytelling', 'Launch-focused']

export default function WorkspacePage() {
  const [product, setProduct] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState(defaultTasks)
  const [activePlatform, setActivePlatform] = useState('Product Hunt')
  const [activeTone, setActiveTone] = useState('Founder')
  const [copied, setCopied] = useState(false)
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
          .select('*')
          .eq('product_id', prod.id)
        setSubmissions(subs || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const getContent = (platform: string, prod: any) => {
    if (!prod) return ''
    const name = prod.name
    const url = prod.url
    const desc = prod.description

    const map: Record<string, string> = {
      'Product Hunt': `🚀 Introducing ${name} — ${desc}

✅ Built for founders
✅ Start in minutes  
✅ Real results

Would love your support! 👇
${url}`,

      'X (Twitter)': `Just launched ${name} 🚀

${desc}

→ Live now at ${url}

#buildinpublic #saas #indiehacker`,

      'LinkedIn': `Excited to share ${name}!

${desc}

If you're a founder, check it out: ${url}

#buildinpublic #saas #startups`,

      'Reddit': `Hey r/SaaS! Just launched ${name} (${url})

**What it does:** ${desc}

Would love honest feedback!`,
    }

    return map[platform] || ''
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent(activePlatform, product))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const doneCount = tasks.filter(t => t.done).length
  const score = Math.round((doneCount / tasks.length) * 100)

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
          <p className="text-zinc-400 mb-4">No product found.</p>
          <a href="/dashboard/products" className="bg-violet-600 text-white text-sm px-4 py-2 rounded-lg">
            Add Product →
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Launch Workspace 🚀</h1>
          <p className="text-zinc-500 text-sm mt-1">Your complete launch command center.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
          <span className="text-violet-400 font-bold text-sm">{doneCount}/{tasks.length}</span>
          <span className="text-zinc-500 text-sm">tasks done</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="space-y-5">

          {/* Product Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Product Details</h3>
              <a href="/dashboard/products" className="text-xs text-violet-400 hover:text-violet-300">Edit</a>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-zinc-600 text-xs mb-1">Name</p>
                <p className="text-zinc-200 text-sm font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-zinc-600 text-xs mb-1">URL</p>
                <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm hover:text-violet-300">
                  {product.url}
                </a>
              </div>
              <div>
                <p className="text-zinc-600 text-xs mb-1">Category</p>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{product.category}</span>
              </div>
              <div>
                <p className="text-zinc-600 text-xs mb-1">Description</p>
                <p className="text-zinc-400 text-xs leading-relaxed">{product.description}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Launch Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Directories Submitted', val: submissions.length, color: 'text-blue-400' },
                { label: 'Approved', val: submissions.filter(s => s.status === 'approved').length, color: 'text-green-400' },
                { label: 'Pending', val: submissions.filter(s => s.status === 'submitted').length, color: 'text-yellow-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-zinc-500 text-xs">{s.label}</span>
                  <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Launch Checklist</h3>
              <span className="text-xs text-zinc-500">{score}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-4">
              <div
                className="bg-gradient-to-r from-violet-600 to-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="space-y-2">
              {tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center gap-3 text-left hover:bg-zinc-800/50 rounded-lg px-2 py-1.5 transition"
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs border transition ${task.done ? 'bg-violet-600 border-violet-600 text-white' : 'border-zinc-700 text-transparent'}`}>
                    ✓
                  </div>
                  <span className={`text-xs ${task.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                    {task.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT - AI Content */}
        <div className="col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">AI Launch Studio</h3>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">🤖 {product.name}</span>
            </div>

            {/* Platform tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {platforms.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePlatform(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${activePlatform === p ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Tone selector */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-zinc-600">Tone:</span>
              {tones.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTone(t)}
                  className={`text-xs px-2.5 py-1 rounded-full transition ${activeTone === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 mb-4 min-h-48">
              <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {getContent(activePlatform, product)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium py-2.5 rounded-lg transition"
              >
                {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
              </button>
              <a
                href="/dashboard/content"
                className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-medium py-2.5 rounded-lg transition text-center"
              >
                ✍️ Full Content Studio
              </a>
              <a
                href="/dashboard/directories"
                className="border border-zinc-700 hover:border-violet-500/50 text-zinc-300 text-xs font-medium px-4 py-2.5 rounded-lg transition"
              >
                📁 Directories
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}