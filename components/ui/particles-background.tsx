'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Particle = { x: number; y: number; vx: number; vy: number; r: number }

/**
 * Fundo animado de partículas ligadas (estilo Scalit): pontos azul-elétrico a flutuar
 * e a ligarem-se por linhas quando ficam próximos. Puramente decorativo (aria-hidden).
 * Respeita prefers-reduced-motion (fica estático).
 */
export function ParticlesBackground({
  className,
  density = 0.00009,
  color = '92, 160, 246', // azul Scalit (rgb)
}: {
  className?: string
  density?: number
  color?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let particles: Particle[] = []
    let raf = 0
    const LINK_DIST = 130

    function seed() {
      const count = Math.round(width * height * density)
      particles = Array.from({ length: Math.max(12, Math.min(90, count)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
      }))
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      if (width === 0 || height === 0) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)

      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > width) p.vx *= -1
          if (p.y < 0 || p.y > height) p.vy *= -1
        }
      }

      // Linhas entre partículas próximas
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.35
            ctx!.strokeStyle = `rgba(${color}, ${alpha})`
            ctx!.lineWidth = 0.6
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }
      }

      // Pontos
      for (const p of particles) {
        ctx!.fillStyle = `rgba(${color}, 0.7)`
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const ro = new ResizeObserver(() => {
      resize()
      if (reduceMotion) draw()
    })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [density, color])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 block bg-transparent', className)}
    />
  )
}
