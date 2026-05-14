'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (products && products.length > 0) setProduct(products[0])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Founder'

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}👋</h1>
          <p className="text-zinc-500 text-sm mt-1">Your launch mission control.</p>
        </div>
        <button className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
          ➕ Add Product
        </button>
      </div>

      {product && (
        <div className="bg-gradient-to-r from-violet-950/40 to-blue-950/30 border border-violet-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-1">Active Product</p>
              <h2 className="text-2xl font-bold text-white">{product.name}</h2>
              <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm hover:text-violet-300">
                {product.url}
              </a>
              <p className="text-zinc-400 text-sm mt-2">{product.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 mb-1">Launch Score</p>
              <p className="text-4xl font-bold text-violet-400">0%</p>
              <p className="text-zinc-600 text-xs mt-1">Just getting started!</p>
            </div>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-violet-600 to-blue-500 h-2 rounded-full w-0" />
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-white font-semibold text-sm">{product.category}</p>
              <p className="text-zinc-500 text-xs">Category</p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{product.launch_status}</p>
              <p className="text-zinc-500 text-xs">Status</p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{product.twitter || 'Not set'}</p>
              <p className="text-zinc-500 text-xs">Twitter</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Directories Available', val: '90+', sub: 'ready to submit', color: 'text-violet-400', icon: '📁' },
          { label: 'Submitted', val: '0', sub: 'submissions done', color: 'text-blue-400', icon: '🚀' },
          { label: 'Approved', val: '0', sub: 'live listings', color: 'text-green-400', icon: '✅' },
          { label: 'Backlinks', val: '0', sub: 'active links', color: 'text-yellow-400', icon: '🔗' },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{s.icon}</span>
              <span className={`text-xl font-bold ${s.color}`}>{s.val}</span>
            </div>
            <p className="text-zinc-300 text-xs font-medium">{s.label}</p>
            <p className="text-zinc-600 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-4">Next Steps</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '📁', label: 'Browse Directories', desc: 'Explore 90+ submission targets', href: '/dashboard/directories' },
            { icon: '✍️', label: 'Generate Content', desc: 'AI-powered launch copy for every platform', href: '/dashboard/content' },
            { icon: '🚀', label: 'Launch Workspace', desc: 'Manage your full launch checklist', href: '/dashboard/workspace' },
            { icon: '📦', label: 'Manage Products', desc: 'View and edit your products', href: '/dashboard/products' },
          ].map((a) => (
            <a key={a.label} href={a.href} className="bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 rounded-xl p-5 text-left transition group">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{a.icon}</span>
                <h3 className="font-semibold text-white group-hover:text-violet-300 transition">{a.label}</h3>
              </div>
              <p className="text-zinc-500 text-sm">{a.desc}</p>
            </a>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-4">Recent Submissions</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-white font-semibold mb-2">No submissions yet</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Start submitting <span className="text-white">{product?.name}</span> to directories.
          </p>
          <a href="/dashboard/directories" className="inline-block bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition">
            Browse Directories →
          </a>
        </div>
      </div>
    </>
  )
}