'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const categories = ['SaaS Tools', 'AI Tools', 'Developer Tools', 'Finance', 'Marketing', 'Productivity', 'Design', 'Analytics', 'Other']

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState({ name: '', url: '', category: '', description: '', twitter: '' })
  const supabase = createClient()

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const handleAdd = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('products').insert({
      user_id: user.id,
      name: form.name,
      url: form.url,
      category: form.category,
      description: form.description,
      twitter: form.twitter,
      launch_status: 'active',
    })
    setForm({ name: '', url: '', category: '', description: '', twitter: '' })
    setShowModal(false)
    setSaving(false)
    fetchProducts()
  }

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
          <h1 className="text-2xl font-bold text-white">Products 📦</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage all your SaaS launches.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
          ➕ Add Product
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Products', val: products.length, icon: '📦' },
          { label: 'Active', val: products.filter(p => p.launch_status === 'active').length, icon: '🚀' },
          { label: 'Submitted', val: 0, icon: '✅' },
          { label: 'Backlinks', val: 0, icon: '🔗' },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{s.icon}</span>
              <span className="text-2xl font-bold text-white">{s.val}</span>
            </div>
            <p className="text-zinc-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-white font-semibold mb-2">No products yet</h3>
          <p className="text-zinc-500 text-sm mb-6">Add your first product to start launching.</p>
          <button onClick={() => setShowModal(true)} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition">
            Add Product →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                  {p.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{p.name}</h3>
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{p.launch_status}</span>
                    {p.category && <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{p.category}</span>}
                  </div>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-xs hover:text-violet-300">{p.url}</a>
                  {p.description && <p className="text-zinc-500 text-sm mt-1">{p.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setSelected(p)} className="text-xs border border-zinc-700 hover:border-zinc-500 text-zinc-400 px-3 py-2 rounded-lg transition">
                    Details
                  </button>
                  <a href="/dashboard/workspace" className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-lg transition">
                    Launch →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Add New Product</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-600 hover:text-zinc-400 text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Product Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dicrecto" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Product URL *</label>
                <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://yourproduct.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="One line description..." rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Twitter Handle</label>
                <input type="text" value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@yourhandle" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-zinc-700 text-zinc-400 text-sm py-2.5 rounded-lg">Cancel</button>
                <button onClick={handleAdd} disabled={!form.name || !form.url || saving} className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition">
                  {saving ? 'Saving...' : 'Add Product →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-zinc-400 text-xl">×</button>
            </div>
            <div className="space-y-2 mb-5">
              {[
                { label: 'URL', val: selected.url },
                { label: 'Category', val: selected.category || 'Not set' },
                { label: 'Status', val: selected.launch_status },
                { label: 'Twitter', val: selected.twitter || 'Not set' },
                { label: 'Description', val: selected.description || 'Not set' },
                { label: 'Added', val: new Date(selected.created_at).toLocaleDateString() },
              ].map((s) => (
                <div key={s.label} className="flex justify-between bg-zinc-800/50 rounded-lg px-4 py-2.5">
                  <span className="text-zinc-500 text-xs">{s.label}</span>
                  <span className="text-white text-xs font-medium">{s.val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 border border-zinc-700 text-zinc-400 text-sm py-2.5 rounded-lg">Close</button>
              <a href="/dashboard/workspace" className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg text-center">Launch →</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}