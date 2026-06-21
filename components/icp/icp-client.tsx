'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, CheckCircle2, ShieldAlert, Lightbulb, Briefcase, Euro, Search } from 'lucide-react'
import { saveIcp } from '@/app/(app)/icp/actions'
import { cn } from '@/lib/utils'
import type { IcpDefinition } from '@/lib/types/database.types'

type IcpData = Pick<IcpDefinition, 'sector' | 'main_pain' | 'ticket' | 'qual_signals' | 'red_flags' | 'approach'>

const FIELDS: { key: keyof IcpData; label: string; placeholder: string; icon: React.ReactNode }[] = [
  { key: 'sector',       label: 'Setor ideal',              placeholder: 'Ex: Restauração, Clínicas, E-commerce PME...', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'main_pain',    label: 'Dor principal',            placeholder: 'Ex: Não têm tempo para marketing, precisam de mais clientes...', icon: <Search className="w-4 h-4" /> },
  { key: 'ticket',       label: 'Ticket médio esperado',    placeholder: 'Ex: 500 €/mês setup + 300 €/mês retainer...', icon: <Euro className="w-4 h-4" /> },
  { key: 'qual_signals', label: 'Sinais de qualificação',   placeholder: 'Ex: Já investe em marketing, tem > 5 funcionários, factura > 200k...', icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: 'red_flags',    label: 'Red flags',                placeholder: 'Ex: Quer resultados em 1 semana, não tem orçamento, trabalha sozinho...', icon: <ShieldAlert className="w-4 h-4" /> },
  { key: 'approach',     label: 'Gancho de abordagem',      placeholder: 'Ex: "Ajudo restaurantes a atrair 20% mais clientes com IA em 30 dias"', icon: <Lightbulb className="w-4 h-4" /> },
]

export function IcpClient({ icp }: { icp: IcpData | null }) {
  const empty: IcpData = { sector: '', main_pain: '', ticket: '', qual_signals: '', red_flags: '', approach: '' }
  const [editing, setEditing] = useState(!icp)
  const [form, setForm] = useState<IcpData>(icp ?? empty)
  const [saved, setSaved] = useState(false)
  const [saving, startSave] = useTransition()

  function handleSave() {
    startSave(async () => {
      await saveIcp({
        sector:       form.sector       ?? '',
        main_pain:    form.main_pain    ?? '',
        ticket:       form.ticket       ?? '',
        qual_signals: form.qual_signals ?? '',
        red_flags:    form.red_flags    ?? '',
        approach:     form.approach     ?? '',
      })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define o perfil do teu cliente ideal para filtrar leads e afinar o outreach.
        </p>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5 shrink-0">
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            {icp && (
              <Button size="sm" variant="ghost" onClick={() => { setForm(icp); setEditing(false) }}>
                Cancelar
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? 'A guardar...' : saved ? '✓ Guardado' : 'Guardar'}
            </Button>
          </div>
        )}
      </div>

      {/* Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, placeholder, icon }) => (
          <div
            key={key}
            className={cn(
              'bg-card border rounded-xl p-4 space-y-2',
              key === 'approach' && 'sm:col-span-2'
            )}
          >
            <div className="flex items-center gap-2 text-primary">
              {icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            {editing ? (
              <textarea
                value={form[key] ?? ''}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={key === 'approach' ? 3 : 2}
                className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            ) : (
              <p className={cn('text-sm whitespace-pre-wrap', !form[key] && 'text-muted-foreground/50 italic')}>
                {form[key] || placeholder}
              </p>
            )}
          </div>
        ))}
      </div>

      {!editing && icp && (
        <p className="text-xs text-muted-foreground text-right">
          Última atualização: {icp ? new Date().toLocaleDateString('pt-PT') : '—'}
        </p>
      )}

      {!icp && !editing && (
        <div className="border-2 border-dashed rounded-xl py-10 text-center space-y-2">
          <p className="text-sm text-muted-foreground">ICP ainda não definido.</p>
          <Button size="sm" onClick={() => setEditing(true)}>Definir ICP agora</Button>
        </div>
      )}
    </div>
  )
}
