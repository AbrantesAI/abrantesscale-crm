'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function moveContact(contactId: string, newStageId: string, oldStageName: string, newStageName: string) {
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

  revalidatePath('/pipeline')
  revalidatePath(`/contacts/${contactId}`)
}

export async function updateDealValue(contactId: string, dealValue: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('contacts')
    .update({ deal_value: dealValue, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('owner_id', user.id)

  revalidatePath('/pipeline')
  revalidatePath(`/contacts/${contactId}`)
}
