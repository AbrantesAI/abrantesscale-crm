import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Users, TrendingUp, Euro, CheckSquare, AlertCircle,
  ArrowRight, Clock, Flame, BarChart3,
} from 'lucide-react'
import { SOURCE_LABELS, LEAD_TYPE_LABELS } from '@/lib/validations/contact'
import { formatDistanceToNow, isPast, format, differenceInDays } from 'date-fns'
import { pt } from 'date-fns/locale'
import { PipelineFunnel } from '@/components/dashboard/pipeline-funnel'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: contacts },
    { data: recentActivities },
    { data: pendingTasks },
    { data: stages },
    { data: goals },
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, full_name, lead_type, status, deal_value, source, stage_id, stage_changed_at, created_at')
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
      .select('id, name, position, track, is_won')
      .eq('owner_id', user.id)
      .order('track')
      .order('position'),
    supabase
      .from('goals')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at'),
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

  // Leads novos (30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentLeads = allContacts.filter((c) => new Date(c.created_at) > thirtyDaysAgo).length

  // Origens
  const sourceCounts: Record<string, number> = {}
  for (const c of active) {
    const s = c.source ?? 'other'
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1
  }
  const sortedSources = Object.entries(sourceCounts).sort(([, a], [, b]) => b - a).slice(0, 6)
  const maxSourceCount = sortedSources[0]?.[1] ?? 1

  // Funil por etapa (track sales)
  const salesStages = (stages ?? []).filter((s) => s.track === 'sales')
  const funnelData = salesStages.map((s) => ({
    name: s.name,
    count: active.filter((c) => c.stage_id === s.id).length,
    isWon: s.is_won ?? false,
  }))

  // Leads encalhados (sem mover há > 14 dias, não ganhos)
  const stuckLeads = active
    .filter((c) => {
      if (!c.stage_changed_at || wonStageIds.has(c.stage_id ?? '')) return false
      return differenceInDays(new Date(), new Date(c.stage_changed_at)) >= 14
    })
    .sort((a, b) => new Date(a.stage_changed_at!).getTime() - new Date(b.stage_changed_at!).getTime())
    .slice(0, 6)

  // Top leads por deal_value
  const topLeads = active
    .filter((c) => (c.deal_value ?? 0) > 0 && !wonStageIds.has(c.stage_id ?? ''))
    .sort((a, b) => (b.deal_value ?? 0) - (a.deal_value ?? 0))
    .slice(0, 5)

  const ACTIVITY_LABELS: Record<string, string> = {
    note: 'Nota', dm: 'DM', call: 'Call', email: 'Email', follow_up: 'Follow-up', stage_change: 'Etapa',
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
          </p>
        </div>
        <Link href="/contacts/new" className="hidden lg:flex items-center gap-1.5 text-xs text-primary hover:underline">
          + Novo lead
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          title="Leads ativos"
          value={active.length}
          sub={`+${recentLeads} nos últimos 30d`}
          icon={<Users className="w-4 h-4" />}
          accent="blue"
        />
        <KpiCard
          title="Pipeline aberto"
          value={`${pipelineValue.toLocaleString('pt-PT')} €`}
          sub={wonValue > 0 ? `${wonValue.toLocaleString('pt-PT')} € ganho` : 'Sem ganhos ainda'}
          icon={<Euro className="w-4 h-4" />}
          accent="green"
        />
        <KpiCard
          title="PME / Scalit"
          value={pme.length}
          sub={`${creator.length} creator${creator.length !== 1 ? 's' : ''}`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="primary"
        />
        <KpiCard
          title="Tarefas pendentes"
          value={(pendingTasks ?? []).length}
          sub={overdueCount > 0 ? `${overdueCount} em atraso` : 'Tudo em dia'}
          icon={<CheckSquare className="w-4 h-4" />}
          accent={overdueCount > 0 ? 'red' : 'gray'}
          alert={overdueCount > 0}
        />
      </div>


      {/* Metas — só aparece se tiveres metas criadas */}
      {(goals ?? []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(goals ?? []).map((g) => {
            const pct = Math.min(100, Math.round((g.current_val / g.target) * 100))
            return (
              <Card key={g.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{g.label ?? g.metric}</span>
                    <span className="text-xs font-bold text-primary">{pct}%</span>
                  </div>
                  <div className="flex items-end gap-1.5 mb-2.5">
                    <span className="text-xl font-bold">{g.current_val.toLocaleString('pt-PT')}</span>
                    <span className="text-xs text-muted-foreground mb-0.5">/ {g.target.toLocaleString('pt-PT')}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Funil + Leads encalhados */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Funil Scalit / PME</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <PipelineFunnel data={funnelData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Leads encalhados</CardTitle>
              </div>
              {stuckLeads.length > 0 && (
                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                  +14 dias
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stuckLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum lead parado. 🎉</p>
            ) : (
              <div className="space-y-2">
                {stuckLeads.map((c) => {
                  const days = differenceInDays(new Date(), new Date(c.stage_changed_at!))
                  const stage = (stages ?? []).find((s) => s.id === c.stage_id)
                  const isVeryStuck = days > 30
                  return (
                    <Link
                      key={c.id}
                      href={`/contacts/${c.id}`}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {c.full_name}
                        </p>
                        {stage && (
                          <p className="text-xs text-muted-foreground truncate">{stage.name}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium shrink-0 ${isVeryStuck ? 'text-destructive' : 'text-amber-400'}`}>
                        {days}d
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
            <Link
              href="/pipeline"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
            >
              Ver pipeline <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Top leads + Fonte + Atividade + Tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top leads por valor */}
        {topLeads.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Top leads</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {topLeads.map((c, i) => {
                const stage = (stages ?? []).find((s) => s.id === c.stage_id)
                return (
                  <Link
                    key={c.id}
                    href={`/contacts/${c.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <span className="text-xs text-muted-foreground w-4 tabular-nums shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {c.full_name}
                      </p>
                      {stage && <p className="text-xs text-muted-foreground">{stage.name}</p>}
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 shrink-0 tabular-nums">
                      {(c.deal_value ?? 0).toLocaleString('pt-PT')} €
                    </span>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Leads por origem */}
        <Card className={topLeads.length === 0 ? 'lg:col-span-1' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Leads por origem</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {sortedSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              sortedSources.map(([source, count]) => (
                <div key={source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{SOURCE_LABELS[source] ?? source}</span>
                    <span className="font-semibold tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / maxSourceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            {sortedSources.length > 0 && (
              <div className="flex gap-3 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />PME: {pme.length}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Creator: {creator.length}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade recente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(recentActivities ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem atividades.</p>
            ) : (
              <div className="space-y-3">
                {(recentActivities ?? []).map((a) => {
                  const contact = a.contacts as { full_name: string } | null
                  return (
                    <div key={a.id} className="flex gap-2.5 text-xs">
                      <div className="w-0.5 shrink-0 rounded-full bg-primary/30 mt-0.5 self-stretch" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                        <p className="text-muted-foreground/50 mt-0.5">
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
      </div>

      {/* Próximas tarefas */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Próximas tarefas</CardTitle>
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="w-3 h-3" />
                {overdueCount} em atraso
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {(pendingTasks ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem tarefas pendentes.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
              {(pendingTasks ?? []).map((t) => {
                const contact = t.contacts as { full_name: string; id: string } | null
                const overdue = t.due_date && isPast(new Date(t.due_date))
                return (
                  <div key={t.id} className="flex gap-2.5 p-2.5 rounded-lg bg-muted/40 text-xs">
                    <div className={`w-0.5 shrink-0 rounded-full mt-0.5 ${overdue ? 'bg-destructive' : 'bg-primary/40'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold line-clamp-1">{t.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                        {contact && (
                          <Link href={`/contacts/${contact.id}`} className="hover:underline truncate">
                            {contact.full_name}
                          </Link>
                        )}
                        {t.due_date && (
                          <span className={`shrink-0 ${overdue ? 'text-destructive' : ''}`}>
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
  )
}

type KpiCardProps = {
  title: string
  value: string | number
  sub: string
  icon: React.ReactNode
  accent: 'blue' | 'green' | 'primary' | 'gray' | 'red'
  alert?: boolean
}

const ACCENT_MAP = {
  blue:    'bg-blue-500/10 text-blue-400',
  green:   'bg-emerald-500/10 text-emerald-400',
  primary: 'bg-primary/10 text-primary',
  gray:    'bg-muted text-muted-foreground',
  red:     'bg-destructive/10 text-destructive',
}

function KpiCard({ title, value, sub, icon, accent, alert }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-0.5 truncate">{value}</p>
            <p className={`text-xs mt-1 ${alert ? 'text-destructive' : 'text-muted-foreground'}`}>{sub}</p>
          </div>
          <div className={`p-2 rounded-lg shrink-0 ${ACCENT_MAP[accent]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
