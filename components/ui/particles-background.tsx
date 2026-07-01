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
  density = 0.00004,
  color = '110, 180, 255', // azul Scalit (rgb)
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
    const LINK_DIST = 116
    const MOUSE_RADIUS = 130 // raio de influência do cursor
    let mouseX = -9999
    let mouseY = -9999

    function seed() {
      const count = Math.round(width * height * density)
      particles = Array.from({ length: Math.max(16, Math.min(55, count)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.3 + 1,
      }))
    }

    function resize() {
      // Medir pelo viewport (o canvas é um fundo fixed inset-0), não pelo
      // getBoundingClientRect — que no 1.º paint devolve o tamanho intrínseco
      // do canvas (300×150) e concentrava tudo no canto superior esquerdo.
      width = window.innerWidth
      height = window.innerHeight
      if (width === 0 || height === 0) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
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

          // Repulsão suave ao cursor: dentro do raio, empurra a partícula
          // para fora, criando uma "cavidade" à volta do rato.
          const mdx = p.x - mouseX
          const mdy = p.y - mouseY
          const mdist = Math.hypot(mdx, mdy)
          if (mdist < MOUSE_RADIUS && mdist > 0) {
            const force = (1 - mdist / MOUSE_RADIUS) * 2.4
            p.x += (mdx / mdist) * force
            p.y += (mdy / mdist) * force
          }
        }
      }

      // Linhas subtis entre partículas próximas
      ctx!.lineWidth = 0.7
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.16
            ctx!.strokeStyle = `rgba(${color}, ${alpha})`
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }
      }

      // Pontos (nós) com brilho
      ctx!.shadowColor = `rgba(${color}, 0.9)`
      ctx!.shadowBlur = 6
      ctx!.fillStyle = `rgba(${color}, 0.9)`
      for (const p of particles) {
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.shadowBlur = 0

      if (!reduceMotion) raf = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const onResize = () => {
      resize()
      if (reduceMotion) draw()
    }
    window.addEventListener('resize', onResize)

    // Interação com o rato (o canvas tem pointer-events-none, por isso ouvimos
    // no window; clientX/Y coincidem com o viewport = canvas fixed inset-0).
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    const onMouseLeave = () => {
      mouseX = -9999
      mouseY = -9999
    }
    if (!reduceMotion) {
      window.addEventListener('mousemove', onMouseMove, { passive: true })
      document.addEventListener('mouseleave', onMouseLeave)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
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
