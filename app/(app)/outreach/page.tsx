import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OutreachClient } from '@/components/outreach/outreach-client'

export const metadata = { title: 'Outreach · AbrantesScale' }

export default async function OutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contacts }, { data: stages }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, full_name, company, phone, instagram, source, notes, outreach_status, created_at')
      .eq('owner_id', user.id)
      .not('outreach_status', 'is', null)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('pipeline_stages')
      .select('*')
      .eq('owner_id', user.id)
      .eq('track', 'sales')
      .order('position'),
  ])

  const firstSalesStage = stages?.find(s => !s.is_won && !s.is_lost) ?? null

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold">Outreach</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Prospecting de PMEs para o funil Scalit
        </p>
      </div>
      <OutreachClient
        contacts={contacts ?? []}
        firstSalesStage={firstSalesStage}
      />
    </div>
  )
}
