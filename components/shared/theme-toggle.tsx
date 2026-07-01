'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Alterna entre Modo Dia (caixas brancas translúcidas) e Modo Noite (caixas
 * escuras — a versão original). A escolha persiste em localStorage e é aplicada
 * antes do paint pelo script no <head> (evita flash).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [day, setDay] = useState(true)

  useEffect(() => {
    setDay(document.documentElement.classList.contains('day'))
  }, [])

  function toggle() {
    const next = !day
    setDay(next)
    document.documentElement.classList.toggle('day', next)
    try {
      localStorage.setItem('theme', next ? 'day' : 'night')
    } catch {
      /* localStorage indisponível — ignora */
    }
  }

  const Icon = day ? Sun : Moon

  return (
    <button
      type="button"
      onClick={toggle}
      title={day ? 'Mudar para Modo Noite' : 'Mudar para Modo Dia'}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150',
        className,
      )}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span className="text-[9.5px] font-semibold leading-none tracking-tight">
        {day ? 'Dia' : 'Noite'}
      </span>
    </button>
  )
}
