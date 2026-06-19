'use client'

import { useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  SOURCE_LABELS, LEAD_TYPE_LABELS, FUNNEL_DESTINATION_LABELS,
  COMMUNITY_STATUS_LABELS, CONTENT_PILLAR_LABELS
} from '@/lib/validations/contact'
import type { ContactActionState } from '@/app/(app)/contacts/actions'
import type { Contact, PipelineStage } from '@/lib/types/database.types'

type Props = {
  action: (prevState: ContactActionState, formData: FormData) => Promise<ContactActionState>
  contact?: Contact
  stages?: PipelineStage[]
  onSuccess?: () => void
}

export function ContactForm({ action, contact, stages = [], onSuccess }: Props) {
  const [state, formAction, pending] = useActionState(action, null)

  useEffect(() => {
    if (state && 'success' in state) onSuccess?.()
  }, [state, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="full_name">Nome *</Label>
          <Input id="full_name" name="full_name" defaultValue={contact?.full_name} required placeholder="Nome completo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" defaultValue={contact?.instagram ?? ''} placeholder="@handle" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ''} placeholder="email@exemplo.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={contact?.phone ?? ''} placeholder="+351 9xx xxx xxx" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Empresa / Projeto</Label>
          <Input id="company" name="company" defaultValue={contact?.company ?? ''} placeholder="Nome da empresa" />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Origem</Label>
          <Select name="source" defaultValue={contact?.source ?? undefined}>
            <SelectTrigger><SelectValue placeholder="Seleciona..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de lead</Label>
          <Select name="lead_type" defaultValue={contact?.lead_type ?? 'unknown'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Destino do funil</Label>
          <Select name="funnel_destination" defaultValue={contact?.funnel_destination ?? undefined}>
            <SelectTrigger><SelectValue placeholder="Seleciona..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(FUNNEL_DESTINATION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Pilar de conteúdo</Label>
          <Select name="content_pillar" defaultValue={contact?.content_pillar ?? undefined}>
            <SelectTrigger><SelectValue placeholder="Seleciona..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTENT_PILLAR_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Estado Skool</Label>
          <Select name="community_status" defaultValue={contact?.community_status ?? 'none'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(COMMUNITY_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal_value">Valor potencial (€)</Label>
          <Input id="deal_value" name="deal_value" type="number" min="0" step="0.01"
            defaultValue={contact?.deal_value ?? 0} placeholder="0" />
        </div>
        {stages.length > 0 && (
          <div className="col-span-2 space-y-1.5">
            <Label>Etapa do pipeline</Label>
            <Select name="stage_id" defaultValue={contact?.stage_id ?? undefined}>
              <SelectTrigger><SelectValue placeholder="Seleciona uma etapa..." /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.track})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" defaultValue={contact?.notes ?? ''} placeholder="Notas livres..." rows={3} />
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'A guardar...' : contact ? 'Guardar alterações' : 'Criar contacto'}
      </Button>
    </form>
  )
}
