import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RevenueClient } from '@/components/revenue/revenue-client'

export const metadata = { title: 'Receita · AbrantesScale' }

export default async function RevenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Etapa "Ganho" do track sales
  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('id, is_won, is_lost')
    .eq('owner_id', user.id)
    .eq('track', 'sales')

  const wonStageId = stages?.find(s => s.is_won)?.id
  const activeStageIds = stages?.filter(s => !s.is_won && !s.is_lost).map(s => s.id) ?? []

  const [{ data: wonContacts }, { data: pipelineContacts }, { data: goals }] = await Promise.all([
    wonStageId
      ? supabase
          .from('contacts')
          .select('id, full_name, company, deal_value, stage_changed_at')
          .eq('owner_id', user.id)
          .eq('stage_id', wonStageId)
          .eq('status', 'active')
          .order('stage_changed_at', { ascending: false })
      : { data: [] },
    activeStageIds.length > 0
      ? supabase
          .from('contacts')
          .select('id, full_name, deal_value')
          .eq('owner_id', user.id)
          .in('stage_id', activeStageIds)
          .eq('status', 'active')
          .not('deal_value', 'is', null)
          .gt('deal_value', 0)
          .order('deal_value', { ascending: false })
      : { data: [] },
    supabase
      .from('goals')
      .select('target')
      .eq('owner_id', user.id)
      .eq('metric', 'mrr')
      .order('period_start', { ascending: false })
      .limit(1),
  ])

  const mrrGoal = goals?.[0]?.target ?? 3000

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold">Receita</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          MRR da Scalit e pipeline de valor
        </p>
      </div>
      <RevenueClient
        wonContacts={wonContacts ?? []}
        pipelineContacts={pipelineContacts ?? []}
        mrrGoal={mrrGoal}
      />
    </div>
  )
}
