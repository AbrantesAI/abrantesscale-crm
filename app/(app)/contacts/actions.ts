'use server'

import { createClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/validations/contact'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ContactActionState = { error: string } | { success: boolean } | null

function parseContactForm(formData: FormData) {
  const raw = Object.fromEntries(formData)
  return contactSchema.safeParse({
    ...raw,
    deal_value: raw.deal_value || 0,
    mrr: raw.mrr || 0,
    email: raw.email || null,
    instagram: raw.instagram || null,
    phone: raw.phone || null,
    company: raw.company || null,
    website: raw.website || null,
    source: raw.source || null,
    funnel_destination: raw.funnel_destination || null,
    content_pillar: raw.content_pillar || null,
    notes: raw.notes || null,
    stage_id: raw.stage_id || null,
  })
}

export async function createContact(prevState: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = parseContactForm(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('contacts').insert({ ...parsed.data, owner_id: user.id })
  if (error) return { error: 'Erro ao criar contacto.' }

  revalidatePath('/contacts')
  return { success: true }
}

export async function updateContact(id: string, prevState: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = parseContactForm(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('contacts')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: 'Erro ao atualizar contacto.' }

  revalidatePath('/contacts')
  revalidatePath(`/contacts/${id}`)
  return { success: true }
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  revalidatePath('/contacts')
  redirect('/contacts')
}
