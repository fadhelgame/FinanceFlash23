'use client'

import { useMemo } from 'react'

interface SparklesProps {
  children: React.ReactNode
  className?: string
}

const SPARKLE_PATH =
  'M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z'

interface Sparkle {
  id: number
  left: number
  top: number
  scale: number
  rotation: number
  opacity: number
  color: string
}

function generateSparkles(count: number, colors: [string, string]): Sparkle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    scale: 0.05 + Math.random() * 0.35,
    rotation: Math.random() * 360,
    opacity: 0.1 + Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }))
}

export default function SparklesText({ children, className = '' }: SparklesProps) {
  const sparkles = useMemo(
    () => generateSparkles(12, ['#6366f1', '#a78bfa']),
    []
  )

  return (
    <span className={`relative inline-block ${className}`}>
      {sparkles.map((s) => (
        <svg
          key={s.id}
          className="pointer-events-none absolute z-20"
          width="21"
          height="21"
          viewBox="0 0 21 21"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            transform: `scale(${s.scale}) rotate(${s.rotation}deg)`,
            opacity: s.opacity,
          }}
        >
          <path d={SPARKLE_PATH} fill={s.color} />
        </svg>
      ))}
      {children}
    </span>
  )
}
