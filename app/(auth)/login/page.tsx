'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/dashboard` }
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-[#0a0a0a] to-blue-950/30" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-white font-semibold text-lg">Dicrecto</span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="relative z-10 space-y-4">
          <p className="text-zinc-400 text-sm uppercase tracking-widest font-medium">Trusted by founders</p>
          
          {/* Floating stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">90+</p>
              <p className="text-zinc-500 text-xs mt-1">Directories covered</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">2 min</p>
              <p className="text-zinc-500 text-xs mt-1">To launch everywhere</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-violet-400">Auto</p>
              <p className="text-zinc-500 text-xs mt-1">Submission engine</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">Live</p>
              <p className="text-zinc-500 text-xs mt-1">Backlink tracking</p>
            </div>
          </div>

          {/* Quote */}
          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-xl p-4 mt-4">
            <p className="text-zinc-300 text-sm italic">"Submitted my SaaS to 50 directories in one click. Got 3 backlinks on day one."</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 bg-violet-600 rounded-full" />
              <p className="text-zinc-500 text-xs">Indie founder, ProductHunt</p>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Launch your SaaS<br />
            <span className="text-violet-400">everywhere.</span>
          </h2>
          <p className="text-zinc-500 mt-2 text-sm">One platform. 90+ directories. Zero hassle.</p>
        </div>
      </div>

      {/* Right side - Auth */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-white font-semibold text-lg">Dicrecto</span>
          </div>

          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-zinc-500 text-sm mt-1 mb-8">Sign in to your launch dashboard</p>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium rounded-lg py-2.5 px-4 transition mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">or continue with email</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@startup.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm text-zinc-400">Password</label>
                <span className="text-xs text-violet-400 cursor-pointer hover:text-violet-300">Forgot password?</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition text-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Trust */}
          <p className="text-zinc-600 text-xs text-center mt-4">
            🔒 Your data is encrypted and private
          </p>

          <p className="text-zinc-500 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}