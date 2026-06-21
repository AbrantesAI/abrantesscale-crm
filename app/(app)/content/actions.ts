'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createContent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Título obrigatório.' }

  const { error } = await supabase.from('content_pieces').insert({
    owner_id: user.id,
    title,
    platform: (formData.get('platform') as string) || null,
    format: (formData.get('format') as string) || null,
    pillar: (formData.get('pillar') as string) || null,
    hook: (formData.get('hook') as string) || null,
    result_base: (formData.get('result_base') as string) || null,
    url: (formData.get('url') as string) || null,
    status: (formData.get('status') as string) || 'ideia',
    published_at: (formData.get('published_at') as string) || null,
  })

  if (error) return { error: 'Erro ao criar conteúdo.' }
  revalidatePath('/content')
  return { success: true }
}

export async function updateContentStatus(id: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('content_pieces')
    .update({ status })
    .eq('id', id)
    .eq('owner_id', user.id)

  revalidatePath('/content')
}

export async function deleteContent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('content_pieces')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  revalidatePath('/content')
}
