'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { AtSign, Euro } from 'lucide-react'
import { LEAD_TYPE_LABELS } from '@/lib/validations/contact'
import type { Contact } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

type CardContact = Pick<Contact, 'id' | 'full_name' | 'instagram' | 'lead_type' | 'deal_value' | 'stage_id'>

const LEAD_TYPE_DOT: Record<string, string> = {
  pme: 'bg-blue-500',
  creator: 'bg-purple-500',
  unknown: 'bg-gray-400',
}

type Props = {
  contact: CardContact
  isDragOverlay?: boolean
}

export function KanbanCard({ contact, isDragOverlay = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
    data: { stageId: contact.stage_id },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'group bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none',
        'shadow-sm hover:shadow-md transition-shadow',
        isDragging && !isDragOverlay && 'opacity-40 shadow-none',
        isDragOverlay && 'shadow-lg rotate-1 ring-2 ring-primary/20',
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <Link
          href={`/contacts/${contact.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-semibold text-sm leading-tight hover:underline line-clamp-1"
        >
          {contact.full_name}
        </Link>
        <span className={cn('w-2 h-2 rounded-full mt-1 shrink-0', LEAD_TYPE_DOT[contact.lead_type] ?? LEAD_TYPE_DOT.unknown)} title={LEAD_TYPE_LABELS[contact.lead_type]} />
      </div>

      {contact.instagram && (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <AtSign className="w-3 h-3" />
          <span className="truncate">{contact.instagram.replace('@', '')}</span>
        </div>
      )}

      {(contact.deal_value ?? 0) > 0 && (
        <div className="flex items-center gap-0.5 mt-1.5 text-xs font-medium text-emerald-600">
          <Euro className="w-3 h-3" />
          {contact.deal_value!.toLocaleString('pt-PT')}
        </div>
      )}
    </div>
  )
}
