'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill all fields')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${location.origin}/dashboard`
      }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/dashboard` }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="w-12 h-12 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
            <p className="text-zinc-400 text-sm">
              We sent a confirmation link to{' '}
              <span className="text-white font-medium">{email}</span>.
              Click it to activate your account.
            </p>
            <p className="text-zinc-600 text-xs mt-4">No spam. Ever.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-[#0a0a0a] to-blue-950/30" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-white font-semibold text-lg">Dicrecto</span>
          </div>
        </div>

        {/* Steps preview */}
        <div className="relative z-10 space-y-3">
          <p className="text-zinc-400 text-sm uppercase tracking-widest font-medium mb-4">How it works</p>
          {[
            { step: '01', title: 'Add your product', desc: 'Name, URL, description — done in 30 seconds' },
            { step: '02', title: 'We submit everywhere', desc: '90+ directories, auto-filled and submitted' },
            { step: '03', title: 'Track your growth', desc: 'Backlinks, traffic, approvals — all in one place' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-xl p-4">
              <span className="text-violet-500 font-mono text-sm font-bold">{item.step}</span>
              <div>
                <p className="text-white text-sm font-medium">{item.title}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Your SaaS deserves<br />
            <span className="text-violet-400">to be discovered.</span>
          </h2>
          <p className="text-zinc-500 mt-2 text-sm">Join founders already launching with Dicrecto.</p>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-white font-semibold text-lg">Dicrecto</span>
          </div>

          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-zinc-500 text-sm mt-1 mb-8">Start launching in under 2 minutes</p>

          {/* Google */}
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
              <label className="text-sm text-zinc-400 mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
              />
            </div>

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
              <label className="text-sm text-zinc-400 mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
              />
            </div>

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition text-sm"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </div>

          <p className="text-zinc-600 text-xs text-center mt-4">
            🔒 Encrypted & private. No spam, ever.
          </p>

          <p className="text-zinc-500 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}