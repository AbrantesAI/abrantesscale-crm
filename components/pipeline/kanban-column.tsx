'use client'

import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './kanban-card'
import type { PipelineStage, Contact } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

type CardContact = Pick<Contact, 'id' | 'full_name' | 'instagram' | 'lead_type' | 'deal_value' | 'stage_id'>

type Props = {
  stage: PipelineStage
  contacts: CardContact[]
}

export function KanbanColumn({ stage, contacts }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const totalValue = contacts.reduce((sum, c) => sum + (c.deal_value ?? 0), 0)

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Cabeçalho da coluna */}
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate">{stage.name}</h3>
          {contacts.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-medium">
              {contacts.length}
            </span>
          )}
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-emerald-600 font-medium">
            {totalValue.toLocaleString('pt-PT')} €
          </span>
        )}
      </div>

      {/* Área de drop */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 rounded-xl p-2 min-h-32 transition-colors',
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/40',
        )}
      >
        {contacts.map((contact) => (
          <KanbanCard key={contact.id} contact={contact} />
        ))}

        {contacts.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground/60">Sem contactos</p>
          </div>
        )}
      </div>
    </div>
  )
}
