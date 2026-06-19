import type { Contact, Activity, DiscoveryNote } from '@/lib/types/database.types'

export function buildContactContext(
  contact: Partial<Contact>,
  activities: Activity[],
  discoveryNote: DiscoveryNote | null
) {
  const lines: string[] = []

  lines.push(`Nome: ${contact.full_name}`)
  if (contact.instagram) lines.push(`Instagram: ${contact.instagram}`)
  if (contact.company) lines.push(`Empresa: ${contact.company}`)
  if (contact.source) lines.push(`Como chegou: ${contact.source}`)
  if (contact.lead_type) lines.push(`Tipo de lead: ${contact.lead_type === 'pme' ? 'PME (cliente Scalit)' : contact.lead_type === 'creator' ? 'Creator (comunidade)' : 'Por classificar'}`)
  if (contact.deal_value) lines.push(`Valor potencial: ${contact.deal_value}€`)
  if (contact.notes) lines.push(`Notas: ${contact.notes}`)

  if (discoveryNote) {
    if (discoveryNote.business_desc) lines.push(`Negócio: ${discoveryNote.business_desc}`)
    if (discoveryNote.pain_points) lines.push(`Dores: ${discoveryNote.pain_points}`)
    if (discoveryNote.ai_opportunity) lines.push(`Oportunidade AI: ${discoveryNote.ai_opportunity}`)
    if (discoveryNote.budget) lines.push(`Orçamento: ${discoveryNote.budget}`)
    if (discoveryNote.raw_notes) lines.push(`Notas da call: ${discoveryNote.raw_notes}`)
  }

  if (activities.length > 0) {
    lines.push(`\nHistórico de interações (${activities.length} total):`)
    activities.slice(0, 10).forEach((a) => {
      lines.push(`- [${a.type}] ${a.content ?? ''}`)
    })
  }

  return lines.join('\n')
}

export const SYSTEM_PROMPT = `És um assistente especialista em vendas e gestão de leads para a Scalit (agência de AI e automação para PMEs) e para a marca pessoal do Bernardo Abrantes (comunidade de criadores/empreendedores sobre monetização com AI).

Contexto da marca:
- Scalit: agência B2B que ajuda PMEs a implementar AI e automação. Pipeline: Lead → Discovery Call → Proposta → Negociação → Ganho.
- Comunidade: funil de criadores. Zero to Leverage (Skool gratuito) → Full Leverage Circle (49,99€/mês) → Mentoria 1:1.

Responde sempre em Português (Portugal). Sê direto, prático e orientado para ação.`
