'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { icon: '🏠', label: 'Overview', href: '/dashboard' },
  { icon: '🚀', label: 'Launch Queue', href: '/dashboard/launch' },
  { icon: '📁', label: 'Directories', href: '/dashboard/directories' },
  { icon: '✍️', label: 'Social Content', href: '/dashboard/content' },
  { icon: '🧩', label: 'Extension', href: '/dashboard/extension' },
  { icon: '📊', label: 'Analytics', href: '/dashboard/analytics' },
  { icon: '📦', label: 'Products', href: '/dashboard/products' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles').select('is_admin').eq('id', user.id).single()
        setIsAdmin(!!profile?.is_admin)
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Founder'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">

      {/* SIDEBAR */}
      <div className="fixed left-0 top-0 h-full w-56 bg-zinc-950 border-r border-zinc-900 flex flex-col z-20">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="font-semibold text-white">Directo</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                pathname === item.href
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition mt-2 border-t border-zinc-900 pt-3 ${
                pathname === '/dashboard/admin'
                  ? 'bg-amber-600/15 text-amber-300 border border-amber-500/20'
                  : 'text-amber-500/70 hover:text-amber-300 hover:bg-zinc-900'
              }`}
            >
              <span className="text-base">🛡️</span>
              Admin · Cost
            </Link>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {firstName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{firstName}</p>
              <p className="text-xs text-zinc-600 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-red-400 hover:bg-zinc-900 transition"
          >
            <span>🚪</span> Sign out
          </button>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="ml-56 flex-1 p-8">
        {children}
      </div>

    </div>
  )
}