'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTask(title: string, dueDate: string | null, contactId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!title.trim()) return { error: 'O título é obrigatório.' }

  const { error } = await supabase.from('tasks').insert({
    owner_id: user.id,
    title: title.trim(),
    due_date: dueDate || null,
    contact_id: contactId || null,
  })

  if (error) return { error: 'Erro ao criar tarefa.' }

  revalidatePath('/tasks')
  return { success: true }
}
