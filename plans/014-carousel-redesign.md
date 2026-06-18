# Plan 014: Mobile Features Carousel Redesign

## Problem
The current mobile carousel is "jelek" (ugly). Arrows overlap card content, spacing is bad, no pagination indicator, no visual flair. User wants premium feel.

## Design Concept — "Luminous Glide"

A premium card carousel with:
1. **Glowing icon cards** — Each card has a colored top accent border, a glowing icon container, and subtle feature-tinted background
2. **Bottom navigation suite** — Arrows and dots united in a single row below the card, not overlapping content
3. **Auto-play** — Gentle auto-rotate every 4s, pauses on interaction
4. **Slide counter** — "1 / 6" for orientation
5. **Dot progress** — Active dot uses feature color with subtle scale animation

### Layout (mobile ~375px wide)
```
┌──────────────────────────┐
│  ┌────────────────────┐  │
│  │━━━ (accent border) ─│  │  ← 3px gradient border at top
│  │  ◉ (glowing icon)   │  │  ← Larger icon with glow shadow
│  │                     │  │
│  │  Title              │  │  ← 16px semibold
│  │  Description...     │  │  ← 13px, 2-line clamp
│  │                     │  │
│  └────────────────────┘  │
│                          │
│   ◄  ● ● ○ ○ ○  ►      │  ← Pill arrows + dots
│       1 / 6              │  ← Slide counter
└──────────────────────────┘
```

## Files to modify

### 1. `carousel.tsx` — Additions (no breaking changes)
- New `CarouselDots` component that renders dot navigation
- New `CarouselProgress` component for slide counter
- Export `type CarouselDotProps`
- All existing exports preserved

### 2. `globals.css` — New styles
- `.carousel-card` — Premium card variant with accent top border
- `.carousel-dot` — Dot styling with active/inactive states
- `.carousel-arrow` — Premium arrow button variant
- `.glow-{color}` — Dynamic icon glow classes
- Animation: `@keyframes carousel-fade-in`

### 3. `LandingPage.tsx` — Mobile carousel section (lines 262-289)
Replace entirely with premium carousel:
- Cards use `.carousel-card` with per-feature color accent
- Icon container: larger (w-12 h-12), glow shadow matching feature color
- Card background: subtle tint of feature color (3% opacity)
- Navigation row below card: left arrow, dots, right arrow, slide counter
- Auto-play: 4s interval, pauses on drag/touch
- `opts={{ align: 'start', loop: true }}` for seamless cycling
- Gap between cards via `pl-4` + `gap-4`

### 4. `button-1.tsx` — No changes needed (already has variant/size system)

## Design Token Usage
- `var(--color-accent)` — Active dot, arrow hover
- `var(--color-paper-0)` — Card background
- `var(--rule-soft)` — Card border
- `var(--radius-lg)` — Card radius
- `var(--radius-pill)` — Arrow/dot container
- `var(--color-ink-0/1/2/3)` — Text hierarchy
- `var(--ease-out)` — Animation easing

## Verification
- `npm run build` must pass with zero errors
- Desktop grid (sm:grid) section untouched
- All existing imports preserved
