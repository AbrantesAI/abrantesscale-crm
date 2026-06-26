'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, CheckSquare, Settings,
  LogOut, Crosshair, Euro, Target, FileText,
} from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

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
      {/* ── Sidebar desktop ─────────────────────────────────── */}
      <aside className="desktop-only flex flex-col w-[76px] min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
        {/* Logo */}
        <div className="flex items-center justify-center h-[60px] border-b border-sidebar-border shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-[0_0_14px_oklch(0.65_0.22_245/45%)]">
            <svg viewBox="0 0 22 22" fill="currentColor" className="w-5 h-5 text-primary-foreground">
              <rect x="0.5" y="14" width="4.5" height="7.5" rx="0.4"/>
              <rect x="7"   y="10" width="4.5" height="11.5" rx="0.4"/>
              <rect x="13.5" y="6" width="4.5" height="15.5" rx="0.4"/>
              <path d="M1 20.5 L17.5 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <polygon points="14.5,0.5 21.5,0.5 21.5,7.5"/>
            </svg>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 flex flex-col items-center gap-0.5 py-3 px-2 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 w-full py-2.5 rounded-xl transition-all duration-150 group',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="text-[9.5px] font-semibold leading-none tracking-tight text-center px-0.5 truncate w-full text-center">
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="flex flex-col items-center px-2 pb-3 pt-2 border-t border-sidebar-border shrink-0">
          <form action={logout} className="w-full">
            <button
              type="submit"
              title="Sair"
              className="flex flex-col items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span className="text-[9.5px] font-semibold leading-none tracking-tight">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Barra inferior mobile ────────────────────────────── */}
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
