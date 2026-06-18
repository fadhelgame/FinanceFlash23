'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useFinanceStore } from '@/lib/store'
import { LogOut, Menu, X, LogIn, LayoutDashboard, Wallet, ArrowLeftRight, RefreshCw, Cloud, CloudOff, Save } from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/recurring', label: 'Recurring', icon: RefreshCw },
]

export default function NavBar({ isDemoMode, onExitDemo }: { isDemoMode?: boolean; onExitDemo?: () => void }) {
  const pathname = usePathname()
  const { isAuthenticated, userEmail, login, logout } = useAuth()
  const { saving, lastSaved, saveToDrive: storeSaveToDrive } = useFinanceStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const showAuthed = isAuthenticated || isDemoMode

  const handleManualSave = async () => {
    if (isDemoMode) {
      setSaveMsg('Demo ✱')
      setTimeout(() => setSaveMsg(null), 2000)
      return
    }
    const ok = await storeSaveToDrive()
    setSaveMsg(ok ? 'Saved ✓' : 'Save failed')
    setTimeout(() => setSaveMsg(null), 2000)
  }

  const handleLogout = () => {
    if (isDemoMode) {
      onExitDemo?.()
    } else {
      logout()
    }
  }

  return (
    <nav
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-2xl border p-1 shadow-sm"
      style={{
        background: 'color-mix(in oklch, var(--color-paper-0) 80%, transparent)',
        backdropFilter: 'blur(24px)',
        borderColor: 'color-mix(in oklch, var(--color-ink-0) 12%, transparent)',
        boxShadow: 'rgba(255,255,255,0.5) 0px 1px 0px inset, rgba(20,30,80,0.15) 0px 8px 30px -12px',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      {/* Brand — always visible */}
      <Link
        href="/"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl shrink-0"
        style={{ color: 'var(--color-ink-0)' }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent)' }}>
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--color-paper-0)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="font-semibold hidden sm:inline text-sm" style={{ color: 'var(--color-ink-0)' }}>Finance Flash</span>
      </Link>

      {/* Vertical divider */}
      <div className="hidden sm:block h-5 w-px shrink-0" style={{ background: 'color-mix(in oklch, var(--color-ink-0) 10%, transparent)' }} />

      {/* Desktop nav links */}
      {showAuthed && (
        <div className="hidden sm:flex items-center gap-0.5">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            const showLabel = expanded || isActive
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  padding: showLabel ? '7px 12px' : '7px 10px',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-ink-2)',
                  background: isActive ? 'var(--color-accent-tint)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--color-paper-2)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span
                  className="overflow-hidden transition-all duration-200"
                  style={{
                    maxWidth: showLabel ? '120px' : '0px',
                    opacity: showLabel ? 1 : 0,
                  }}
                >
                  {link.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Toggle expand button — desktop */}
      {showAuthed && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="hidden sm:flex items-center justify-center rounded-xl transition-all shrink-0"
          style={{
            padding: '7px 6px',
            color: 'var(--color-ink-3)',
            background: 'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-paper-2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className="w-3.5 h-3.5 transition-transform duration-200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="hidden sm:flex items-center gap-1.5">
        {showAuthed ? (
          <>
            {/* Sync status indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              {saving ? (
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-accent)' }} />
              ) : (
                <Cloud className="w-3.5 h-3.5" style={{ color: 'var(--color-ink-3)' }} />
              )}
              {lastSaved && (
                <span className="mono-label hidden lg:inline text-[10px]">{lastSaved}</span>
              )}
            </div>

            {/* Manual Save button */}
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-all"
              style={{ color: 'var(--color-ink-2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-paper-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              title="Save now"
              disabled={saving}
            >
              {saveMsg || <Save className="w-3.5 h-3.5" />}
            </button>

            <div className="h-5 w-px shrink-0" style={{ background: 'color-mix(in oklch, var(--color-ink-0) 10%, transparent)' }} />

            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <span className="live-dot" />
              <span className="mono-label hidden lg:inline">{isDemoMode ? 'DEMO' : 'LIVE'}</span>
            </div>
            <div className="h-5 w-px shrink-0" style={{ background: 'color-mix(in oklch, var(--color-ink-0) 10%, transparent)' }} />
            <span className="text-xs truncate max-w-[90px] px-2 py-1.5 rounded-xl" style={{ color: 'var(--color-ink-3)' }}>
              {isDemoMode ? 'Demo' : userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all"
              style={{ color: 'var(--color-ink-2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-paper-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={login}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all"
            style={{ background: 'var(--color-ink-0)', color: 'var(--color-paper-0)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-ink-0)' }}
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      </div>

      {/* Hamburger — mobile only */}
      <button
        className="sm:hidden flex items-center justify-center p-2 rounded-xl"
        style={{ color: 'var(--color-ink-2)' }}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="sm:hidden fixed left-1/2 -translate-x-1/2 top-[68px] w-[90vw] max-w-sm rounded-2xl p-2 shadow-lg border flex flex-col gap-0.5 overflow-hidden"
          style={{
            background: 'color-mix(in oklch, var(--color-paper-0) 98%, transparent)',
            backdropFilter: 'blur(24px)',
            borderColor: 'color-mix(in oklch, var(--color-ink-0) 14%, transparent)',
            boxShadow: 'rgba(20,30,80,0.25) 0px 24px 60px -28px, rgba(20,30,80,0.08) 0px 4px 12px -4px',
          }}
        >
          {showAuthed ? (
            <>
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color: isActive ? 'var(--color-accent)' : 'var(--color-ink-1)',
                      background: isActive ? 'var(--color-accent-tint)' : 'transparent',
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {link.label}
                  </Link>
                )
              })}
              <div className="h-px my-1.5 mx-3" style={{ background: 'color-mix(in oklch, var(--color-ink-0) 10%, transparent)' }} />
              <div className="flex items-center gap-2 px-3.5 py-2">
                {/* Manual save on mobile too */}
                <button onClick={handleManualSave} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs" style={{ color: 'var(--color-ink-2)' }} disabled={saving}>
                  <Save className="w-3.5 h-3.5" />
                  {saveMsg || 'Save'}
                </button>
                <span className="flex-1" />
                <span className="live-dot" />
                <span className="mono-label text-[10px]">{isDemoMode ? 'DEMO' : 'LIVE'}</span>
                <span className="text-xs truncate max-w-[100px]" style={{ color: 'var(--color-ink-3)' }}>{isDemoMode ? 'Demo' : userEmail}</span>
                <button onClick={handleLogout} className="flex items-center justify-center p-1.5 rounded-xl" style={{ color: 'var(--color-ink-2)' }}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => { login(); setMenuOpen(false) }} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--color-ink-0)', color: 'var(--color-paper-0)' }}>
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </button>
          )}
        </div>
      )}

      {/* Click outside — mobile */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0" style={{ zIndex: -1 }} onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  )
}
