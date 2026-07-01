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

  // Novo lead entra logo na 1ª etapa do funil de vendas (mesmo funil do Pipeline).
  const { data: firstStage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('owner_id', user.id)
    .eq('track', 'sales')
    .eq('is_won', false)
    .eq('is_lost', false)
    .order('position')
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('contacts').insert({
    owner_id: user.id,
    full_name,
    company: (formData.get('company') as string) || null,
    phone: (formData.get('phone') as string) || null,
    instagram: (formData.get('instagram') as string) || null,
    source: (formData.get('source') as string) || null,
    notes: (formData.get('notes') as string) || null,
    lead_type: 'pme',
    stage_id: firstStage?.id ?? null,
    stage_changed_at: new Date().toISOString(),
    status: 'active',
  })

  if (error) return { error: 'Erro ao criar lead.' }
  revalidatePath('/outreach')
  revalidatePath('/pipeline')
  return { success: true }
}

// Move o lead para uma etapa do funil (mesma lógica do Pipeline) a partir do Outreach.
export async function setContactStage(contactId: string, newStageId: string, oldStageName: string, newStageName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('contacts')
    .update({ stage_id: newStageId, stage_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('owner_id', user.id)

  await supabase.from('activities').insert({
    owner_id: user.id,
    contact_id: contactId,
    type: 'stage_change',
    content: `Movido de "${oldStageName}" para "${newStageName}"`,
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
