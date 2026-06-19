'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { addActivity, addTask, toggleTask } from '@/app/(app)/contacts/[id]/actions'
import type { Activity, Task } from '@/lib/types/database.types'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import { pt } from 'date-fns/locale'
import { MessageSquare, Phone, Mail, FileText, Bell, GitBranch, Plus, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note: <FileText className="w-3.5 h-3.5" />,
  dm: <MessageSquare className="w-3.5 h-3.5" />,
  call: <Phone className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  follow_up: <Bell className="w-3.5 h-3.5" />,
  stage_change: <GitBranch className="w-3.5 h-3.5" />,
}

const ACTIVITY_LABELS: Record<string, string> = {
  note: 'Nota', dm: 'DM', call: 'Call', email: 'Email', follow_up: 'Follow-up', stage_change: 'Mudança de etapa',
}

type Props = {
  contactId: string
  activities: Activity[]
  tasks: Task[]
}

export function ContactTimeline({ contactId, activities, tasks }: Props) {
  const [tab, setTab] = useState<'timeline' | 'tasks'>('timeline')
  const [activityType, setActivityType] = useState('note')
  const [content, setContent] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [pending, setPending] = useState(false)

  async function handleAddActivity() {
    if (!content.trim()) return
    setPending(true)
    await addActivity(contactId, activityType, content.trim())
    setContent('')
    setPending(false)
  }

  async function handleAddTask() {
    if (!taskTitle.trim()) return
    setPending(true)
    await addTask(contactId, taskTitle.trim(), taskDue || null)
    setTaskTitle('')
    setTaskDue('')
    setPending(false)
  }

  const pendingTasks = tasks.filter(t => !t.is_done)
  const doneTasks = tasks.filter(t => t.is_done)

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['timeline', 'tasks'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'timeline' ? 'Timeline' : `Tarefas${pendingTasks.length ? ` (${pendingTasks.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'timeline' && (
        <div className="space-y-4">
          {/* Registar atividade */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
            <div className="flex gap-2">
              <Select value={activityType} onValueChange={(v) => setActivityType(v ?? 'note')}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_LABELS).filter(([v]) => v !== 'stage_change').map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Regista o que aconteceu..."
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={handleAddActivity} disabled={pending || !content.trim()} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Registar
            </Button>
          </div>

          {/* Lista de atividades */}
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sem atividades registadas.</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground mt-0.5">
                    {ACTIVITY_ICONS[a.type] ?? <FileText className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{ACTIVITY_LABELS[a.type] ?? a.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: pt })}
                      </span>
                    </div>
                    {a.content && <p className="text-sm mt-0.5 text-foreground/80">{a.content}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-4">
          {/* Nova tarefa */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
            <div className="flex gap-2">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Título da tarefa"
                className="h-8 text-sm flex-1"
              />
              <Input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="h-8 text-sm w-36"
              />
            </div>
            <Button size="sm" onClick={handleAddTask} disabled={pending || !taskTitle.trim()} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Adicionar tarefa
            </Button>
          </div>

          {/* Tarefas pendentes */}
          <div className="space-y-1.5">
            {pendingTasks.map((task) => (
              <TaskRow key={task.id} task={task} contactId={contactId} />
            ))}
            {pendingTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">Sem tarefas pendentes.</p>
            )}
          </div>

          {/* Tarefas concluídas */}
          {doneTasks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Concluídas ({doneTasks.length})</p>
              <div className="space-y-1.5 opacity-60">
                {doneTasks.map((task) => (
                  <TaskRow key={task.id} task={task} contactId={contactId} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, contactId }: { task: Task; contactId: string }) {
  const overdue = !task.is_done && task.due_date && isPast(new Date(task.due_date))

  return (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors">
      <Checkbox
        checked={task.is_done}
        onCheckedChange={(checked) => toggleTask(task.id, !!checked, contactId)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', task.is_done && 'line-through text-muted-foreground')}>{task.title}</p>
        {task.due_date && (
          <p className={cn('text-xs mt-0.5', overdue ? 'text-destructive' : 'text-muted-foreground')}>
            {overdue ? 'Atrasado — ' : ''}
            {format(new Date(task.due_date), "d 'de' MMM", { locale: pt })}
          </p>
        )}
      </div>
    </div>
  )
}
