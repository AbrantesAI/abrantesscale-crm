'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveIcp(track: string, data: {
  sector: string
  main_pain: string
  ticket: string
  qual_signals: string
  red_flags: string
  approach: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('icp_definition').upsert(
    { owner_id: user.id, track, ...data, updated_at: new Date().toISOString() },
    { onConflict: 'owner_id,track' }
  )

  revalidatePath('/icp')
  return { success: true }
}
