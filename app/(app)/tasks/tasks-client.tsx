'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toggleTask } from '@/app/(app)/contacts/[id]/actions'
import type { Task } from '@/lib/types/database.types'
import { format, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { AlertCircle, User } from 'lucide-react'

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
      if (checked) next.add(task.id)
      else next.delete(task.id)
      return next
    })
    startTransition(async () => {
      await toggleTask(task.id, checked, task.contact_id ?? '')
    })
  }

  const enriched = tasks.map((t) => ({ ...t, is_done: localDone.has(t.id) }))
  const groups = groupTasks(enriched)

  const sections = [
    { key: 'overdue', label: 'Em atraso', tasks: groups.overdue, accent: 'destructive' as const },
    { key: 'today', label: 'Hoje', tasks: groups.today, accent: 'today' as const },
    { key: 'tomorrow', label: 'Amanhã', tasks: groups.tomorrow, accent: 'muted' as const },
    { key: 'thisWeek', label: 'Esta semana', tasks: groups.thisWeek, accent: 'muted' as const },
    { key: 'later', label: 'Mais tarde', tasks: groups.later, accent: 'muted' as const },
    { key: 'noDue', label: 'Sem data', tasks: groups.noDue, accent: 'muted' as const },
  ].filter((s) => s.tasks.length > 0)

  const doneCount = groups.done.length

  /* Progresso do dia: concluídas hoje vs total agendado para hoje */
  const progress = useMemo(() => {
    const total = enriched.length
    const done = enriched.filter((t) => t.is_done).length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, pct }
  }, [enriched])

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Em atraso"
          value={groups.overdue.length}
          alert={groups.overdue.length > 0}
        />
        <StatCard label="Para hoje" value={groups.today.length} accent />
        <StatCard label="Esta semana" value={groups.thisWeek.length + groups.tomorrow.length} />
      </div>

      {/* Barra de progresso */}
      {progress.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span className="tabular-nums">{progress.done}/{progress.total} concluídas</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        </div>
      )}

      {sections.length === 0 && doneCount === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sem tarefas. Adiciona uma a partir de um contacto.
        </p>
      )}

      {sections.length === 0 && doneCount > 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sem tarefas pendentes. Bom trabalho! 🎉
        </p>
      )}

      {sections.map((section) => (
        <div key={section.key} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                section.accent === 'destructive' && 'bg-destructive',
                section.accent === 'today' && 'bg-primary',
                section.accent === 'muted' && 'bg-muted-foreground/40'
              )}
            />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.label}
            </h2>
            <span className="text-xs text-muted-foreground/70">({section.tasks.length})</span>
          </div>
          {section.tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} accent={section.accent} />
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
            <TaskRow key={task.id} task={task} onToggle={handleToggle} accent="muted" />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent, alert }: { label: string; value: number; accent?: boolean; alert?: boolean }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
        {alert && <AlertCircle className="w-3 h-3 text-destructive" />}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn(
        'text-lg sm:text-2xl font-bold mt-0.5',
        alert && 'text-destructive',
        accent && !alert && 'text-primary'
      )}>
        {value}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
  accent,
}: {
  task: TaskWithContact & { is_done: boolean }
  onToggle: (t: TaskWithContact, c: boolean) => void
  accent: 'destructive' | 'today' | 'muted'
}) {
  const overdue = !task.is_done && task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border border-l-2 transition-colors',
      task.is_done
        ? 'bg-muted/30 opacity-60 border-l-border'
        : 'bg-card hover:bg-muted/20',
      !task.is_done && accent === 'destructive' && 'border-l-destructive',
      !task.is_done && accent === 'today' && 'border-l-primary',
      !task.is_done && accent === 'muted' && 'border-l-border',
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
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.contacts && (
            <Link
              href={`/contacts/${task.contacts.id}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:underline truncate"
            >
              <User className="w-3 h-3 shrink-0" />
              {task.contacts.full_name}
            </Link>
          )}
          {task.due_date && (
            <Badge
              variant={overdue ? 'destructive' : 'secondary'}
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              {format(new Date(task.due_date), 'd MMM', { locale: pt })}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
