'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { DiscoveryNote } from '@/lib/types/database.types'

type Props = {
  contactId: string
  note: DiscoveryNote | null
}

export function DiscoveryNotes({ contactId, note }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(!note)
  const [fields, setFields] = useState({
    business_desc: note?.business_desc ?? '',
    pain_points: note?.pain_points ?? '',
    ai_opportunity: note?.ai_opportunity ?? '',
    budget: note?.budget ?? '',
    raw_notes: note?.raw_notes ?? '',
  })
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (note) {
      await supabase.from('discovery_notes').update(fields).eq('id', note.id)
    } else {
      await supabase.from('discovery_notes').insert({ ...fields, contact_id: contactId, owner_id: user.id })
    }

    setSaving(false)
    setEditing(false)
    startTransition(() => router.refresh())
  }

  if (!editing && note) {
    return (
      <div className="space-y-3 text-sm">
        {note.business_desc && (
          <Field label="Descrição do negócio" value={note.business_desc} />
        )}
        {note.pain_points && (
          <Field label="Dores / problemas" value={note.pain_points} />
        )}
        {note.ai_opportunity && (
          <Field label="Oportunidade AI" value={note.ai_opportunity} />
        )}
        {note.budget && (
          <Field label="Orçamento" value={note.budget} />
        )}
        {note.raw_notes && (
          <Field label="Notas livres" value={note.raw_notes} />
        )}
        <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="mt-2">
          Editar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Descrição do negócio</Label>
        <Textarea
          value={fields.business_desc}
          onChange={(e) => setFields((p) => ({ ...p, business_desc: e.target.value }))}
          placeholder="O que faz a empresa / negócio do cliente?"
          rows={2}
          className="text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Dores / problemas</Label>
        <Textarea
          value={fields.pain_points}
          onChange={(e) => setFields((p) => ({ ...p, pain_points: e.target.value }))}
          placeholder="Quais são os principais problemas que querem resolver?"
          rows={2}
          className="text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Oportunidade de AI</Label>
        <Textarea
          value={fields.ai_opportunity}
          onChange={(e) => setFields((p) => ({ ...p, ai_opportunity: e.target.value }))}
          placeholder="Onde é que a automação/AI pode criar mais valor?"
          rows={2}
          className="text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Orçamento indicativo</Label>
        <Textarea
          value={fields.budget}
          onChange={(e) => setFields((p) => ({ ...p, budget: e.target.value }))}
          placeholder="Ex: 2.000€–5.000€/mês, projeto único de 10k€..."
          rows={1}
          className="text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notas livres</Label>
        <Textarea
          value={fields.raw_notes}
          onChange={(e) => setFields((p) => ({ ...p, raw_notes: e.target.value }))}
          placeholder="Qualquer outra informação relevante da call..."
          rows={3}
          className="text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'A guardar...' : 'Guardar notas'}
        </Button>
        {note && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  )
}
