# Plan: Features Section → Mobile Carousel

## Goal

Ubah `.grid sm:grid-cols-2 lg:grid-cols-3` di features section jadi carousel di mobile (< sm).
Desktop tetap grid 3 kolom. Mobile: carousel dengan auto-rotate + swipe gesture + prev/next buttons.

---

## Approach

Buat hook custom `useCarousel` (inline di LandingPage.tsx atau file utils terpisah) yang handle state logic.
Gunakan `framer-motion` `AnimatePresence` + `motion.div` untuk animasi slide (bukan snap instan).
Auto-rotate pakai `setInterval` yang di-pause saat user menginterupsi (drag/click button).

Render conditional:
- Desktop (`hidden sm:grid sm:grid-cols-2 lg:grid-cols-3`): grid tetap
- Mobile (`sm:hidden`): carousel dengan buttons

---

## Exact Code Changes

### Change 1: Tambah imports di top LandingPage.tsx

**Replace:**

```tsx
'use client'

import { motion } from 'framer-motion'
import { VerticalCutReveal } from '@/components/VerticalCutReveal'
import CinematicText from '@/components/CinematicText'
import Link from 'next/link'
import {
  Wallet,
  TrendingUp,
  RefreshCw,
  ArrowDownLeft,
  TrendingDown,
  ChevronRight,
  Smartphone,
} from 'lucide-react'
```

**With:**

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { VerticalCutReveal } from '@/components/VerticalCutReveal'
import CinematicText from '@/components/CinematicText'
import Link from 'next/link'
import {
  Wallet,
  TrendingUp,
  RefreshCw,
  ArrowDownLeft,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Smartphone,
} from 'lucide-react'
```

> **Note:** `ChevronLeft` and `ChevronRightIcon` are both imported for the carousel buttons. `ChevronRight` is kept for existing usage. We alias the second `ChevronRight` to avoid conflict — actually simpler: just import `ChevronLeft` separately and reuse the existing `ChevronRight` for both purposes since it's the same icon.

**Simplified import block (just add ChevronLeft):**

Actually the cleanest way: the existing `ChevronRight` import is used elsewhere. We just need to add `ChevronLeft` and `useState`, `useEffect`, `useRef`, `useCallback`. `AnimatePresence` is from framer-motion.

**Final replacement:**

```diff
+import { motion, AnimatePresence } from 'framer-motion'
-import { motion } from 'framer-motion'
+import { useState, useEffect, useRef, useCallback } from 'react'
 import { VerticalCutReveal } from '@/components/VerticalCutReveal'
 import CinematicText from '@/components/CinematicText'
 import Link from 'next/link'
 import {
   Wallet,
   TrendingUp,
   RefreshCw,
   ArrowDownLeft,
   TrendingDown,
+  ChevronLeft,
   ChevronRight,
   Smartphone,
 } from 'lucide-react'
```

---

### Change 2: Tambah hook `useCarousel` di dalam komponen (sebelum return)

Letakkan tepat setelah baris `const scrollToFeatures = ...` (atau di awal area logic).

**Add this block after any existing hooks/state declarations, before the return statement:**

```tsx
// ── Features Carousel State ──
const featuresData = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    color: '#22c55e',
    title: 'Track Income & Expenses',
    desc: 'Log every transaction in seconds. Categorise your spending — Food, Transport, Bills, and more. Know where your money goes.',
  },
  {
    icon: <Wallet className="w-5 h-5" />,
    color: '#3b82f6',
    title: 'Multiple Accounts',
    desc: 'Cash, Bank, E-Wallet, Credit Card, Savings — manage them all in one place. Each account keeps its own balance.',
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    color: '#a855f7',
    title: 'Recurring Transactions',
    desc: 'Set up monthly bills, subscriptions, and salary. Finance Flash auto-generates them so you never miss a thing.',
  },
  {
    icon: <ArrowDownLeft className="w-5 h-5" />,
    color: '#14b8a6',
    title: 'Export CSV & PDF',
    desc: 'Export any account or your full ledger. Perfect for tax season, budgeting reviews, or sharing with your partner.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    color: '#f97316',
    title: 'Google Drive Backup',
    desc: 'All your data syncs to your own Google Drive. No servers, no strangers — just you and your spreadsheet-in-the-sky.',
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    color: '#ec4899',
    title: 'Works Everywhere',
    desc: 'Open it on your phone, laptop, or tablet. It is a web app — no App Store, no updates, no expiry.',
  },
]

const [currentIndex, setCurrentIndex] = useState(0)
const [direction, setDirection] = useState(0) // 1 = next, -1 = prev
const [isPaused, setIsPaused] = useState(false)
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
const touchStartX = useRef(0)
const touchEndX = useRef(0)

const totalSlides = featuresData.length

const goTo = useCallback((index: number) => {
  const newIndex = ((index % totalSlides) + totalSlides) % totalSlides
  setDirection(newIndex > currentIndex ? 1 : -1)
  setCurrentIndex(newIndex)
}, [currentIndex, totalSlides])

const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex])
const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex])

// Auto-rotate
useEffect(() => {
  if (isPaused) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    return
  }
  intervalRef.current = setInterval(() => {
    setDirection(1)
    setCurrentIndex(prev => (prev + 1) % totalSlides)
  }, 4000) // 4s per slide
  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }
}, [isPaused, totalSlides])

// Touch handlers
const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX
  setIsPaused(true)
}
const handleTouchMove = (e: React.TouchEvent) => {
  touchEndX.current = e.touches[0].clientX
}
const handleTouchEnd = () => {
  const diff = touchStartX.current - touchEndX.current
  const threshold = 50
  if (Math.abs(diff) > threshold) {
    if (diff > 0) goNext()
    else goPrev()
  }
  // Resume auto-rotate after 6s of inactivity
  setTimeout(() => setIsPaused(false), 6000)
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}
```

**PENTING:** Extract `featuresData` array (the data) from the JSX into this constant. Then in the JSX, replace the inline array with `featuresData` — both for the grid and the carousel.

---

### Change 3: Ubah JSX features section (lines 195–251)

**Replace the entire** `<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"> ... </div>` block (lines 195–251) with:

```tsx
{/* Desktop: Grid */}
<div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {featuresData.map((feature, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="card p-6"
      style={{ cursor: 'default' }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: `${feature.color}1F` }}>
        <span style={{ color: feature.color }}>{feature.icon}</span>
      </div>
      <h3 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--color-ink-0)' }}>{feature.title}</h3>
      <p className="text-sm" style={{ color: 'var(--color-ink-1)' }}>{feature.desc}</p>
    </motion.div>
  ))}
</div>

{/* Mobile: Carousel */}
<div className="sm:hidden relative overflow-hidden" style={{ minHeight: '280px' }}>
  <div
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
    style={{ height: '100%' }}
  >
    <AnimatePresence initial={false} custom={direction} mode="wait">
      <motion.div
        key={currentIndex}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }}
        className="card p-6"
        style={{ cursor: 'default', touchAction: 'pan-y' }}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: `${featuresData[currentIndex].color}1F` }}>
          <span style={{ color: featuresData[currentIndex].color }}>{featuresData[currentIndex].icon}</span>
        </div>
        <h3 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--color-ink-0)' }}>{featuresData[currentIndex].title}</h3>
        <p className="text-sm" style={{ color: 'var(--color-ink-1)' }}>{featuresData[currentIndex].desc}</p>
      </motion.div>
    </AnimatePresence>
  </div>

  {/* Dots indicator */}
  <div className="flex justify-center gap-2 mt-6">
    {featuresData.map((_, i) => (
      <button
        key={i}
        onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); setIsPaused(true); setTimeout(() => setIsPaused(false), 6000) }}
        className="w-2 h-2 rounded-full transition-all duration-300"
        style={{
          background: i === currentIndex ? 'var(--color-accent)' : 'color-mix(in oklch, var(--color-ink-0) 20%, transparent)',
          width: i === currentIndex ? '24px' : '8px',
        }}
        aria-label={`Go to slide ${i + 1}`}
      />
    ))}
  </div>

  {/* Prev/Next buttons */}
  <button
    onClick={() => { goPrev(); setIsPaused(true); setTimeout(() => setIsPaused(false), 6000) }}
    className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-opacity hover:opacity-100 opacity-70"
    style={{ background: 'color-mix(in oklch, var(--color-paper-0) 90%, transparent)', color: 'var(--color-ink-0)' }}
    aria-label="Previous feature"
  >
    <ChevronLeft className="w-5 h-5" />
  </button>
  <button
    onClick={() => { goNext(); setIsPaused(true); setTimeout(() => setIsPaused(false), 6000) }}
    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-opacity hover:opacity-100 opacity-70"
    style={{ background: 'color-mix(in oklch, var(--color-paper-0) 90%, transparent)', color: 'var(--color-ink-0)' }}
    aria-label="Next feature"
  >
    <ChevronRight className="w-5 h-5" />
  </button>
</div>
```

---

## Animation Details

| Property | Value | Why |
|---|---|---|
| `slideVariants.enter` | `x: ±300, opacity: 0` | Slide in from right (next) or left (prev) |
| `slideVariants.center` | `x: 0, opacity: 1` | Landing position |
| `slideVariants.exit` | `x: ∓300, opacity: 0` | Slide out opposite direction |
| `transition.x` | `type: 'spring', stiffness: 300, damping: 30` | Smooth bounceless slide — feels natural, not floaty |
| `transition.opacity` | `duration: 0.3` | Quick fade to mask the crossfade gap |
| `AnimatePresence mode` | `"wait"` | Wait for exit animation before entering — prevents overlap jank |
| Auto-rotate interval | 4000ms | Balanced: not too fast (reading), not too slow (waiting) |
| Touch threshold | 50px | Prevents accidental swipes |
| Pause on interaction | 6s resume | Gives user time to read after manual nav |

---

## CSS Additions

No new CSS files or Tailwind config changes needed. All styling uses:
- Existing `card p-6` class
- Tailwind utility classes (`sm:hidden`, `hidden sm:grid`, etc.)
- Inline styles with CSS variables for theme tokens
- `touchAction: 'pan-y'` on the card to allow vertical scroll passthrough

---

## File Structure

```
src/components/LandingPage.tsx
  └─ imports: +AnimatePresence, +useState, +useEffect, +useRef, +useCallback, +ChevronLeft
  └─ featuresData[] extracted as constant above return
  └─ carousel state hooks (currentIndex, direction, isPaused, refs)
  └─ goTo / goNext / goPrev callbacks
  └─ auto-rotate useEffect
  └─ touch handlers
  └─ slideVariants object
  └─ render:
       ├─ Desktop: hidden sm:grid (same as before, but uses featuresData)
       └─ Mobile: sm:hidden (carousel with AnimatePresence + buttons + dots)
```

No new files created. Only `LandingPage.tsx` modified.

---

## Build Check

Setelah perubahan, jalankan:

```bash
npm run build
# atau
npx tsc --noEmit
```

Expected: zero errors. `AnimatePresence` is from `framer-motion` (already installed). `useState`, `useEffect`, `useRef`, `useCallback` are from React (already dep). `ChevronLeft` is from `lucide-react` (already installed).

---

## Edge Cases Covered

1. **Single slide** — carousel works fine; prev/next wraps around; dots show one dot
2. **Rapid clicking** — `mode="wait"` in AnimatePresence prevents animation queue buildup
3. **Vertical scroll on mobile** — `touchAction: 'pan-y'` on the card div allows vertical scroll passthrough; only horizontal swipe triggers carousel
4. **Tab visibility** — interval keeps running (acceptable; if user switches tab, resumes on return)
5. **Resize from mobile to desktop** — `sm:hidden` / `hidden sm:grid` handles responsive toggle; state persists but is irrelevant on desktop
6. **Auto-rotate vs manual** — manual interaction pauses auto-rotate for 6s, then resumes

---

## Implementation Order

1. Update imports (AnimatePresence, React hooks, ChevronLeft)
2. Extract `featuresData` array from JSX to a constant above return
3. Add carousel state hooks and callbacks after existing hooks
4. Replace the grid JSX with conditional desktop grid + mobile carousel
5. Run `npm run build` to verify
