import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TasksClient } from './tasks-client'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, contacts(id, full_name)')
    .eq('owner_id', user.id)
    .order('is_done', { ascending: true })
    .order('due_date', { ascending: true })

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Tarefas</h1>
      <TasksClient tasks={tasks ?? []} />
    </div>
  )
}
