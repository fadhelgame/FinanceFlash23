'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    userEmail: null,
    loading: true,
  })

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    try {
      const { checkAuth } = await import('./google-drive')
      const status = await checkAuth()
      setAuth({
        isAuthenticated: status.authenticated,
        userEmail: status.email || null,
        loading: false,
      })
    } catch {
      console.warn('Auth check failed');
      setAuth({ isAuthenticated: false, userEmail: null, loading: false })
    }
  }

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

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
