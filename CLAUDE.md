@AGENTS.md

# CLAUDE.md — AbrantesScale CRM

## Documentação de referência
- **PLANO_TECNICO.md** — stack, schema SQL, ecrãs, roadmap por fases. Lê sempre antes de qualquer tarefa.

---

## Sobre o projeto
CRM pessoal para gestão de leads e pipeline de vendas, construído para uso próprio na Fase 1.
Nome da app: **AbrantesScale**. Instagram: @abrantesscale.

### Ecossistema da marca
O Bernardo tem dois negócios que geram dois tipos distintos de lead:
1. **Scalit** — agência de AI e automação para PMEs. Leads qualificados entram num pipeline de vendas B2B (Discovery Call → Proposta → Negociação → Ganho).
2. **Marca Pessoal / Comunidade** — funil: Instagram Reels → Zero to Leverage (Skool gratuito) → Full Leverage Circle (49,99€/mês) → Mentoria 1:1. Leads são criadores/empreendedores que querem monetizar AI.

### Dois tipos de lead (`lead_type`)
| Valor | Quem é | Caminho no pipeline |
|---|---|---|
| `pme` | Dono de negócio/PME | Track "sales": Lead → Qualificado → Discovery Call → Proposta → Ganho |
| `creator` | Criador / empreendedor | Track "community": Lead → Qualificado → ZTL → FLC → Mentoria |
| `unknown` | Ainda não classificado | — |

### Dois tracks no pipeline (`pipeline_stages.track`)
- `sales` — para leads PME / clientes Scalit
- `community` — para creators / membros da comunidade (ZTL → FLC)

### Campos de comunidade nos contactos
- `funnel_destination` — para onde o lead está a ser encaminhado: `'scalit' | 'zero_to_leverage' | 'full_leverage_circle' | 'mentoria_1a1'`
- `community_status` — estado atual no Skool: `'none' | 'zero_to_leverage' | 'full_leverage_circle'`
- `content_pillar` — qual pilar de conteúdo trouxe a pessoa: `'ai_aplicada' | 'tudo_e_vendas' | 'builds_in_public' | 'mindset' | 'other'`

### Canais de origem (`source`)
Reels, Stories, DM, Comentário, Link na bio (questionário de qualificação), Referência, Outro.

---

## Stack
- **Frontend**: Next.js 15 (App Router) + React + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Estado servidor**: TanStack Query + Server Actions
- **Base de dados**: Supabase (Postgres + Auth + RLS)
- **Drag & drop**: dnd-kit
- **Validação**: Zod
- **AI (Fase 2)**: Anthropic API via rotas server-side exclusivamente
- **Deploy**: Vercel + Supabase

---

## Idioma e texto
- Interface em **Português (PT)**.
- Termos técnicos mantêm-se em inglês: API, Lead, Pipeline, Dashboard, CRM, Follow-up, Score, Tags, etc.
- Mensagens de erro e validação também em PT.

---

## Regras de desenvolvimento

### Arquitetura
- Usar **Server Components** por defeito. Só adicionar `"use client"` quando estritamente necessário (interatividade, hooks de browser, dnd-kit).
- Lógica de negócio em Server Actions ou route handlers — nunca expor lógica sensível ao cliente.
- A **Anthropic API key** nunca vai para o cliente. Toda a comunicação com a Claude API é feita em `/app/api/ai/`.

### Base de dados
- Toda a tabela tem `owner_id` (FK para `auth.users`) — RLS ligada em todas as tabelas.
- Não fazer queries sem RLS ativo. Usar o cliente Supabase correto: `createServerClient` no server, `createBrowserClient` no client.
- Migrações em `/supabase/migrations/` com SQL versionado.

### Código
- TypeScript estrito — sem `any`.
- Schemas Zod partilhados entre cliente e servidor (em `/lib/validations/`).
- Tipos gerados do Supabase em `/lib/types/` — não escrever tipos manualmente para o que a DB já define.
- Componentes em `/components/` organizados por domínio (`/pipeline`, `/contacts`, `/ui`).

### Notificações
- Sem notificações por email por agora. Alertas só dentro da app (ex: badge de follow-ups atrasados no Dashboard).

---

## Fases de desenvolvimento — não avançar sem validar a anterior

### Fase 0 — Setup
1. Criar projeto Next.js + Tailwind + shadcn/ui.
2. Criar projeto Supabase; correr migração do schema; ligar `.env.local`.
3. Gerar tipos TypeScript do Supabase.
4. Configurar clientes Supabase (server + browser) em `/lib/supabase/`.

### Fase 1 — MVP (foco principal)
1. Auth: página `/login` + middleware de proteção de rotas + seed das `pipeline_stages` no 1.º acesso.
2. CRUD de contactos: lista `/contacts` + ficha `/contacts/[id]` + formulários + tags.
3. Pipeline Kanban `/pipeline`: colunas = etapas, cartões arrastáveis (dnd-kit), registo de `stage_change` em `activities`.
4. Atividades (timeline) + tarefas/follow-ups.
5. Dashboard `/dashboard`: métricas + gráfico de origem de leads.
6. Discovery notes na ficha do contacto.

### Fase 2 — AI (depois do MVP validado)
- Rotas server-side para Anthropic API.
- Ativar `ai_score`, `ai_summary`, geração de mensagens, sugestão de follow-up.

### Fase 3 — Instagram
- Link na bio → formulário → lead automático.

### Fase 4 — Multi-tenant / SaaS
- `tenant_id` + RLS por tenant, onboarding, planos e billing.

---

## Variáveis de ambiente (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # só server-side
ANTHROPIC_API_KEY=...                # só Fase 2, só server-side
```

---

## Decisões fechadas
- Moeda: **EUR (€)**.
- Idioma: PT com termos técnicos em inglês.
- Notificações email: não na Fase 1.
- Estilo: Server Components por defeito.
