'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DeleteContactButton({ deleteAction }: { deleteAction: () => Promise<void> }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Tens a certeza que queres apagar este contacto? Esta ação não pode ser revertida.')) return
    startTransition(() => deleteAction())
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive gap-1.5 shrink-0"
      onClick={handleClick}
      disabled={pending}
    >
      <Trash2 className="w-4 h-4" />
      {pending ? 'A apagar...' : 'Apagar'}
    </Button>
  )
}
