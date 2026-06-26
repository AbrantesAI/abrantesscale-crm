import { z } from 'zod'

export const contactSchema = z.object({
  full_name: z.string().min(1, 'Nome obrigatório'),
  instagram: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  source: z.enum(['reels', 'stories', 'dm', 'comment', 'bio_link', 'referral', 'other']).optional().nullable(),
  lead_type: z.enum(['pme', 'creator', 'unknown']).default('unknown'),
  funnel_destination: z.enum(['scalit', 'zero_to_leverage', 'full_leverage_circle', 'mentoria_1a1']).optional().nullable(),
  community_status: z.enum(['none', 'zero_to_leverage', 'full_leverage_circle']).default('none'),
  content_pillar: z.enum(['ai_aplicada', 'tudo_e_vendas', 'builds_in_public', 'mindset', 'other']).optional().nullable(),
  deal_value: z.coerce.number().min(0).default(0),
  mrr: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  stage_id: z.string().uuid().optional().nullable(),
})

export type ContactFormData = z.infer<typeof contactSchema>

export const SOURCE_LABELS: Record<string, string> = {
  reels: 'Reels',
  stories: 'Stories',
  dm: 'DM',
  comment: 'Comentário',
  bio_link: 'Link na bio',
  referral: 'Referência',
  other: 'Outro',
}

export const LEAD_TYPE_LABELS: Record<string, string> = {
  pme: 'PME / Scalit',
  creator: 'Creator / Comunidade',
  unknown: 'Não classificado',
}

export const FUNNEL_DESTINATION_LABELS: Record<string, string> = {
  scalit: 'Scalit (agência)',
  zero_to_leverage: 'Zero to Leverage',
  full_leverage_circle: 'Full Leverage Circle',
  mentoria_1a1: 'Mentoria 1:1',
}

export const COMMUNITY_STATUS_LABELS: Record<string, string> = {
  none: 'Nenhum',
  zero_to_leverage: 'Zero to Leverage',
  full_leverage_circle: 'Full Leverage Circle',
}

export const CONTENT_PILLAR_LABELS: Record<string, string> = {
  ai_aplicada: 'AI Aplicada',
  tudo_e_vendas: 'Tudo é Vendas',
  builds_in_public: 'Builds in Public',
  mindset: 'Mindset',
  other: 'Outro',
}
