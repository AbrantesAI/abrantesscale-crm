import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { NewContactDialog } from '@/components/contacts/new-contact-dialog'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: stages }, { data: contacts }] = await Promise.all([
    supabase
      .from('pipeline_stages')
      .select('*')
      .eq('owner_id', user.id)
      .order('position'),
    supabase
      .from('contacts')
      .select('id, full_name, instagram, lead_type, deal_value, stage_id, community_status')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .order('stage_changed_at', { ascending: false }),
  ])

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold">Pipeline</h1>
        <NewContactDialog stages={stages ?? []} />
      </div>
      <KanbanBoard stages={stages ?? []} contacts={contacts ?? []} />
    </div>
  )
}
