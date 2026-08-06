'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

interface AuthState {
  isAuthenticated: boolean
  userEmail: string | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function readEmailCookie(): string | null {
  const match = document.cookie.match(/google_email=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    userEmail: null,
    loading: true,
  })

  const checkStatus = useCallback(async () => {
    const { checkAuth } = await import('./google-drive')

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(500 * 2 ** (attempt - 1))
      try {
        const status = await checkAuth()
        setAuth({
          isAuthenticated: status.authenticated,
          userEmail: status.email || null,
          loading: false,
        })
        return
      } catch {
        // network / server unreachable — retry
      }
    }

    // Every retry failed, which says nothing about whether the session is
    // valid. Fall back to the email cookie: if it is still there the user was
    // signed in and stays signed in. Only an explicit logout, or Google
    // reporting the grant as revoked, ends a session.
    console.warn('Auth check unreachable — keeping existing session')
    const email = readEmailCookie()
    setAuth({
      isAuthenticated: !!email,
      userEmail: email,
      loading: false,
    })
  }, [])

  useEffect(() => {
    // Initial session probe. Every setState inside checkStatus happens after an
    // await, so this is not a synchronous update in the effect body — the rule
    // cannot see through the async boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkStatus()
  }, [checkStatus])

  // Re-check when the tab comes back, so a session that was revoked elsewhere
  // is noticed without waiting for a reload.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkStatus()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkStatus])

  const login = useCallback(async () => {
    try {
      const { getAuthUrl } = await import('./google-drive')
      const url = await getAuthUrl()
      window.location.href = url
    } catch (err) {
      console.error('Login failed:', err)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const m = await import('./google-drive')
      await m.logout()
    } catch {
      console.warn('Logout failed');
    }
    setAuth({ isAuthenticated: false, userEmail: null, loading: false })
  }, [])

  const value = useMemo(() => ({ ...auth, login, logout }), [auth, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
