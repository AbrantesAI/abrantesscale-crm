import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, AtSign, Mail, Phone, Globe, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactForm } from '@/components/contacts/contact-form'
import { ContactTags } from '@/components/contacts/contact-tags'
import { ContactTimeline } from '@/components/contacts/contact-timeline'
import { DiscoveryNotes } from '@/components/contacts/discovery-notes'
import { AiPanel } from '@/components/contacts/ai-panel'
import { updateContact, deleteContact } from '@/app/(app)/contacts/actions'
import type { ContactActionState } from '@/app/(app)/contacts/actions'
import { DeleteContactButton } from '@/components/contacts/delete-contact-button'
import {
  SOURCE_LABELS, LEAD_TYPE_LABELS, FUNNEL_DESTINATION_LABELS,
  COMMUNITY_STATUS_LABELS, CONTENT_PILLAR_LABELS
} from '@/lib/validations/contact'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contact }, { data: stages }, { data: activities }, { data: tasks }, { data: contactTagRows }, { data: discoveryNote }] =
    await Promise.all([
      supabase.from('contacts').select('*, pipeline_stages(name, track)').eq('id', id).eq('owner_id', user.id).single(),
      supabase.from('pipeline_stages').select('*').eq('owner_id', user.id).order('track').order('position'),
      supabase.from('activities').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('contact_id', id).order('due_date', { ascending: true }),
      supabase.from('contact_tags').select('tags(*)').eq('contact_id', id),
      supabase.from('discovery_notes').select('*').eq('contact_id', id).eq('owner_id', user.id).maybeSingle(),
    ])

  if (!contact) notFound()

  const tags = contactTagRows?.flatMap((r) => (r.tags ? [r.tags as { id: string; name: string; color: string; owner_id: string }] : [])) ?? []

  async function updateContactWithId(prevState: ContactActionState, formData: FormData) {
    'use server'
    return updateContact(id, prevState, formData)
  }

  const pipelineStage = (contact as unknown as { pipeline_stages: { name: string; track: string } | null }).pipeline_stages

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contacts">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground -ml-2">
            <ChevronLeft className="w-4 h-4" /> Contactos
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{contact.full_name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            {contact.instagram && (
              <span className="flex items-center gap-1"><AtSign className="w-3.5 h-3.5" />{contact.instagram}</span>
            )}
            {contact.email && (
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{contact.email}</span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{contact.phone}</span>
            )}
            {contact.company && (
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{contact.company}</span>
            )}
            {contact.website && (
              <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                <Globe className="w-3.5 h-3.5" />{contact.website}
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {contact.lead_type && (
              <Badge variant="outline" className="text-xs">{LEAD_TYPE_LABELS[contact.lead_type]}</Badge>
            )}
            {contact.source && (
              <Badge variant="secondary" className="text-xs">{SOURCE_LABELS[contact.source]}</Badge>
            )}
            {pipelineStage && (
              <Badge className="text-xs">{pipelineStage.name}</Badge>
            )}
            {(contact.deal_value ?? 0) > 0 && (
              <Badge variant="outline" className="text-xs font-mono">{contact.deal_value!.toLocaleString('pt-PT')} €</Badge>
            )}
          </div>
        </div>

        <DeleteContactButton deleteAction={async () => { 'use server'; await deleteContact(id) }} />
      </div>

      <ContactTags contactId={id} tags={tags} />

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Dados do contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm
                action={updateContactWithId}
                contact={contact}
                stages={stages ?? []}
              />
            </CardContent>
          </Card>

          {(contact.funnel_destination || contact.community_status !== 'none' || contact.content_pillar) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Comunidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {contact.funnel_destination && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destino</span>
                    <span>{FUNNEL_DESTINATION_LABELS[contact.funnel_destination]}</span>
                  </div>
                )}
                {contact.community_status && contact.community_status !== 'none' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skool</span>
                    <span>{COMMUNITY_STATUS_LABELS[contact.community_status]}</span>
                  </div>
                )}
                {contact.content_pillar && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pilar</span>
                    <span>{CONTENT_PILLAR_LABELS[contact.content_pillar]}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {contact.lead_type === 'pme' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Discovery Call — Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <DiscoveryNotes contactId={id} note={discoveryNote ?? null} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <ContactTimeline
            contactId={id}
            activities={activities ?? []}
            tasks={tasks ?? []}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <span className="text-primary">✦</span> Assistente AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AiPanel
                contactId={id}
                initialScore={contact.ai_score ?? null}
                initialSummary={contact.ai_summary ?? null}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
