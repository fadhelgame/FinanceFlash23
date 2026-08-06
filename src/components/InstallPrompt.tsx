'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'finance-flash-install-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari predates the display-mode media query.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSHelp, setShowIOSHelp] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Register the worker regardless — it is what makes the browser offer
    // installation in the first place.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    if (isStandalone()) return
    if (localStorage.getItem(DISMISSED_KEY)) return

    // Android and desktop Chrome hand us an event we can trigger later.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS has no install API at all, so the only option is telling the user
    // where the button is. Whether we are on iOS can only be read after mount —
    // doing it during render would not match what the server produced.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIOS()) setVisible(true)

    const onInstalled = () => setVisible(false)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    setShowIOSHelp(false)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // private mode — the banner simply reappears next visit
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      setDeferred(null)
      setVisible(false)
      if (outcome === 'dismissed') {
        try {
          localStorage.setItem(DISMISSED_KEY, '1')
        } catch {}
      }
      return
    }
    setShowIOSHelp(true)
  }, [deferred])

  if (!visible) return null

  if (showIOSHelp) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
        <div
          className="relative w-full max-w-sm card rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up"
          style={{ background: 'var(--color-paper-0)' }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-ink-0)' }}>
            Add to Home Screen
          </h2>
          <ol className="flex flex-col gap-3 mb-6">
            {[
              <>
                Tap <Share className="w-4 h-4 inline-block mx-0.5" style={{ color: 'var(--color-accent)' }} /> Share
                at the bottom of Safari
              </>,
              <>Scroll down and choose &ldquo;Add to Home Screen&rdquo;</>,
              <>Tap &ldquo;Add&rdquo; — Finance Flash lands next to your other apps</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                >
                  {i + 1}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-ink-1)' }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <button onClick={dismiss} className="btn-primary w-full py-3">
            Got it
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-4 right-4 bottom-24 sm:left-auto sm:right-6 sm:w-80 z-40">
      <div className="card flex items-center gap-3 shadow-lg" style={{ padding: 'var(--space-md)' }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'color-mix(in oklch, var(--color-accent) 15%, transparent)' }}
        >
          <Download className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-ink-0)' }}>
            Install Finance Flash
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-ink-2)' }}>
            Open it from your home screen
          </p>
        </div>
        <button onClick={handleInstall} className="btn-primary text-xs px-3 py-1.5 shrink-0">
          Install
        </button>
        <button onClick={dismiss} className="shrink-0" style={{ color: 'var(--color-ink-3)' }} aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
