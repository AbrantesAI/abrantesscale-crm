'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Phone, AtSign, ArrowRight, ExternalLink, AlertCircle, MessageCircle, Copy, Check, RefreshCw, Sparkles } from 'lucide-react'
import { createOutreachLead, updateOutreachStatus, promoteToPipeline } from '@/app/(app)/outreach/actions'
import { SOURCE_LABELS } from '@/lib/validations/contact'
import type { Contact, PipelineStage } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

type OutreachContact = Pick<Contact, 'id' | 'full_name' | 'company' | 'phone' | 'instagram' | 'source' | 'notes' | 'outreach_status' | 'created_at'>

// Estados de Outreach alinhados com as etapas do Pipeline (mesmo vocabulário).
// Ordem = funil único focado em fechar: frio → contactado → qualificado → discovery call → entra no pipeline.
const STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'a_contactar',    label: '🔵 A contactar',    color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'ligado',         label: '📞 Contactado',      color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'qualificado',    label: '✅ Qualificado',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'reuniao_marcada',label: '📅 Discovery call',  color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'sem_interesse',  label: '⚪ Sem interesse',   color: 'bg-gray-100 text-gray-500 border-gray-200' },
]

// Estados a partir dos quais o lead já é uma oportunidade real e pode entrar no pipeline.
const PROMOTABLE = new Set(['qualificado', 'reuniao_marcada'])

// Mapeia o estado de Outreach para a etapa de Pipeline correspondente (por nome),
// para que ao promover o lead caia na etapa certa em vez de voltar sempre a "Lead".
function targetStageFor(status: string, salesStages: PipelineStage[], fallback: PipelineStage | null): PipelineStage | null {
  const byName = (kw: string) => salesStages.find(s => s.name.toLowerCase().includes(kw)) ?? null
  if (status === 'reuniao_marcada') return byName('discovery') ?? byName('reuni') ?? fallback
  if (status === 'qualificado')     return byName('qualific') ?? fallback
  return fallback
}

export function OutreachClient({
  contacts,
  salesStages,
  firstSalesStage,
}: {
  contacts: OutreachContact[]
  salesStages: PipelineStage[]
  firstSalesStage: PipelineStage | null
}) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, startCreate] = useTransition()
  const [pending, startUpdate] = useTransition()
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})
  const [promoted, setPromoted] = useState<Set<string>>(new Set())

  const getStatus = (c: OutreachContact) => localStatus[c.id] ?? c.outreach_status ?? 'a_contactar'

  const visible = useMemo(() =>
    contacts
      .filter(c => !promoted.has(c.id))
      .filter(c => filter === 'all' || getStatus(c) === filter)
      .filter(c => {
        const q = search.toLowerCase()
        return !q || c.full_name.toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contacts, filter, search, localStatus, promoted]
  )

  const stats = useMemo(() => ({
    total: contacts.filter(c => !promoted.has(c.id)).length,
    contactado: contacts.filter(c => !promoted.has(c.id) && getStatus(c) === 'ligado').length,
    qualificado: contacts.filter(c => !promoted.has(c.id) && getStatus(c) === 'qualificado').length,
    discovery: contacts.filter(c => !promoted.has(c.id) && getStatus(c) === 'reuniao_marcada').length,
  }), [contacts, localStatus, promoted])

  function handleStatusChange(contactId: string, newStatus: string) {
    setLocalStatus(prev => ({ ...prev, [contactId]: newStatus }))
    startUpdate(async () => { await updateOutreachStatus(contactId, newStatus) })
  }

  function handlePromote(contactId: string, status: string) {
    const stage = targetStageFor(status, salesStages, firstSalesStage)
    if (!stage) return
    setPromoted(prev => new Set([...prev, contactId]))
    startUpdate(async () => { await promoteToPipeline(contactId, stage.id) })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startCreate(async () => {
      const res = await createOutreachLead(fd)
      if ('success' in res) setDialogOpen(false)
    })
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Contactados', value: stats.contactado, accent: true },
          { label: 'Qualificados', value: stats.qualificado, highlight: true },
          { label: 'Discovery calls', value: stats.discovery, accent: true },
        ].map(({ label, value, accent, highlight }) => (
          <div key={label} className="bg-muted/50 rounded-lg px-3 py-2.5">
            <div className="text-[11px] text-muted-foreground truncate">{label}</div>
            <div className={cn('text-2xl font-bold mt-0.5', highlight && 'text-emerald-500', accent && value > 0 && 'text-primary')}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Meta 20 leads */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso da meta</span>
          <span className="tabular-nums">{stats.total} / 20</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (stats.total / 20) * 100)}%` }} />
        </div>
      </div>

      {/* Barra de ações */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Input placeholder="Pesquisar negócio..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={v => setFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Todos os estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="gap-1.5 shrink-0" />}>
            <Plus className="w-4 h-4" />
            Novo lead
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo lead de outreach</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome do negócio *</label>
                <Input name="full_name" placeholder="Ex: Padaria Central" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Empresa</label>
                <Input name="company" placeholder="Nome comercial" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input name="phone" placeholder="912 345 678" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Instagram</label>
                  <Input name="instagram" placeholder="@handle" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fonte</label>
                <select name="source" className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2">
                  <option value="">Seleciona a origem</option>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notas</label>
                <textarea name="notes" rows={2} placeholder="Observações rápidas..." className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2 resize-none outline-none" />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'A criar...' : 'Adicionar lead'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div className="border rounded-xl py-12 text-center text-sm text-muted-foreground">
          {contacts.length === 0 ? 'Sem leads ainda. Adiciona o primeiro!' : 'Nenhum lead corresponde ao filtro.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(contact => (
            <OutreachRow
              key={contact.id}
              contact={contact}
              currentStatus={getStatus(contact)}
              onStatusChange={handleStatusChange}
              onPromote={handlePromote}
              canPromote={!!firstSalesStage}
              pending={pending}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{visible.length} lead{visible.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

function OutreachRow({
  contact, currentStatus, onStatusChange, onPromote, canPromote, pending,
}: {
  contact: OutreachContact
  currentStatus: string
  onStatusChange: (id: string, s: string) => void
  onPromote: (id: string, status: string) => void
  canPromote: boolean
  pending: boolean
}) {
  const [dmOpen, setDmOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const storageKey = `outreach-dm-${contact.id}`

  // Carregar a DM guardada (persiste mesmo ao sair/fechar a app)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setMessage(saved)
  }, [storageKey])

  // Guardar sempre que a mensagem muda (gerar, regenerar ou editar à mão)
  useEffect(() => {
    if (message) localStorage.setItem(storageKey, message)
  }, [message, storageKey])

  async function generateMessage() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id, channel: 'dm', goal: 'outreach' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessage(data.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar mensagem')
    } finally {
      setLoading(false)
    }
  }

  function toggleDm() {
    const next = !dmOpen
    setDmOpen(next)
    if (next && !message && !loading) generateMessage()
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card border rounded-xl p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/contacts/${contact.id}`} className="font-semibold text-sm hover:underline truncate">
              {contact.full_name}
            </Link>
            {contact.company && contact.company !== contact.full_name && (
              <span className="text-xs text-muted-foreground truncate">{contact.company}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {contact.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" /> {contact.phone}
              </span>
            )}
            {contact.instagram && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <AtSign className="w-3 h-3" /> {contact.instagram.replace('@', '')}
              </span>
            )}
            {contact.source && (
              <span className="text-xs text-muted-foreground">{SOURCE_LABELS[contact.source] ?? contact.source}</span>
            )}
          </div>
          {contact.notes && (
            <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">{contact.notes}</p>
          )}
        </div>

        {/* Gerar/copiar DM de Instagram */}
        <button
          onClick={toggleDm}
          title="Mensagem de Instagram"
          className={cn(
            'shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md border transition-colors',
            dmOpen || message
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/50'
          )}
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>

        {/* Promover — oportunidade real entra no Pipeline na etapa correspondente */}
        {PROMOTABLE.has(currentStatus) && canPromote && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPromote(contact.id, currentStatus)}
            disabled={pending}
            className="shrink-0 gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 text-xs h-7"
          >
            <ArrowRight className="w-3 h-3" />
            Pipeline
          </Button>
        )}
        <Link href={`/contacts/${contact.id}`} className="text-muted-foreground/50 hover:text-muted-foreground shrink-0">
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Painel da mensagem de Instagram */}
      {dmOpen && (
        <div className="rounded-lg border bg-muted/40 p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              DM gerada {contact.instagram && <>para <span className="text-foreground">{contact.instagram.replace('@', '')}</span></>}
            </span>
            <button
              onClick={generateMessage}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              Outra versão
            </button>
          </div>

          {loading && !message ? (
            <p className="text-xs text-muted-foreground py-2 text-center">A escrever uma mensagem única...</p>
          ) : message ? (
            <>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="text-sm resize-none bg-background"
              />
              <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1.5" onClick={copyMessage}>
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado!' : 'Copiar mensagem'}
              </Button>
            </>
          ) : null}

          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      )}

      {/* Estado */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0">Estado:</span>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => onStatusChange(contact.id, s.value)}
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all',
                currentStatus === s.value
                  ? s.color + ' ring-1 ring-offset-1 ring-current'
                  : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground/50'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
