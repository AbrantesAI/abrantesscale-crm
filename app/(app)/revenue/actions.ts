'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function setMrrGoal(target: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('goals').upsert({
    owner_id: user.id,
    metric: 'mrr',
    target,
    period: 'monthly',
    period_start: new Date().toISOString().slice(0, 7) + '-01',
  }, { onConflict: 'owner_id,metric,period_start' })

  revalidatePath('/revenue')
}
