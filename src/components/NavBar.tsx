'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LogOut, Menu, X } from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/transactions', label: 'Txns' },
  { href: '/recurring', label: 'Recurring' },
]

export default function NavBar() {
  const pathname = usePathname()
  const { userEmail, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="nav-pill" style={{ zIndex: 100 }}>
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--color-paper-0)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="font-semibold hidden sm:inline" style={{ color: 'var(--color-ink-0)' }}>Finance Flash</span>
      </div>

      {/* Desktop links */}
      <div className="hidden sm:flex items-center gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-full font-medium text-sm transition-all duration-200"
              style={{
                color: isActive ? 'var(--color-accent)' : 'var(--color-ink-2)',
                background: isActive ? 'var(--color-accent-tint)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-paper-2)' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Right side: live + email + actions */}
      <div className="hidden sm:flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <span className="mono-label">LIVE</span>
        </div>
        {userEmail && (
          <span className="text-xs truncate max-w-[100px]" style={{ color: 'var(--color-ink-3)' }}>{userEmail}</span>
        )}
        <button onClick={logout} className="btn-ghost px-3 py-1.5 text-xs" title="Logout">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hamburger — mobile only */}
      <button
        className="sm:hidden flex items-center justify-center ml-auto p-1.5 rounded-full"
        style={{ color: 'var(--color-ink-2)' }}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="sm:hidden fixed left-1/2 -translate-x-1/2 top-[72px] w-[calc(100%-32px)] max-w-xs rounded-2xl p-3 shadow-lg border flex flex-col gap-1"
          style={{
            background: 'color-mix(in oklch, var(--color-paper-0) 98%, transparent)',
            backdropFilter: 'blur(24px)',
            borderColor: 'color-mix(in oklch, var(--color-ink-0) 14%, transparent)',
            boxShadow: 'rgba(20,30,80,0.25) 0px 24px 60px -28px, rgba(20,30,80,0.08) 0px 4px 12px -4px',
          }}
        >
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-ink-1)',
                  background: isActive ? 'var(--color-accent-tint)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="h-px my-2" style={{ background: 'color-mix(in oklch, var(--color-ink-0) 10%, transparent)' }} />
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="live-dot" />
            <span className="mono-label">LIVE</span>
            <span className="flex-1" />
            {userEmail && (
              <span className="text-xs truncate max-w-[120px]" style={{ color: 'var(--color-ink-3)' }}>{userEmail}</span>
            )}
            <button onClick={logout} className="btn-ghost px-2 py-1 text-xs" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0"
          style={{ zIndex: -1 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  )
}
