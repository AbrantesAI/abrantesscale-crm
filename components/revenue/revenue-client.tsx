'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Target, TrendingUp, Users, Euro, Edit2, Briefcase } from 'lucide-react'
import { setMrrGoal, setSalary } from '@/app/(app)/revenue/actions'
import { cn } from '@/lib/utils'

const eur = (n: number) =>
  n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

type WonContact = {
  id: string
  full_name: string
  company: string | null
  deal_value: number | null
  mrr: number | null
  stage_changed_at: string | null
}

type PipelineContact = {
  id: string
  full_name: string
  deal_value: number | null
}

export function RevenueClient({
  wonContacts,
  pipelineContacts,
  mrrGoal,
  salary,
}: {
  wonContacts: WonContact[]
  pipelineContacts: PipelineContact[]
  mrrGoal: number
  salary: number
}) {
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [goalInput, setGoalInput] = useState(mrrGoal.toString())
  const [localGoal, setLocalGoal] = useState(mrrGoal)

  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [salaryInput, setSalaryInput] = useState(salary.toString())
  const [localSalary, setLocalSalary] = useState(salary)

  const [saving, startSave] = useTransition()

  const clientMrr = wonContacts.reduce((sum, c) => sum + (c.mrr ?? 0), 0)
  const totalMonthly = localSalary + clientMrr
  const pipelineValue = pipelineContacts.reduce((sum, c) => sum + (c.deal_value ?? 0), 0)
  const pct = localGoal > 0 ? Math.min(100, Math.round((totalMonthly / localGoal) * 100)) : 0

  function handleSaveGoal() {
    const n = parseFloat(goalInput.replace(',', '.'))
    if (isNaN(n) || n <= 0) return
    setLocalGoal(n)
    setGoalDialogOpen(false)
    startSave(async () => { await setMrrGoal(n) })
  }

  function handleSaveSalary() {
    const n = parseFloat(salaryInput.replace(',', '.'))
    if (isNaN(n) || n < 0) return
    setLocalSalary(n)
    setSalaryDialogOpen(false)
    startSave(async () => { await setSalary(n) })
  }

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Salário basal */}
        <div className="bg-muted/50 rounded-xl px-3 py-3 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              <span className="text-[11px] truncate">Salário</span>
            </div>
            <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
              <DialogTrigger render={<button className="text-muted-foreground hover:text-foreground transition-colors" />}>
                <Edit2 className="w-3 h-3" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                  <DialogTitle>Salário mensal (€)</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Valor bruto (€)</label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={salaryInput}
                      onChange={e => setSalaryInput(e.target.value)}
                      placeholder="1200"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveSalary()}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSaveSalary} disabled={saving}>
                    {saving ? 'A guardar...' : 'Guardar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xl font-bold tabular-nums">{eur(localSalary)}</p>
        </div>

        <StatCard icon={<Euro className="w-4 h-4" />} label="MRR Scalit" value={eur(clientMrr)} highlight={clientMrr > 0} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Total mensal" value={eur(totalMonthly)} highlight={totalMonthly > 0} />
        <StatCard icon={<Users className="w-4 h-4" />} label="Clientes ativos" value={String(wonContacts.length)} />
      </div>

      {/* Barra de progresso vs Meta */}
      <div className="bg-card border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Total mensal vs Meta</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {eur(totalMonthly)} de {eur(localGoal)} &mdash; {pct}%
            </p>
          </div>
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
              <Edit2 className="w-3.5 h-3.5" />
              Editar meta
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle>Meta de rendimento mensal</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Valor (€)</label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    placeholder="3000"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleSaveGoal()}
                  />
                </div>
                <Button className="w-full" onClick={handleSaveGoal} disabled={saving}>
                  {saving ? 'A guardar...' : 'Guardar meta'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-primary' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0 €</span>
            <span>{eur(localGoal)}</span>
          </div>
        </div>

        {/* Breakdown salário + MRR */}
        {(localSalary > 0 || clientMrr > 0) && (
          <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
            {localSalary > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/50 inline-block" />
                Salário {eur(localSalary)}
              </span>
            )}
            {clientMrr > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                MRR Scalit {eur(clientMrr)}
              </span>
            )}
          </div>
        )}

        {totalMonthly >= localGoal && localGoal > 0 && (
          <p className="text-xs text-emerald-500 font-medium">Meta atingida! 🎉</p>
        )}
      </div>

      {/* Tabela de clientes */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Clientes ativos</h2>
        </div>
        {wonContacts.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhum cliente ganho ainda. Quando fechares um deal no Pipeline aparece aqui.
          </div>
        ) : (
          <div className="divide-y">
            {wonContacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {c.full_name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/contacts/${c.id}`} className="text-sm font-medium hover:underline truncate block">
                    {c.full_name}
                  </Link>
                  {c.company && (
                    <p className="text-xs text-muted-foreground truncate">{c.company}</p>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {c.mrr ? (
                    <p className="text-sm font-semibold text-emerald-500">{eur(c.mrr)}<span className="text-[10px] font-normal text-muted-foreground">/mês</span></p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                  {c.deal_value ? (
                    <p className="text-[10px] text-muted-foreground">Setup: {eur(c.deal_value)}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline ativo */}
      {pipelineContacts.length > 0 && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">Pipeline ativo com valor definido</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Deals em negociação / proposta</p>
          </div>
          <div className="divide-y">
            {pipelineContacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <Link href={`/contacts/${c.id}`} className="text-sm font-medium hover:underline truncate block">
                    {c.full_name}
                  </Link>
                </div>
                <p className="text-sm font-semibold text-primary/80 shrink-0">
                  {c.deal_value ? eur(c.deal_value) : '—'}
                </p>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Total potencial: <span className="font-semibold text-foreground">{eur(pipelineValue)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-muted/50 rounded-xl px-3 py-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] truncate">{label}</span>
      </div>
      <p className={cn('text-xl font-bold tabular-nums', highlight && 'text-emerald-500')}>{value}</p>
    </div>
  )
}
