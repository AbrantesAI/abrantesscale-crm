'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { buttonVariants } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ContactForm } from './contact-form'
import { createContact } from '@/app/(app)/contacts/actions'
import type { PipelineStage } from '@/lib/types/database.types'

export function NewContactDialog({ stages }: { stages: PipelineStage[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: 'sm' })}>
        <Plus className="w-4 h-4" />
        Novo contacto
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo contacto</DialogTitle>
        </DialogHeader>
        <ContactForm
          action={createContact}
          stages={stages}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
