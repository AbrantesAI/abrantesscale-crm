'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toggleTask } from '@/app/(app)/contacts/[id]/actions'
import type { Task } from '@/lib/types/database.types'
import { format, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type TaskWithContact = Task & { contacts: { id: string; full_name: string } | null }

type Props = {
  tasks: TaskWithContact[]
}

function groupTasks(tasks: TaskWithContact[]) {
  const overdue: TaskWithContact[] = []
  const today: TaskWithContact[] = []
  const tomorrow: TaskWithContact[] = []
  const thisWeek: TaskWithContact[] = []
  const later: TaskWithContact[] = []
  const done: TaskWithContact[] = []
  const noDue: TaskWithContact[] = []

  for (const t of tasks) {
    if (t.is_done) { done.push(t); continue }
    if (!t.due_date) { noDue.push(t); continue }
    const d = new Date(t.due_date)
    if (isPast(d) && !isToday(d)) overdue.push(t)
    else if (isToday(d)) today.push(t)
    else if (isTomorrow(d)) tomorrow.push(t)
    else if (isThisWeek(d, { weekStartsOn: 1 })) thisWeek.push(t)
    else later.push(t)
  }

  return { overdue, today, tomorrow, thisWeek, later, noDue, done }
}

export function TasksClient({ tasks }: Props) {
  const [localDone, setLocalDone] = useState<Set<string>>(
    new Set(tasks.filter((t) => t.is_done).map((t) => t.id))
  )
  const [showDone, setShowDone] = useState(false)
  const [, startTransition] = useTransition()

  function handleToggle(task: TaskWithContact, checked: boolean) {
    setLocalDone((prev) => {
      const next = new Set(prev)
      checked ? next.add(task.id) : next.delete(task.id)
      return next
    })
    startTransition(async () => {
      await toggleTask(task.id, checked, task.contact_id ?? '')
    })
  }

  const enriched = tasks.map((t) => ({ ...t, is_done: localDone.has(t.id) }))
  const groups = groupTasks(enriched)

  const sections = [
    { key: 'overdue', label: 'Em atraso', tasks: groups.overdue, labelClass: 'text-destructive' },
    { key: 'today', label: 'Hoje', tasks: groups.today, labelClass: 'text-primary' },
    { key: 'tomorrow', label: 'Amanhã', tasks: groups.tomorrow, labelClass: '' },
    { key: 'thisWeek', label: 'Esta semana', tasks: groups.thisWeek, labelClass: '' },
    { key: 'later', label: 'Mais tarde', tasks: groups.later, labelClass: '' },
    { key: 'noDue', label: 'Sem data', tasks: groups.noDue, labelClass: '' },
  ].filter((s) => s.tasks.length > 0)

  const doneCount = groups.done.length

  return (
    <div className="space-y-6">
      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sem tarefas pendentes. Bom trabalho!
        </p>
      )}

      {sections.map((section) => (
        <div key={section.key} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h2 className={cn('text-xs font-semibold uppercase tracking-wide', section.labelClass || 'text-muted-foreground')}>
              {section.label}
            </h2>
            <span className="text-xs text-muted-foreground">({section.tasks.length})</span>
          </div>
          {section.tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} />
          ))}
        </div>
      ))}

      {doneCount > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowDone(!showDone)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDone ? '▾' : '▸'} Concluídas ({doneCount})
          </button>
          {showDone && groups.done.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle }: { task: TaskWithContact & { is_done: boolean }; onToggle: (t: TaskWithContact, c: boolean) => void }) {
  const overdue = !task.is_done && task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
      task.is_done ? 'bg-muted/30 opacity-60' : 'bg-background hover:bg-muted/20',
    )}>
      <Checkbox
        checked={task.is_done}
        onCheckedChange={(checked) => onToggle(task, !!checked)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', task.is_done && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.contacts && (
            <Link href={`/contacts/${task.contacts.id}`} className="text-xs text-muted-foreground hover:underline truncate">
              {task.contacts.full_name}
            </Link>
          )}
          {task.due_date && (
            <Badge
              variant={overdue ? 'destructive' : 'secondary'}
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              {format(new Date(task.due_date), "d MMM", { locale: pt })}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
