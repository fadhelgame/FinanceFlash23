'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface CinematicTextProps {
  text: string
  className?: string
  accent?: string
  accentClassName?: string
  style?: React.CSSProperties
}

export default function CinematicText({ text, className = '', accent, accentClassName = '', style }: CinematicTextProps) {
  const words = useMemo(() => text.split(' '), [text])

  return (
    <span className="inline">
      {words.map((word, i) => {
        const isAccent = accent && word === accent
        return (
          <motion.span
            key={i}
            initial={{ filter: 'blur(12px) brightness(0.5)', opacity: 0, y: 20, rotateX: -10 }}
            whileInView={{ filter: 'blur(0px) brightness(1)', opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{
              duration: 1.4,
              delay: i * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={`inline-block mr-[0.35em] ${isAccent ? accentClassName : ''}`}
            style={{ willChange: 'filter, transform, opacity', ...(isAccent && style ? style : {}) }}
          >
            {word}
          </motion.span>
        )
      })}
    </span>
  )
}
