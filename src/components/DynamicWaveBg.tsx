'use client'

import { useEffect, useRef } from 'react'

export default function DynamicWaveBg({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = 0, height = 0
    let imageData: ImageData, data: Uint8ClampedArray
    const SCALE = 2

    const resize = () => {
      const parent = canvas!.parentElement
      if (!parent) return
      canvas!.width = parent.clientWidth
      canvas!.height = parent.clientHeight
      width = Math.floor(canvas!.width / SCALE)
      height = Math.floor(canvas!.height / SCALE)
      imageData = ctx!.createImageData(width, height)
      data = imageData.data
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const startTime = Date.now()
    const SIN = new Float32Array(1024)
    const COS = new Float32Array(1024)
    for (let i = 0; i < 1024; i++) {
      const a = (i / 1024) * Math.PI * 2
      SIN[i] = Math.sin(a)
      COS[i] = Math.cos(a)
    }
    const fSin = (x: number) => SIN[Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * 1024) & 1023]
    const fCos = (x: number) => COS[Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * 1024) & 1023]

    const render = () => {
      const t = (Date.now() - startTime) * 0.001
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const ux = (2 * x - width) / height
          const uy = (2 * y - height) / height
          let a = 0, d = 0
          for (let i = 0; i < 4; i++) {
            a += fCos(i - d + t * 0.5 - a * ux)
            d += fSin(i * uy + a)
          }
          const wave = (fSin(a) + fCos(d)) * 0.5
          const intensity = 0.3 + 0.4 * wave
          const base = 0.1 + 0.15 * fCos(ux + uy + t * 0.3)
          const blue = 0.2 * fSin(a * 1.5 + t * 0.2)
          const purple = 0.15 * fCos(d * 2 + t * 0.1)
          const r = Math.max(0, Math.min(1, base + purple * 0.8)) * intensity
          const g = Math.max(0, Math.min(1, base + blue * 0.6)) * intensity
          const b = Math.max(0, Math.min(1, base + blue * 1.2 + purple * 0.4)) * intensity
          const i = (y * width + x) * 4
          data[i] = r * 255
          data[i + 1] = g * 255
          data[i + 2] = b * 255
          data[i + 3] = 150  // semi-transparent
        }
      }
      ctx!.putImageData(imageData, 0, 0)
      if (SCALE > 1) {
        ctx!.imageSmoothingEnabled = false
        ctx!.drawImage(canvas!, 0, 0, width, height, 0, 0, canvas!.width, canvas!.height)
      }
      animationId = requestAnimationFrame(render)
    }

    render()
    return () => {
      cancelAnimationFrame(animationId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity: 0.35 }}
    />
  )
}
