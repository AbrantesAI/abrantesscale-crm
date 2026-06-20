'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { AtSign, Euro } from 'lucide-react'
import Link from 'next/link'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { moveContact } from '@/app/(app)/pipeline/actions'
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

export function KanbanBoard({ stages, contacts }: Props) {
  const [track, setTrack] = useState<'sales' | 'community'>('sales')
  const [activeContact, setActiveContact] = useState<CardContact | null>(null)
  const [stageOverrides, setStageOverrides] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()
  const [isMobile, setIsMobile] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string>('')

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = (matches: boolean) => setIsMobile(matches)
    update(mq.matches)
    const handler = (e: MediaQueryListEvent) => update(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const filteredStages = stages.filter((s) => s.track === track)

  const getContactStage = useCallback(
    (c: CardContact) => stageOverrides[c.id] ?? c.stage_id,
    [stageOverrides]
  )

  const contactsByStage = useCallback(
    (stageId: string) => contacts.filter((c) => getContactStage(c) === stageId),
    [contacts, getContactStage]
  )

  useEffect(() => {
    if (filteredStages.length > 0 && !filteredStages.find((s) => s.id === selectedStageId)) {
      setSelectedStageId(filteredStages[0].id)
    }
  }, [filteredStages, selectedStageId])

  async function handleMove(contactId: string, newStageId: string, oldStageName: string, newStageName: string) {
    setStageOverrides((prev) => ({ ...prev, [contactId]: newStageId }))
    startTransition(async () => {
      await moveContact(contactId, newStageId, oldStageName, newStageName)
    })
  }

  function handleDragStart(event: DragStartEvent) {
    const contact = contacts.find((c) => c.id === event.active.id)
    setActiveContact(contact ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveContact(null)
    if (!over) return
    const contactId = active.id as string
    const newStageId = over.id as string
    const oldStageId = stageOverrides[contactId] ?? contacts.find((c) => c.id === contactId)?.stage_id
    if (!oldStageId || oldStageId === newStageId) return
    const oldStage = stages.find((s) => s.id === oldStageId)
    const newStage = stages.find((s) => s.id === newStageId)
    if (!newStage) return
    handleMove(contactId, newStageId, oldStage?.name ?? '', newStage.name)
  }

  const salesStages = stages.filter((s) => s.track === 'sales')
  const communityStages = stages.filter((s) => s.track === 'community')
  const hasBothTracks = salesStages.length > 0 && communityStages.length > 0

  const trackSelector = hasBothTracks && (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit shrink-0">
      <button
        onClick={() => setTrack('sales')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          track === 'sales' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Scalit / PME
      </button>
      <button
        onClick={() => setTrack('community')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          track === 'community' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Comunidade
      </button>
    </div>
  )

  /* ── Mobile layout ── */
  if (isMobile) {
    const stageContacts = contactsByStage(selectedStageId)

    return (
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        {trackSelector}

        {/* Stage pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {filteredStages.map((stage) => {
            const count = contactsByStage(stage.id).length
            const active = stage.id === selectedStageId
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors border',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border'
                )}
              >
                {stage.name}
                {count > 0 && (
                  <span className={cn(
                    'text-xs rounded-full px-1.5 font-medium',
                    active ? 'bg-white/20 text-primary-foreground' : 'bg-muted'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Contact list */}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pb-2">
          {stageContacts.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Sem contactos nesta etapa
            </div>
          ) : (
            stageContacts.map((contact) => (
              <MobileContactRow
                key={contact.id}
                contact={contact}
                stages={filteredStages}
                currentStageId={selectedStageId}
                onMove={handleMove}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  /* ── Desktop layout (kanban) ── */
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {trackSelector}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />PME</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" />Creator</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />Por classificar</span>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {filteredStages.map((stage) => (
            <KanbanColumn key={stage.id} stage={stage} contacts={contactsByStage(stage.id)} />
          ))}

          {filteredStages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Sem etapas configuradas. Vai a Supabase e corre o seed das pipeline_stages.
            </div>
          )}
        </div>

        <DragOverlay>
          {activeContact && <KanbanCard contact={activeContact} isDragOverlay />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function MobileContactRow({
  contact,
  stages,
  currentStageId,
  onMove,
}: {
  contact: CardContact
  stages: PipelineStage[]
  currentStageId: string
  onMove: (contactId: string, newStageId: string, oldStageName: string, newStageName: string) => void
}) {
  function handleStageChange(newStageId: string) {
    if (newStageId === currentStageId) return
    const oldStage = stages.find((s) => s.id === currentStageId)
    const newStage = stages.find((s) => s.id === newStageId)
    if (!oldStage || !newStage) return
    onMove(contact.id, newStageId, oldStage.name, newStage.name)
  }

  return (
    <div className="bg-background border rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
      <span
        className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-0.5', LEAD_TYPE_DOT[contact.lead_type] ?? LEAD_TYPE_DOT.unknown)}
        title={LEAD_TYPE_LABELS[contact.lead_type]}
      />

      <div className="flex-1 min-w-0">
        <Link
          href={`/contacts/${contact.id}`}
          className="font-semibold text-sm leading-tight hover:underline truncate block"
        >
          {contact.full_name}
        </Link>
        <div className="flex items-center gap-3 mt-0.5">
          {contact.instagram && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <AtSign className="w-3 h-3" />
              <span className="truncate">{contact.instagram.replace('@', '')}</span>
            </span>
          )}
          {(contact.deal_value ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
              <Euro className="w-3 h-3" />
              {contact.deal_value!.toLocaleString('pt-PT')}
            </span>
          )}
        </div>
      </div>

      <select
        value={currentStageId}
        onChange={(e) => handleStageChange(e.target.value)}
        className="text-xs text-muted-foreground bg-muted border border-border rounded-md px-2 py-1 cursor-pointer shrink-0 max-w-[100px]"
        onClick={(e) => e.stopPropagation()}
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  )
}
