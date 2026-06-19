'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'
import { addTag, removeTag } from '@/app/(app)/contacts/[id]/actions'
import type { Tag } from '@/lib/types/database.types'

const TAG_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function ContactTags({ contactId, tags }: { contactId: string; tags: Tag[] }) {
  const [adding, setAdding] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [color, setColor] = useState(TAG_COLORS[0])
  const [pending, setPending] = useState(false)

  async function handleAdd() {
    if (!newTag.trim()) return
    setPending(true)
    await addTag(contactId, newTag.trim(), color)
    setNewTag('')
    setAdding(false)
    setPending(false)
  }

  async function handleRemove(tagId: string) {
    await removeTag(contactId, tagId)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 pr-1 text-xs"
            style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}
          >
            {tag.name}
            <button
              onClick={() => handleRemove(tag.id)}
              className="ml-0.5 hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-3 h-3" />
            Adicionar tag
          </button>
        )}
      </div>

      {adding && (
        <div className="flex items-center gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nome da tag"
            className="h-7 text-xs w-36"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <div className="flex gap-1">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: c === color ? 'white' : 'transparent', outline: c === color ? `2px solid ${c}` : 'none' }}
              />
            ))}
          </div>
          <Button size="sm" className="h-7 text-xs px-2" onClick={handleAdd} disabled={pending}>
            OK
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setAdding(false)}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
