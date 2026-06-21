'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createOutreachLead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name) return { error: 'Nome obrigatório.' }

  const { error } = await supabase.from('contacts').insert({
    owner_id: user.id,
    full_name,
    company: (formData.get('company') as string) || null,
    phone: (formData.get('phone') as string) || null,
    instagram: (formData.get('instagram') as string) || null,
    source: (formData.get('source') as string) || null,
    notes: (formData.get('notes') as string) || null,
    lead_type: 'pme',
    outreach_status: 'a_contactar',
    status: 'active',
  })

  if (error) return { error: 'Erro ao criar lead.' }
  revalidatePath('/outreach')
  return { success: true }
}

export async function updateOutreachStatus(contactId: string, newStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('contacts')
    .update({ outreach_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('owner_id', user.id)

  revalidatePath('/outreach')
}

export async function promoteToPipeline(contactId: string, stageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('contacts')
    .update({
      stage_id: stageId,
      outreach_status: null,
      stage_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contactId)
    .eq('owner_id', user.id)

  await supabase.from('activities').insert({
    owner_id: user.id,
    contact_id: contactId,
    type: 'stage_change',
    content: 'Promovido do Outreach para o Pipeline',
  })

  revalidatePath('/outreach')
  revalidatePath('/pipeline')
  revalidatePath(`/contacts/${contactId}`)
}

export async function deleteOutreachLead(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('contacts')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('owner_id', user.id)

  revalidatePath('/outreach')
}
