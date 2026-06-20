'use client'

import { useState, useTransition, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { AtSign, Euro, ChevronDown, ChevronLeft, ChevronRight, ArrowDown } from 'lucide-react'
import { moveContact, updateDealValue } from '@/app/(app)/pipeline/actions'
import { LEAD_TYPE_LABELS } from '@/lib/validations/contact'
import { cn } from '@/lib/utils'
import type { PipelineStage, Contact } from '@/lib/types/database.types'

type CardContact = Pick<Contact, 'id' | 'full_name' | 'instagram' | 'lead_type' | 'deal_value' | 'stage_id'>

type Props = {
  stages: PipelineStage[]
  contacts: CardContact[]
}

const LEAD_TYPE_DOT: Record<string, string> = {
  pme: 'bg-blue-500',
  creator: 'bg-purple-500',
  unknown: 'bg-gray-400',
}

/* Progressão de azul Scalit → cyan ao longo do funil. Ganho = esmeralda, Perdido = vermelho. */
const FUNNEL_SHADES = ['#7CB2F2', '#5BA0E6', '#3E8DDD', '#2A7AD0', '#1E66BC', '#1655A3', '#114788']

function shadeFor(stage: PipelineStage, index: number) {
  if (stage.is_won) return '#34a37e'
  if (stage.is_lost) return '#b4533f'
  return FUNNEL_SHADES[Math.min(index, FUNNEL_SHADES.length - 1)]
}

const eur = (n: number) => n.toLocaleString('pt-PT') + ' €'

export function PipelineFunnel({ stages, contacts }: Props) {
  const [track, setTrack] = useState<'sales' | 'community'>('sales')
  const [openStage, setOpenStage] = useState<string | null>(null)
  const [stageOverrides, setStageOverrides] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  const getContactStage = useCallback(
    (c: CardContact) => stageOverrides[c.id] ?? c.stage_id,
    [stageOverrides]
  )

  const salesStages = stages.filter((s) => s.track === 'sales')
  const communityStages = stages.filter((s) => s.track === 'community')
  const hasBothTracks = salesStages.length > 0 && communityStages.length > 0
  const filteredStages = stages.filter((s) => s.track === track)

  const contactsByStage = useCallback(
    (stageId: string) => contacts.filter((c) => getContactStage(c) === stageId),
    [contacts, getContactStage]
  )

  const counts = filteredStages.map((s) => contactsByStage(s.id).length)
  const maxCount = Math.max(1, ...counts)

  const summary = useMemo(() => {
    const flowStages = filteredStages.filter((s) => !s.is_lost)
    const totalLeads = flowStages.reduce((a, s) => a + contactsByStage(s.id).length, 0)
    const openValue = flowStages
      .filter((s) => !s.is_won)
      .reduce(
        (a, s) => a + contactsByStage(s.id).reduce((sum, c) => sum + (c.deal_value ?? 0), 0),
        0
      )
    const first = flowStages[0] ? contactsByStage(flowStages[0].id).length : 0
    const won = flowStages.find((s) => s.is_won)
    const wonCount = won ? contactsByStage(won.id).length : 0
    const conv = first > 0 ? Math.round((wonCount / first) * 100) : 0
    return { totalLeads, openValue, conv }
  }, [filteredStages, contactsByStage])

  function handleMove(contactId: string, newStageId: string, currentStageId: string) {
    if (newStageId === currentStageId) return
    const oldStage = stages.find((s) => s.id === currentStageId)
    const newStage = stages.find((s) => s.id === newStageId)
    if (!newStage) return
    setStageOverrides((prev) => ({ ...prev, [contactId]: newStageId }))
    startTransition(async () => {
      await moveContact(contactId, newStageId, oldStage?.name ?? '', newStage.name)
    })
  }

  const trackSelector = hasBothTracks && (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
      <button
        onClick={() => setTrack('sales')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          track === 'sales' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Scalit / PME
      </button>
      <button
        onClick={() => setTrack('community')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          track === 'community' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Comunidade
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {trackSelector}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Leads no funil" value={String(summary.totalLeads)} />
        <SummaryCard label="Valor em aberto" value={eur(summary.openValue)} accent />
        <SummaryCard label="Conversão total" value={summary.conv + '%'} />
      </div>

      {/* Funil */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 pb-2">
        {filteredStages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-12 text-center">
            Sem etapas configuradas. Corre o seed das pipeline_stages no Supabase.
          </div>
        )}

        {filteredStages.map((stage, i) => {
          const stageContacts = contactsByStage(stage.id)
          const count = stageContacts.length
          const pct = Math.max(24, Math.round((count / maxCount) * 100))
          const totalValue = stageContacts.reduce((sum, c) => sum + (c.deal_value ?? 0), 0)
          const prevCount = i > 0 ? counts[i - 1] : null
          const dropoff = prevCount && prevCount > 0 ? Math.round((count / prevCount) * 100) : null
          const isOpen = openStage === stage.id

          return (
            <div key={stage.id}>
              {dropoff !== null && (
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground py-0.5">
                  <ArrowDown className="w-3 h-3" />
                  {dropoff}%
                </div>
              )}

              {/* Linha da etapa */}
              <button
                onClick={() => setOpenStage(isOpen ? null : stage.id)}
                className="w-full flex items-center gap-2 sm:gap-3 group"
              >
                <div className="w-20 sm:w-32 shrink-0 text-right text-xs sm:text-sm font-medium truncate">
                  {stage.name}
                </div>

                <div className="flex-1 flex justify-center min-w-0">
                  <div
                    className="h-9 sm:h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold transition-all group-hover:brightness-110"
                    style={{ width: `${pct}%`, minWidth: 44, backgroundColor: shadeFor(stage, i) }}
                  >
                    {count}
                  </div>
                </div>

                <div className="w-[84px] sm:w-28 shrink-0 text-left">
                  <div className="text-[11px] sm:text-xs text-foreground/90 truncate">
                    {totalValue > 0 ? eur(totalValue) : '—'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground">
                    {Math.round((stage.win_prob ?? 0) * 100)}% prob.
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    'w-4 h-4 shrink-0 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Contactos da etapa */}
              {isOpen && (
                <div className="mt-1.5 mb-1 ml-[88px] sm:ml-[140px] mr-7 flex flex-col gap-1.5">
                  {stageContacts.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70 py-1">Sem contactos nesta etapa.</p>
                  ) : (
                    stageContacts.map((c) => (
                      <FunnelContactRow
                        key={c.id}
                        contact={c}
                        stages={filteredStages}
                        currentStageId={stage.id}
                        onMove={handleMove}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-muted-foreground shrink-0">
        Toca numa etapa para ver os contactos · a largura é proporcional ao número de leads
      </p>
    </div>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2.5">
      <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{label}</div>
      <div className={cn('text-lg sm:text-2xl font-bold mt-0.5 truncate', accent && 'text-emerald-500')}>
        {value}
      </div>
    </div>
  )
}

function FunnelContactRow({
  contact,
  stages,
  currentStageId,
  onMove,
}: {
  contact: CardContact
  stages: PipelineStage[]
  currentStageId: string
  onMove: (contactId: string, newStageId: string, currentStageId: string) => void
}) {
  const idx = stages.findIndex((s) => s.id === currentStageId)
  const prevStage = idx > 0 ? stages[idx - 1] : null
  const nextStage = idx < stages.length - 1 ? stages[idx + 1] : null

  const [editingValue, setEditingValue] = useState(false)
  const [localValue, setLocalValue] = useState(contact.deal_value?.toString() ?? '')
  const [displayValue, setDisplayValue] = useState(contact.deal_value)
  const inputRef = useRef<HTMLInputElement>(null)
  const [, startSave] = useTransition()

  function openEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLocalValue(displayValue?.toString() ?? '')
    setEditingValue(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function saveValue(e?: React.MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    const num = localValue === '' ? null : parseFloat(localValue.replace(',', '.'))
    const final = num === null || isNaN(num) ? null : num
    setDisplayValue(final)
    setEditingValue(false)
    startSave(async () => {
      await updateDealValue(contact.id, final)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveValue()
    if (e.key === 'Escape') setEditingValue(false)
  }

  return (
    <div className="bg-background border rounded-lg p-2.5 flex items-center gap-2.5 shadow-sm">
      <span
        className={cn('w-2 h-2 rounded-full shrink-0', LEAD_TYPE_DOT[contact.lead_type] ?? LEAD_TYPE_DOT.unknown)}
        title={LEAD_TYPE_LABELS[contact.lead_type]}
      />
      <div className="flex-1 min-w-0">
        <Link
          href={`/contacts/${contact.id}`}
          className="font-medium text-sm leading-tight hover:underline truncate block"
        >
          {contact.full_name}
        </Link>
        <div className="flex items-center gap-3 mt-0.5">
          {contact.instagram && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <AtSign className="w-3 h-3 shrink-0" />
              <span className="truncate">{contact.instagram.replace('@', '')}</span>
            </span>
          )}

          {/* Valor do ticket — clica para editar */}
          {editingValue ? (
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Euro className="w-3 h-3 text-emerald-500 shrink-0" />
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="1"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => saveValue()}
                className="w-20 text-xs bg-muted border border-primary rounded px-1.5 py-0.5 outline-none text-foreground"
                placeholder="0"
              />
            </div>
          ) : (
            <button
              onClick={openEdit}
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium rounded px-1 py-0.5 -ml-1 transition-colors hover:bg-muted',
                (displayValue ?? 0) > 0 ? 'text-emerald-500' : 'text-muted-foreground/60'
              )}
              title="Clica para editar o valor"
            >
              <Euro className="w-3 h-3" />
              {(displayValue ?? 0) > 0 ? displayValue!.toLocaleString('pt-PT') : 'Adicionar valor'}
            </button>
          )}
        </div>
      </div>

      {/* Navegação entre etapas */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          disabled={!prevStage}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (prevStage) onMove(contact.id, prevStage.id, currentStageId)
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          title={prevStage ? `Mover para "${prevStage.name}"` : undefined}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] text-muted-foreground w-16 text-center truncate leading-tight">
          {stages[idx]?.name ?? '—'}
        </span>
        <button
          disabled={!nextStage}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (nextStage) onMove(contact.id, nextStage.id, currentStageId)
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          title={nextStage ? `Mover para "${nextStage.name}"` : undefined}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
