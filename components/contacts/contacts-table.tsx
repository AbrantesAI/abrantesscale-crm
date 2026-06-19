'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, AtSign, Pencil } from 'lucide-react'
import { SOURCE_LABELS, LEAD_TYPE_LABELS } from '@/lib/validations/contact'
import type { Contact, PipelineStage } from '@/lib/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'

type ContactWithStage = Contact & { pipeline_stages: Pick<PipelineStage, 'name' | 'track'> | null }

const LEAD_TYPE_BADGE: Record<string, string> = {
  pme: 'bg-blue-100 text-blue-800',
  creator: 'bg-purple-100 text-purple-800',
  unknown: 'bg-gray-100 text-gray-600',
}

export function ContactsTable({ contacts }: { contacts: ContactWithStage[] }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSource, setFilterSource] = useState('all')

  const filtered = contacts.filter((c) => {
    const matchSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.instagram ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || c.lead_type === filterType
    const matchSource = filterSource === 'all' || c.source === filterSource
    return matchSearch && matchType && matchSource
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? 'all')}>
          <SelectTrigger className="w-44">
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
          <SelectTrigger className="w-44">
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

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Etapa</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Origem</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Adicionado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum contacto encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((contact) => (
                <tr key={contact.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${contact.id}`} className="hover:underline">
                      <div className="font-medium">{contact.full_name}</div>
                      {contact.instagram && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <AtSign className="w-3 h-3" />
                          {contact.instagram.replace('@', '')}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${LEAD_TYPE_BADGE[contact.lead_type] ?? LEAD_TYPE_BADGE.unknown}`}>
                      {LEAD_TYPE_LABELS[contact.lead_type] ?? contact.lead_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {contact.pipeline_stages ? (
                      <Badge variant="outline" className="text-xs font-normal">
                        {contact.pipeline_stages.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.source ? SOURCE_LABELS[contact.source] ?? contact.source : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true, locale: pt })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${contact.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3 h-3" /> Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} contacto{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
