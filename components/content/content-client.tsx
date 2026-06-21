'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, ExternalLink, Trash2 } from 'lucide-react'
import { createContent, updateContentStatus, deleteContent } from '@/app/(app)/content/actions'
import { cn } from '@/lib/utils'
import type { ContentPiece } from '@/lib/types/database.types'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'skool', label: 'Skool' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const FORMATS = [
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
  { value: 'post', label: 'Post' },
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'email', label: 'Email' },
]

const PILLARS: { value: string; label: string; color: string }[] = [
  { value: 'ai_aplicada',     label: 'AI Aplicada',      color: 'bg-blue-100 text-blue-700' },
  { value: 'tudo_e_vendas',   label: 'Tudo é Vendas',    color: 'bg-amber-100 text-amber-700' },
  { value: 'builds_in_public',label: 'Builds in Public', color: 'bg-purple-100 text-purple-700' },
  { value: 'mindset',         label: 'Mindset',           color: 'bg-emerald-100 text-emerald-700' },
  { value: 'other',           label: 'Outro',             color: 'bg-gray-100 text-gray-600' },
]

const STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'ideia',     label: 'Ideia',      color: 'bg-gray-100 text-gray-600' },
  { value: 'rascunho',  label: 'Rascunho',   color: 'bg-amber-100 text-amber-700' },
  { value: 'publicado', label: 'Publicado',  color: 'bg-emerald-100 text-emerald-700' },
]

const pillarLabel  = (v: string | null) => PILLARS.find(p => p.value === v)?.label ?? v ?? '—'
const pillarColor  = (v: string | null) => PILLARS.find(p => p.value === v)?.color ?? 'bg-gray-100 text-gray-600'
const statusLabel  = (v: string) => STATUSES.find(s => s.value === v)?.label ?? v
const statusColor  = (v: string) => STATUSES.find(s => s.value === v)?.color ?? ''

export function ContentClient({ pieces }: { pieces: ContentPiece[] }) {
  const [filterPillar, setFilterPillar] = useState('all')
  const [filterFormat, setFilterFormat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, startCreate] = useTransition()
  const [updating, startUpdate] = useTransition()
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})
  const [deleted, setDeleted] = useState<Set<string>>(new Set())

  const getStatus = (p: ContentPiece) => localStatus[p.id] ?? p.status

  const visible = useMemo(() =>
    pieces
      .filter(p => !deleted.has(p.id))
      .filter(p => filterPillar === 'all' || p.pillar === filterPillar)
      .filter(p => filterFormat === 'all' || p.format === filterFormat)
      .filter(p => filterStatus === 'all' || getStatus(p) === filterStatus)
      .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pieces, filterPillar, filterFormat, filterStatus, search, localStatus, deleted]
  )

  const stats = useMemo(() => ({
    total: pieces.filter(p => !deleted.has(p.id)).length,
    publicado: pieces.filter(p => !deleted.has(p.id) && getStatus(p) === 'publicado').length,
    rascunho: pieces.filter(p => !deleted.has(p.id) && getStatus(p) === 'rascunho').length,
    ideia: pieces.filter(p => !deleted.has(p.id) && getStatus(p) === 'ideia').length,
  }), [pieces, localStatus, deleted])

  function handleStatusChange(id: string, status: string) {
    setLocalStatus(prev => ({ ...prev, [id]: status }))
    startUpdate(async () => { await updateContentStatus(id, status) })
  }

  function handleDelete(id: string) {
    setDeleted(prev => new Set([...prev, id]))
    startUpdate(async () => { await deleteContent(id) })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startCreate(async () => {
      const res = await createContent(fd)
      if ('success' in res) {
        setDialogOpen(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Ideias', value: stats.ideia },
          { label: 'Rascunhos', value: stats.rascunho, accent: stats.rascunho > 0 },
          { label: 'Publicados', value: stats.publicado, highlight: true },
        ].map(({ label, value, accent, highlight }) => (
          <div key={label} className="bg-muted/50 rounded-lg px-3 py-2.5">
            <div className="text-[11px] text-muted-foreground truncate">{label}</div>
            <div className={cn('text-2xl font-bold mt-0.5', highlight && value > 0 && 'text-emerald-500', accent && 'text-amber-500')}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros + botão */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <Input
          placeholder="Pesquisar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={filterPillar} onValueChange={v => setFilterPillar(v ?? 'all')}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Pilar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pilares</SelectItem>
            {PILLARS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFormat} onValueChange={v => setFilterFormat(v ?? 'all')}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="gap-1.5 shrink-0" />}>
            <Plus className="w-4 h-4" />
            Novo
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo conteúdo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Título / tema *</label>
                <Input name="title" placeholder="Ex: Como automatizei 80% do meu negócio" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Plataforma</label>
                  <select name="platform" className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2">
                    <option value="">—</option>
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Formato</label>
                  <select name="format" className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2">
                    <option value="">—</option>
                    {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Pilar de conteúdo</label>
                <select name="pillar" className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2">
                  <option value="">—</option>
                  {PILLARS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hook</label>
                <Input name="hook" placeholder="Primeira frase / chamada de atenção" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Baseado em resultado/cliente</label>
                <Input name="result_base" placeholder="Ex: cliente X que aumentou 40% vendas" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Estado</label>
                  <select name="status" className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2">
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Data publicação</label>
                  <Input name="published_at" type="date" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Link</label>
                <Input name="url" placeholder="https://" type="url" />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'A criar...' : 'Adicionar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div className="border rounded-xl py-12 text-center text-sm text-muted-foreground">
          {pieces.length === 0 ? 'Nenhum conteúdo ainda. Começa por adicionar uma ideia!' : 'Nenhum resultado para este filtro.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(piece => (
            <ContentRow
              key={piece.id}
              piece={piece}
              currentStatus={getStatus(piece)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              updating={updating}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{visible.length} item{visible.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

function ContentRow({ piece, currentStatus, onStatusChange, onDelete, updating }: {
  piece: ContentPiece
  currentStatus: string
  onStatusChange: (id: string, s: string) => void
  onDelete: (id: string) => void
  updating: boolean
}) {
  return (
    <div className="bg-card border rounded-xl p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{piece.title}</span>
            {piece.pillar && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', pillarColor(piece.pillar))}>
                {pillarLabel(piece.pillar)}
              </span>
            )}
            {piece.format && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full capitalize">
                {piece.format}
              </span>
            )}
          </div>
          {piece.hook && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">"{piece.hook}"</p>
          )}
          {piece.result_base && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1">📌 {piece.result_base}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {piece.url && (
            <a href={piece.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onDelete(piece.id)}
            disabled={updating}
            className="text-muted-foreground/30 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0">Estado:</span>
        <div className="flex gap-1">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => onStatusChange(piece.id, s.value)}
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all',
                currentStatus === s.value
                  ? s.color + ' border-transparent ring-1 ring-offset-1 ring-current'
                  : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground/50'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        {piece.published_at && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {new Date(piece.published_at).toLocaleDateString('pt-PT')}
          </span>
        )}
      </div>
    </div>
  )
}
