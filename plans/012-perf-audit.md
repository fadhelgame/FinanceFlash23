# Performance Audit — Finance Flash

**Date:** 2026-06-19
**URL:** https://finance-flash23.vercel.app
**Test Environment:** Browser-based performance analysis (DevTools API, resource timing)

---

## Executive Summary

Finance Flash loads in ~890ms (LCP) on a cold cache, transferring ~240KB of resources.
For a mostly-static landing page with no images, this is **moderately slow**.
The main contributors are: render-blocking Google Fonts loaded via CSS @import,
excessive client-side JavaScript (all 5 pages are use client),
heavy framer-motion animation trees on initial render, and 10 separate JS chunks.
The site does not use next/font, next/image, Suspense boundaries, or Server Components.

---

## 1. Resource Transfer Breakdown

| Resource Type | Count | Transfer Size | Total Time |
|---|---|---|---|
| JavaScript | 10 files | 227.6 KB | 3,083 ms |
| CSS | 2 files | 18.8 KB | 328 ms |
| Fetch (API) | 3 calls | 1.0 KB | 852 ms |
| Favicon | 1 | 2.5 KB | 301 ms |
| **Total** | **16** | **~250 KB** | **4,563 ms** |

### Largest JS Chunks (uncompressed | compressed)

| Chunk | Disk Size | Transfer Size | Load Time | Content |
|---|---|---|---|---|
| 2nykiepra7i1k.js | 227.5 KB | 72.7 KB | 741 ms | App bundle (layout, providers, routing) |
| 0ixm722g76v52.js | 194.5 KB | 62.5 KB | 42 ms | Landing page + animations |
| 11oof8oxnxiv9.js | 141.6 KB | 39.9 KB | 434 ms | Dashboard view |
| 14mrh2-p_w84d.js | 54.6 KB | 13.7 KB | 305 ms | NavBar + auth |
| 27jktro2p5rq9.js | 44.4 KB | 10.0 KB | 333 ms | Shared framework |
| 2l5ly0p0767zz.js | 23.7 KB | 8.8 KB | 321 ms | Google Drive sync |
| 12uft18jx5xbk.css | 37.8 KB | 8.7 KB | 33 ms | Global styles + Tailwind |

### Node Module Sizes

| Package | Size | Notes |
|---|---|---|
| next | 169 MB | No config optimizations enabled |
| lucide-react | 39 MB | ~1500 icons; only ~20 used |
| framer-motion | 5.6 MB | Heavy animation lib for ~20 components |

---

## 2. Critical Findings

### CRITICAL: Render-Blocking Google Fonts

**File:** src/app/globals.css (line 4)

Fonts loaded via CSS @import from Google Fonts. No preconnect/preload hints.
No next/font used. Three families: Geist (4 weights), Geist Mono, Instrument Serif.

**Impact:** FCP delayed until Google Fonts CSS is fetched, parsed, and fonts downloaded.

**Fix:** Replace CSS @import with next/font/google and next/font/local. Use CSS variable
approach for Tailwind integration.

### CRITICAL: No Server Components -- Every Page is use client

All 5 pages use use client. Landing page has no interactive state until user clicks Sign In.

**Impact:** Entire landing page bundle (194 KB) shipped and executed before render.
No RSC streaming, no static generation.

**Fix:** Convert page.tsx to Server Component. Use next/dynamic for auth-gated components.

### HIGH: Excessive Framer-Motion on Initial Render

LandingPage creates ~20 motion.div/span on initial mount. VerticalCutReveal creates a
separate motion.span for every character (~25 per use, 3 instances). Spring physics.

**Impact:** ~40+ animated elements on initial load causes jank on lower-end devices.

**Fix:** Replace per-character motion.span with single-element CSS reveal.
Remove spring physics (use tween/ease). Add willChange consistently.

### HIGH: No Code Splitting / Lazy Loading

LandingPage (194 KB) and DashboardView (141 KB) eagerly imported in page.tsx.
Both load regardless of auth state.

**Fix:** Use next/dynamic for both components.

### MEDIUM: Empty next.config.ts

No image optimization, no headers, no experimental features configured.

**Fix:** Add compress: true, optimizePackageImports, Cache-Control headers.

### MEDIUM: Drive Save Spam

Every state change triggers: localStorage write + 500ms debounced Drive API call.
Plus beforeunload + visibilitychange handlers.

**Fix:** Debounce to 2s, batch writes, skip save on initial load.

### MEDIUM: Complex CSS Background

251 lines of CSS with radial-gradient dot grid, animation grid-drift (120s infinite),
repeating-linear-gradient ledger lines, oklch() color space, color-mix() calls.

**Impact:** GPU compositing cost on every scroll/repaint. color-mix/oklch degrade
in older browsers.

**Fix:** Remove grid-drift animation (zero visual value). Add CSS fallbacks.

### MEDIUM: Inline Style Handlers in NavBar

onMouseEnter/onMouseLeave re-created on every render. Should use CSS :hover.

**Fix:** Replace with CSS pseudo-classes.

---

## 3. Summary Metrics

| Metric | Value | Rating |
|---|---|---|
| TTFB | 87 ms | Excellent |
| FCP | 154 ms | Great |
| LCP | 892 ms | Moderate |
| Total JS Transferred | 227.6 KB | Heavy for landing page |
| Total CSS Transferred | 8.7 KB | Good |
| Total HTTP Requests | 16 | Could be lower |
| Render-blocking resources | 1 (CSS @import fonts) | Should fix |
| Server Components used | 0 / 5 pages | All client-side |
| next/font used | No | Should use |
| Suspense boundaries | 0 | None |
| Dynamic imports | 0 | None |

---

## 4. Recommended Fixes (Priority Order)

### P0 -- Fix immediately
1. Replace CSS @import fonts with next/font - biggest single improvement
2. Split LandingPage and DashboardView with next/dynamic - saves ~141 KB

### P1 -- High impact
3. Convert page.tsx to Server Component
4. Simplify framer-motion: per-character motion.pan to CSS, remove spring physics
5. Add experimental.optimizePackageImports for lucide-react and framer-motion

### P2 -- Medium impact
6. Debounce Drive saves to 2s instead of 500ms
7. Remove grid-drift CSS animation
8. Use CSS classes instead of inline onMouseEnter in NavBar

### P3 -- Nice to have
9. Configure Cache-Control headers
10. Add CSS fallbacks for oklch()/color-mix()
11. Add loading.js and error.js for Suspense boundaries

---

## 5. Estimated Impact After Fixes

| Metric | Before | After (estimated) |
|---|---|---|
| FCP | 154 ms | ~100 ms |
| LCP | 892 ms | ~400-500 ms |
| JS Transfer (unauthenticated) | 227 KB | ~85 KB |
| Render-blocking resources | 1 | 0 |
| API calls on load | 3 | 1-2 |
| Per-character motion elements | ~25 | 0 (word-level) |

---

## 6. Verification Steps

1. Production build: npm run build
2. Bundle analysis: ANALYZE=true npm run build (needs @next/bundle-analyzer)
3. Lighthouse: npx lighthouse https://finance-flash23.vercel.app --view
4. Browser DevTools: Performance tab -> check long tasks, Coverage tab -> unused code
