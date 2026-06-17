'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FlashParticle {
  id: number
  angle: number
  distance: number
  size: number
  color: string
}

export default function FlashText({ text, className = '' }: { text: string; className?: string }) {
  const [flash, setFlash] = useState(false)
  const [particles, setParticles] = useState<FlashParticle[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    const triggerFlash = () => {
      // Flash the text
      setFlash(true)

      // Generate burst particles radiating from center
      const count = 12 + Math.floor(Math.random() * 8)
      const newParticles: FlashParticle[] = []
      for (let i = 0; i < count; i++) {
        idRef.current++
        newParticles.push({
          id: idRef.current,
          angle: (360 / count) * i + Math.random() * 20,
          distance: 30 + Math.random() * 80,
          size: 2 + Math.random() * 5,
          color: Math.random() > 0.5 ? '#6366f1' : '#a78bfa',
        })
      }
      setParticles(newParticles)

      // Reset flash after short duration
      setTimeout(() => setFlash(false), 200)

      // Clear particles after animation
      setTimeout(() => setParticles([]), 800)
    }

    // Initial flash on mount
    const initial = setTimeout(triggerFlash, 600)

    // Recurring flash every few seconds
    const interval = setInterval(triggerFlash, 3000 + Math.random() * 2000)

    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [])

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Flash glow overlay */}
      <motion.span
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.3) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
        animate={{
          opacity: flash ? 1 : 0,
          scale: flash ? 1.2 : 0.8,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />

      {/* White flash overlay */}
      <motion.span
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, transparent 60%)',
        }}
        animate={{
          opacity: flash ? 1 : 0,
          scale: flash ? 1.4 : 0.6,
        }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
      />

      {/* Burst particles */}
      <AnimatePresence>
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180
          const x = Math.cos(rad) * p.distance
          const y = Math.sin(rad) * p.distance
          return (
            <motion.span
              key={p.id}
              className="absolute pointer-events-none rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                top: '50%',
                left: '50%',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ x, y, opacity: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          )
        })}
      </AnimatePresence>

      {/* The text itself */}
      <motion.span
        className="relative z-10 inline-block"
        animate={{
          color: flash ? '#ffffff' : undefined,
          textShadow: flash
            ? '0 0 20px rgba(99,102,241,0.8), 0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.2)'
            : '0 0 0px transparent',
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {text}
      </motion.span>
    </span>
  )
}
