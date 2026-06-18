'use client'

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ── */

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]

interface CarouselContextValue {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: CarouselApi
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  selectedIndex: number
  scrollSnaps: number[]
  onDotButtonClick: (index: number) => void
}

/* ── Context ── */

const CarouselContext = createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = useContext(CarouselContext)
  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />')
  }
  return context
}

/* ── Root ── */

interface CarouselProps extends HTMLAttributes<HTMLDivElement> {
  opts?: CarouselOptions
  setApi?: (api: CarouselApi) => void
  children: ReactNode
}

const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ opts, setApi, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel({
      align: 'start',
      loop: false,
      ...opts,
    })
    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

    const onSelect = useCallback((api_: CarouselApi) => {
      if (!api_) return
      setCanScrollPrev(api_.canScrollPrev())
      setCanScrollNext(api_.canScrollNext())
      setSelectedIndex(api_.selectedScrollSnap())
    }, [])

    const scrollPrev = useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = useCallback(() => {
      api?.scrollNext()
    }, [api])

    const onDotButtonClick = useCallback(
      (index: number) => {
        api?.scrollTo(index)
      },
      [api]
    )

    /* Expose API via callback */
    useEffect(() => {
      if (!api || !setApi) return
      setApi(api)
    }, [api, setApi])

    /* Init (scroll snaps + select) */
    useEffect(() => {
      if (!api) return
      setScrollSnaps(api.scrollSnapList())
      onSelect(api)
      api.on('select', onSelect)
      api.on('reInit', onSelect)
      api.on('reInit', () => setScrollSnaps(api.scrollSnapList()))
      return () => {
        api.off('select', onSelect)
        api.off('reInit', onSelect)
      }
    }, [api, onSelect])

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          selectedIndex,
          scrollSnaps,
          onDotButtonClick,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn('relative', className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = 'Carousel'

/* ── Content (viewport + track) ── */

const CarouselContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef } = useCarousel()
    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn('flex -ml-4', className)}
          {...props}
        />
      </div>
    )
  }
)
CarouselContent.displayName = 'CarouselContent'

/* ── Item ── */

const CarouselItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn('min-w-0 shrink-0 grow-0 basis-full pl-4', className)}
      {...props}
    />
  )
)
CarouselItem.displayName = 'CarouselItem'

/* ── Previous button ── */

const CarouselPrevious = forwardRef<HTMLButtonElement, HTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { scrollPrev, canScrollPrev } = useCarousel()
    return (
      <button
        ref={ref}
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className={cn(
          'absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all',
          'bg-[color-mix(in_oklch,var(--color-paper-0)_88%,transparent)] backdrop-blur-sm',
          'shadow-[0_2px_8px_rgba(0,0,0,0.12)]',
          'hover:bg-[color-mix(in_oklch,var(--color-paper-0)_96%,transparent)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)]',
          'disabled:opacity-0 disabled:pointer-events-none',
          'text-[color:var(--color-ink-0)]',
          className
        )}
        aria-label="Previous slide"
        {...props}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    )
  }
)
CarouselPrevious.displayName = 'CarouselPrevious'

/* ── Next button ── */

const CarouselNext = forwardRef<HTMLButtonElement, HTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { scrollNext, canScrollNext } = useCarousel()
    return (
      <button
        ref={ref}
        onClick={scrollNext}
        disabled={!canScrollNext}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all',
          'bg-[color-mix(in_oklch,var(--color-paper-0)_88%,transparent)] backdrop-blur-sm',
          'shadow-[0_2px_8px_rgba(0,0,0,0.12)]',
          'hover:bg-[color-mix(in_oklch,var(--color-paper-0)_96%,transparent)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)]',
          'disabled:opacity-0 disabled:pointer-events-none',
          'text-[color:var(--color-ink-0)]',
          className
        )}
        aria-label="Next slide"
        {...props}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    )
  }
)
CarouselNext.displayName = 'CarouselNext'

/* ── Dots ── */

const CarouselDots = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { scrollSnaps, selectedIndex, onDotButtonClick } = useCarousel()
    return (
      <div
        ref={ref}
        className={cn('flex justify-center gap-2', className)}
        {...props}
      >
        {scrollSnaps.map((_, i) => (
          <button
            key={i}
            onClick={() => onDotButtonClick(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === selectedIndex ? '24px' : '8px',
              height: '8px',
              background:
                i === selectedIndex
                  ? 'var(--color-accent)'
                  : 'color-mix(in oklch, var(--color-ink-0) 20%, transparent)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    )
  }
)
CarouselDots.displayName = 'CarouselDots'

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  useCarousel,
  type CarouselApi,
}
