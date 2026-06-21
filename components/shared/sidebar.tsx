'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Kanban, CheckSquare, Settings, LogOut, Crosshair, Euro, Target, FileText } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/outreach',  label: 'Outreach',   icon: Crosshair },
  { href: '/pipeline',  label: 'Pipeline',   icon: Kanban },
  { href: '/contacts',  label: 'Contactos',  icon: Users },
  { href: '/tasks',     label: 'Tarefas',    icon: CheckSquare },
  { href: '/revenue',   label: 'Receita',    icon: Euro },
  { href: '/icp',       label: 'ICP',        icon: Target },
  { href: '/content',   label: 'Conteúdo',   icon: FileText },
  { href: '/settings',  label: 'Definições', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar — só visível em desktop */}
      <aside className="desktop-only flex flex-col w-56 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary shadow-[0_0_12px_oklch(0.65_0.22_245/50%)]">
            <svg viewBox="0 0 22 22" fill="currentColor" className="w-4 h-4 text-primary-foreground">
              {/* Barras ascendentes */}
              <rect x="0.5" y="14" width="4.5" height="7.5" rx="0.4"/>
              <rect x="7" y="10" width="4.5" height="11.5" rx="0.4"/>
              <rect x="13.5" y="6" width="4.5" height="15.5" rx="0.4"/>
              {/* Linha diagonal */}
              <path d="M1 20.5 L17.5 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              {/* Seta (triângulo no canto superior direito) */}
              <polygon points="14.5,0.5 21.5,0.5 21.5,7.5"/>
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">AbrantesScale</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 pb-3 border-t border-sidebar-border pt-3">
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2.5 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* Barra de navegação inferior — só visível em mobile */}
      <nav className="mobile-only fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border h-16">
        <div className="flex items-center overflow-x-auto scrollbar-hide h-full px-1 gap-0.5 snap-x snap-mandatory">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 snap-start',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[9px] font-medium whitespace-nowrap">{label}</span>
              </Link>
            )
          })}
          <form action={logout} className="shrink-0 snap-start">
            <button
              type="submit"
              className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-medium">Sair</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  )
}
