'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, AtSign, Euro, Building2, ChevronRight } from 'lucide-react'
import { SOURCE_LABELS, LEAD_TYPE_LABELS } from '@/lib/validations/contact'
import type { Contact, PipelineStage } from '@/lib/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type ContactWithStage = Contact & { pipeline_stages: Pick<PipelineStage, 'name' | 'track'> | null }

/* Cores adaptadas ao tema navy escuro */
const LEAD_TYPE_STYLES: Record<string, { avatar: string; badge: string; label: string }> = {
  pme: {
    avatar: 'bg-blue-500/15 text-blue-300',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/20',
    label: LEAD_TYPE_LABELS.pme,
  },
  creator: {
    avatar: 'bg-purple-500/15 text-purple-300',
    badge: 'bg-purple-500/15 text-purple-300 border border-purple-500/20',
    label: LEAD_TYPE_LABELS.creator,
  },
  unknown: {
    avatar: 'bg-muted text-muted-foreground',
    badge: 'bg-muted text-muted-foreground border border-border',
    label: LEAD_TYPE_LABELS.unknown,
  },
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function ContactsTable({ contacts }: { contacts: ContactWithStage[] }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSource, setFilterSource] = useState('all')

  const filtered = useMemo(
    () =>
      contacts.filter((c) => {
        const q = search.toLowerCase()
        const matchSearch =
          c.full_name.toLowerCase().includes(q) ||
          (c.instagram ?? '').toLowerCase().includes(q) ||
          (c.company ?? '').toLowerCase().includes(q)
        const matchType = filterType === 'all' || c.lead_type === filterType
        const matchSource = filterSource === 'all' || c.source === filterSource
        return matchSearch && matchType && matchSource
      }),
    [contacts, search, filterType, filterSource]
  )

  const stats = useMemo(() => {
    const pme = contacts.filter((c) => c.lead_type === 'pme').length
    const creator = contacts.filter((c) => c.lead_type === 'creator').length
    return { total: contacts.length, pme, creator }
  }, [contacts])

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="PME / Scalit" value={stats.pme} dot="bg-blue-500" />
        <StatCard label="Creators" value={stats.creator} dot="bg-purple-500" />
      </div>

      {/* Pesquisa + filtros */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar nome, @ ou empresa..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={(v) => setFilterType(v ?? 'all')}>
            <SelectTrigger className="flex-1 sm:w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(LEAD_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={(v) => setFilterSource(v ?? 'all')}>
            <SelectTrigger className="flex-1 sm:w-44">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de contactos (cards responsivos) */}
      {filtered.length === 0 ? (
        <div className="border rounded-xl py-12 text-center text-sm text-muted-foreground">
          Nenhum contacto encontrado.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((contact) => {
            const style = LEAD_TYPE_STYLES[contact.lead_type] ?? LEAD_TYPE_STYLES.unknown
            return (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="group bg-card border rounded-xl p-3 flex items-center gap-3 hover:border-primary/40 hover:bg-muted/20 transition-colors"
              >
                {/* Avatar */}
                <div className={cn('w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold', style.avatar)}>
                  {initials(contact.full_name) || '?'}
                </div>

                {/* Centro */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{contact.full_name}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', style.badge)}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    {contact.instagram && (
                      <span className="flex items-center gap-1 min-w-0">
                        <AtSign className="w-3 h-3 shrink-0" />
                        <span className="truncate">{contact.instagram.replace('@', '')}</span>
                      </span>
                    )}
                    {contact.company && (
                      <span className="flex items-center gap-1 min-w-0">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{contact.company}</span>
                      </span>
                    )}
                    {contact.pipeline_stages && (
                      <span className="text-foreground/70 truncate">{contact.pipeline_stages.name}</span>
                    )}
                  </div>
                </div>

                {/* Direita */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {(contact.deal_value ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
                      <Euro className="w-3 h-3" />
                      {contact.deal_value!.toLocaleString('pt-PT')}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {contact.source ? SOURCE_LABELS[contact.source] ?? contact.source : ''}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true, locale: pt })}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
              </Link>
            )
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} contacto{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

function StatCard({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
        {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-lg sm:text-2xl font-bold mt-0.5">{value}</div>
    </div>
  )
}
