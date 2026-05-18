'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const supabase = createClient()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    console.log('Code:', code)
    
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        console.log('Session:', data.session)
        console.log('Error:', error)
        
        if (data.session) {
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 500)
        } else {
          window.location.href = '/login'
        }
      })
    } else {
      window.location.href = '/login'
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #667eea', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#666', fontSize: 14 }}>Signing you in...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}