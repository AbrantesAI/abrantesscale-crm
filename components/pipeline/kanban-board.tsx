'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { moveContact } from '@/app/(app)/pipeline/actions'
import type { PipelineStage, Contact } from '@/lib/types/database.types'

type CardContact = Pick<Contact, 'id' | 'full_name' | 'instagram' | 'lead_type' | 'deal_value' | 'stage_id'>

type Props = {
  stages: PipelineStage[]
  contacts: CardContact[]
}

export function KanbanBoard({ stages, contacts }: Props) {
  const [track, setTrack] = useState<'sales' | 'community'>('sales')
  const [activeContact, setActiveContact] = useState<CardContact | null>(null)
  const [stageOverrides, setStageOverrides] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

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

    setStageOverrides((prev) => ({ ...prev, [contactId]: newStageId }))

    startTransition(async () => {
      await moveContact(contactId, newStageId, oldStage?.name ?? '', newStage.name)
    })
  }

  const salesStages = stages.filter((s) => s.track === 'sales')
  const communityStages = stages.filter((s) => s.track === 'community')
  const hasBothTracks = salesStages.length > 0 && communityStages.length > 0

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Seletor de track */}
      {hasBothTracks && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
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
      )}

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />PME</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" />Creator</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />Por classificar</span>
      </div>

      {/* Kanban */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {filteredStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              contacts={contactsByStage(stage.id)}
            />
          ))}

          {filteredStages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Sem etapas configuradas. Vai a Supabase e corre o seed das pipeline_stages.
            </div>
          )}
        </div>

        <DragOverlay>
          {activeContact && (
            <KanbanCard contact={activeContact} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
