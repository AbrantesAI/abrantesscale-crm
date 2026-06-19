'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addTag(contactId: string, tagName: string, color: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: tag } = await supabase
    .from('tags')
    .select('id')
    .eq('owner_id', user.id)
    .eq('name', tagName)
    .single()

  if (!tag) {
    const { data: newTag } = await supabase
      .from('tags')
      .insert({ owner_id: user.id, name: tagName, color })
      .select('id')
      .single()
    tag = newTag
  }

  if (!tag) return { error: 'Erro ao criar tag.' }

  await supabase.from('contact_tags').upsert({ contact_id: contactId, tag_id: tag.id })

  revalidatePath(`/contacts/${contactId}`)
  return { success: true }
}

export async function removeTag(contactId: string, tagId: string) {
  const supabase = await createClient()
  await supabase
    .from('contact_tags')
    .delete()
    .eq('contact_id', contactId)
    .eq('tag_id', tagId)
  revalidatePath(`/contacts/${contactId}`)
}

export async function addActivity(contactId: string, type: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('activities').insert({
    owner_id: user.id,
    contact_id: contactId,
    type,
    content,
  })

  revalidatePath(`/contacts/${contactId}`)
}

export async function addTask(contactId: string, title: string, dueDate: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('tasks').insert({
    owner_id: user.id,
    contact_id: contactId,
    title,
    due_date: dueDate || null,
  })

  revalidatePath(`/contacts/${contactId}`)
}

export async function toggleTask(taskId: string, isDone: boolean, contactId: string) {
  const supabase = await createClient()
  await supabase.from('tasks').update({ is_done: isDone }).eq('id', taskId)
  revalidatePath(`/contacts/${contactId}`)
}
