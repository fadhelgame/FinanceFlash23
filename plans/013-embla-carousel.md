# Plan 013: Embla Carousel Renovation

## Goal
Replace the framer-motion `AnimatePresence` mobile features carousel in `LandingPage.tsx` with a premium Embla Carousel implementation.

## Changes Made

### 1. Dependency installed
- `embla-carousel-react` (v8.x) — added to `package.json`

### 2. Created `src/components/ui/button.tsx`
- `Button` component with `forwardRef`
- Variants: `default` (uses `.btn.btn-primary`), `outline` (uses `.btn-ghost`), `ghost` (transparent)
- Sizes: `default`, `sm`, `lg`, `icon`
- Uses `cn()` utility from `@/lib/utils`

### 3. Created `src/components/ui/card.tsx`
- `Card` component — renders `<div className="card" />`
- `CardContent` component — renders `<div className="p-6" />`
- Both use `forwardRef` and `cn()`

### 4. Created `src/components/ui/carousel.tsx`
Full Embla Carousel component suite:
- **Carousel** (root) — Context provider wrapping `useEmblaCarousel()`. Exposes `carouselRef`, `api`, `scrollPrev`, `scrollNext`, `canScrollPrev`, `canScrollNext`, `selectedIndex`, `scrollSnaps`, `onDotButtonClick`. Keyboard navigation (ArrowLeft/ArrowRight). Supports `opts` and `setApi` props.
- **CarouselContent** — Viewport + track flex container (`overflow-hidden`, `flex -ml-4`)
- **CarouselItem** — Slide with `min-w-0 shrink-0 grow-0 basis-full pl-4`
- **CarouselPrevious** — Left arrow button, frosted glass background, disabled when at start
- **CarouselNext** — Right arrow button, matching style
- **CarouselDots** — Dot indicators with active/inactive styling matching the existing design tokens
- All components use `cn()` + `forwardRef`
- Icons from `lucide-react` (`ChevronLeft`, `ChevronRight`)

### 5. Modified `src/components/LandingPage.tsx`
Removed:
- `AnimatePresence` import (framer-motion)
- `useState`, `useEffect`, `useRef`, `useCallback` imports (no longer needed)
- `ChevronLeft`, `ChevronRight`, `TrendingDown` from lucide-react imports
- All carousel state: `currentIndex`, `direction`, `isPaused`, `intervalRef`, `touchStartX`, `touchEndX`, `totalSlides`
- All handlers: `goTo`, `goNext`, `goPrev`, `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`
- `slideVariants` object
- The entire `<div className="sm:hidden">` mobile carousel section (formerly lines 324-386)

Added:
- Imports: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`, `CarouselDots` from `@/components/ui/carousel`
- New mobile section using:
  ```tsx
  <div className="sm:hidden">
    <Carousel opts={{ align: 'start', loop: false }}>
      <CarouselContent>
        {featuresData.map((feature, i) => (
          <CarouselItem key={i}>
            <div className="card p-4 mx-6">
              {/* icon, title, desc */}
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselDots className="mt-6" />
    </Carousel>
  </div>
  ```

## How It Works

### Carousel behavior
- **Horizontal snap scrolling** — Embla's native scroll snap with `align: 'start'`
- **Touch/drag** — Embla handles touch natively, no manual touch handlers needed
- **Prev/Next buttons** — Positioned inside each card (absolute, left/right), frosted glass appearance, disabled at boundaries
- **Dots indicator** — Below the carousel, active dot uses `var(--color-accent)` and expands to 24px width, matching the original design
- **Smooth scrolling** — Embla's native CSS scroll-snap + smooth drag physics

### Design tokens used
- Card: `.card` class (from `globals.css`) — `var(--color-paper-0)` bg, `var(--radius-lg)` border-radius, soft shadow
- Text: `var(--color-ink-0)` for headings, `var(--color-ink-1)` for descriptions
- Accent: `var(--color-accent)` for active dot
- Button backgrounds: `color-mix(in oklch, var(--color-paper-0) 88%, transparent)` with backdrop-blur

## Files Modified
| File | Action |
|------|--------|
| `package.json` | Added `embla-carousel-react` |
| `src/components/ui/button.tsx` | **Created** |
| `src/components/ui/card.tsx` | **Created** |
| `src/components/ui/carousel.tsx` | **Created** |
| `src/components/LandingPage.tsx` | **Modified** — replaced mobile carousel |

## Verification
- `npx tsc --noEmit` passes with zero errors
- All existing desktop layout (grid) is untouched
