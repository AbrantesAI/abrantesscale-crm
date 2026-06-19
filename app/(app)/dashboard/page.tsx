import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, TrendingUp, Euro, CheckSquare, AlertCircle, ArrowRight } from 'lucide-react'
import { SOURCE_LABELS, LEAD_TYPE_LABELS } from '@/lib/validations/contact'
import { formatDistanceToNow, isPast, format } from 'date-fns'
import { pt } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: contacts },
    { data: recentActivities },
    { data: pendingTasks },
    { data: stages },
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, lead_type, status, deal_value, source, stage_id, created_at')
      .eq('owner_id', user.id),
    supabase
      .from('activities')
      .select('id, type, content, created_at, contact_id, contacts(full_name)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('tasks')
      .select('id, title, due_date, is_done, contact_id, contacts(full_name, id)')
      .eq('owner_id', user.id)
      .eq('is_done', false)
      .order('due_date', { ascending: true })
      .limit(6),
    supabase
      .from('pipeline_stages')
      .select('id, name, is_won')
      .eq('owner_id', user.id),
  ])

  const allContacts = contacts ?? []
  const active = allContacts.filter((c) => c.status === 'active')
  const pme = active.filter((c) => c.lead_type === 'pme')
  const creator = active.filter((c) => c.lead_type === 'creator')

  const wonStageIds = new Set((stages ?? []).filter((s) => s.is_won).map((s) => s.id))
  const wonContacts = active.filter((c) => c.stage_id && wonStageIds.has(c.stage_id))
  const pipelineValue = active
    .filter((c) => c.deal_value && !wonStageIds.has(c.stage_id ?? ''))
    .reduce((sum, c) => sum + (c.deal_value ?? 0), 0)
  const wonValue = wonContacts.reduce((sum, c) => sum + (c.deal_value ?? 0), 0)

  const overdueCount = (pendingTasks ?? []).filter(
    (t) => t.due_date && isPast(new Date(t.due_date))
  ).length

  // Contagem por origem
  const sourceCounts: Record<string, number> = {}
  for (const c of active) {
    const s = c.source ?? 'other'
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1
  }
  const sortedSources = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
  const maxSourceCount = sortedSources[0]?.[1] ?? 1

  // Contactos nos últimos 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentLeads = allContacts.filter(
    (c) => new Date(c.created_at) > thirtyDaysAgo
  ).length

  const ACTIVITY_LABELS: Record<string, string> = {
    note: 'Nota', dm: 'DM', call: 'Call', email: 'Email', follow_up: 'Follow-up', stage_change: 'Mudança',
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-xs text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })}
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Contactos ativos"
          value={active.length}
          sub={`+${recentLeads} nos últimos 30 dias`}
          icon={<Users className="w-4 h-4" />}
          color="blue"
        />
        <MetricCard
          title="PME / Scalit"
          value={pme.length}
          sub={`${creator.length} creators`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="purple"
        />
        <MetricCard
          title="Pipeline (em aberto)"
          value={`${pipelineValue.toLocaleString('pt-PT')} €`}
          sub={wonContacts.length > 0 ? `${wonValue.toLocaleString('pt-PT')} € ganho` : 'Sem ganhos ainda'}
          icon={<Euro className="w-4 h-4" />}
          color="green"
        />
        <MetricCard
          title="Tarefas pendentes"
          value={(pendingTasks ?? []).length}
          sub={overdueCount > 0 ? `${overdueCount} em atraso` : 'Tudo em dia'}
          icon={<CheckSquare className="w-4 h-4" />}
          color={overdueCount > 0 ? 'red' : 'gray'}
          alert={overdueCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de origens */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Leads por origem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              sortedSources.map(([source, count]) => (
                <div key={source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{SOURCE_LABELS[source] ?? source}</span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(count / maxSourceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            {sortedSources.length > 0 && (
              <div className="flex gap-3 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  PME: {pme.length}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Creator: {creator.length}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade recente */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent>
            {(recentActivities ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem atividades.</p>
            ) : (
              <div className="space-y-3">
                {(recentActivities ?? []).map((a) => {
                  const contact = a.contacts as { full_name: string } | null
                  return (
                    <div key={a.id} className="flex gap-2.5 text-xs">
                      <div className="w-1 shrink-0 rounded-full bg-muted mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-normal">
                            {ACTIVITY_LABELS[a.type] ?? a.type}
                          </Badge>
                          {contact && (
                            <span className="text-muted-foreground truncate">{contact.full_name}</span>
                          )}
                        </div>
                        {a.content && (
                          <p className="text-muted-foreground/80 mt-0.5 line-clamp-1">{a.content}</p>
                        )}
                        <p className="text-muted-foreground/60 mt-0.5">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: pt })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarefas pendentes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Próximas tarefas</CardTitle>
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {overdueCount} em atraso
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(pendingTasks ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem tarefas pendentes. 🎉</p>
            ) : (
              <div className="space-y-2.5">
                {(pendingTasks ?? []).map((t) => {
                  const contact = t.contacts as { full_name: string; id: string } | null
                  const overdue = t.due_date && isPast(new Date(t.due_date))
                  return (
                    <div key={t.id} className="flex gap-2.5 text-xs">
                      <div className={`w-1 shrink-0 rounded-full mt-0.5 ${overdue ? 'bg-destructive' : 'bg-muted'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{t.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                          {contact && (
                            <Link href={`/contacts/${contact.id}`} className="hover:underline truncate">
                              {contact.full_name}
                            </Link>
                          )}
                          {t.due_date && (
                            <span className={overdue ? 'text-destructive' : ''}>
                              · {format(new Date(t.due_date), "d MMM", { locale: pt })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Link href="/tasks" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type MetricCardProps = {
  title: string
  value: string | number
  sub: string
  icon: React.ReactNode
  color: 'blue' | 'purple' | 'green' | 'gray' | 'red'
  alert?: boolean
}

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  gray: 'bg-muted text-muted-foreground',
  red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

function MetricCard({ title, value, sub, icon, color, alert }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-0.5 truncate">{value}</p>
            <p className={`text-xs mt-1 ${alert ? 'text-destructive' : 'text-muted-foreground'}`}>{sub}</p>
          </div>
          <div className={`p-2 rounded-lg shrink-0 ${COLOR_MAP[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
