# Plano Técnico — CRM "AI Brand"

> Companion do PRD.md · v1
> Stack: Next.js (App Router) + Supabase · Data: 2026-06-16
> Objetivo: dar ao Claude Code tudo o que precisa para começar a construir.

---

## 1. Stack

| Camada | Escolha | Porquê |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + React + TypeScript** | Full-stack JS, SSR/Server Components, ótimo com Claude Code. |
| UI | **Tailwind CSS + shadcn/ui** | Componentes acessíveis e rápidos de montar; Kanban e tabelas limpos. |
| Estado servidor | **TanStack Query** (ou Server Actions) | Cache, sincronização e mutations simples. |
| Base de dados | **Supabase (Postgres)** | Postgres gerido + Auth + RLS + Realtime + Storage num só sítio. |
| Auth | **Supabase Auth** | Email/password na v1; pronto para OAuth e multi-utilizador. |
| Drag & drop | **dnd-kit** | Kanban fluido e acessível. |
| Validação | **Zod** | Schemas partilhados cliente/servidor. |
| AI (Fase 2) | **Anthropic API (Claude)** via rota server-side | Qualificação, resumos, geração de mensagens. |
| Deploy | **Vercel** (frontend) + Supabase (BD) | Deploy contínuo a partir do Git. |

### Estrutura de pastas sugerida
```
/app
  /(auth)/login
  /(app)/dashboard
  /(app)/contacts
  /(app)/contacts/[id]
  /(app)/pipeline
  /(app)/tasks
  /api/ai/...            # Fase 2 (rotas server-side para Claude)
/components
  /ui                    # shadcn
  /pipeline              # Kanban, cartões
  /contacts              # tabela, ficha, formulários
/lib
  /supabase              # client (browser + server)
  /validations           # schemas Zod
  /types                 # tipos gerados do Supabase
/supabase
  /migrations            # SQL versionado
```

---

## 2. Modelo de dados

Princípios:
- Toda a tabela tem `owner_id` (FK para `auth.users`) → single-user hoje, multi-user/tenant amanhã.
- `id` em `uuid`; timestamps `created_at` / `updated_at`.
- **Etapas do pipeline em tabela própria** (`pipeline_stages`), não hardcoded → posso reordenar/renomear sem migração.
- Campos de AI (`ai_score`, `ai_summary`) já existem na v1 mas ficam vazios até à Fase 2.
- Row Level Security (RLS) ligada em todas as tabelas: cada utilizador só vê os seus registos.

### Diagrama (texto)
```
auth.users
   │ 1
   │
   ├──< contacts >── pipeline_stages   (cada contacto tem uma etapa)
   │        │
   │        ├──< activities            (timeline: notas, DMs, calls, follow-ups)
   │        ├──< tasks                 (follow-ups com data)
   │        └──< discovery_notes       (estrutura recolhida na call)
   │
   └──< tags >──< contact_tags >── contacts   (many-to-many)
```

### Schema SQL (Supabase / Postgres)

```sql
-- ============ EXTENSÕES ============
create extension if not exists "uuid-ossp";

-- ============ PIPELINE STAGES ============
create table pipeline_stages (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  position    int  not null,            -- ordem das colunas no Kanban
  track       text default 'sales',     -- 'sales' (PME/Scalit) | 'community' (criadores)
  win_prob    numeric default 0,        -- probabilidade (0-1) p/ valor ponderado
  is_won      boolean default false,
  is_lost     boolean default false,
  created_at  timestamptz default now()
);

-- ============ CONTACTS ============
create table contacts (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  full_name     text not null,
  instagram     text,                   -- @handle
  email         text,
  phone         text,
  company       text,                   -- empresa / projeto
  website       text,
  source        text,                   -- 'reels' | 'stories' | 'dm' | 'comment' | 'bio_link' | 'referral' | 'other'
  stage_id      uuid references pipeline_stages(id) on delete set null,
  deal_value    numeric default 0,      -- valor potencial do negócio
  status        text default 'active',  -- 'active' | 'archived'
  notes         text,
  ai_score      int,                    -- Fase 2 (qualificação)
  ai_summary    text,                   -- Fase 2 (resumo)
  lead_type     text default 'unknown', -- 'pme' | 'creator' | 'unknown'
  funnel_destination text,             -- 'scalit' | 'zero_to_leverage' | 'full_leverage_circle' | 'mentoria_1a1'
  community_status text default 'none',-- 'none' | 'zero_to_leverage' | 'full_leverage_circle'
  content_pillar text,                 -- 'ai_aplicada' | 'tudo_e_vendas' | 'builds_in_public' | 'mindset' | 'other'
  stage_changed_at timestamptz default now(), -- p/ "dias na etapa"
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============ TAGS (many-to-many) ============
create table tags (
  id        uuid primary key default uuid_generate_v4(),
  owner_id  uuid not null references auth.users(id) on delete cascade,
  name      text not null,
  color     text default '#6366f1'
);

create table contact_tags (
  contact_id uuid references contacts(id) on delete cascade,
  tag_id     uuid references tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

-- ============ ACTIVITIES (timeline) ============
create table activities (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  contact_id  uuid not null references contacts(id) on delete cascade,
  type        text not null,            -- 'note' | 'dm' | 'call' | 'email' | 'follow_up' | 'stage_change'
  content     text,
  metadata    jsonb,                    -- ex.: { from_stage, to_stage }
  created_at  timestamptz default now()
);

-- ============ TASKS (follow-ups) ============
create table tasks (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  contact_id  uuid references contacts(id) on delete set null,
  title       text not null,
  due_date    timestamptz,
  is_done     boolean default false,
  created_at  timestamptz default now()
);

-- ============ DISCOVERY NOTES ============
create table discovery_notes (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  business_desc   text,                 -- o que o negócio faz
  pain_points     text,                 -- dores / problemas
  ai_opportunity  text,                 -- onde a AI encaixa
  budget          text,
  raw_notes       text,                 -- campo livre
  created_at      timestamptz default now()
);

-- ============ ÍNDICES ============
create index on contacts(owner_id);
create index on contacts(stage_id);
create index on activities(contact_id);
create index on tasks(owner_id, due_date);

-- ============ ROW LEVEL SECURITY ============
alter table pipeline_stages enable row level security;
alter table contacts        enable row level security;
alter table tags            enable row level security;
alter table contact_tags    enable row level security;
alter table activities      enable row level security;
alter table tasks           enable row level security;
alter table discovery_notes enable row level security;

-- Política genérica: o utilizador só acede aos seus registos.
-- (Repetir para cada tabela com owner_id; contact_tags via join.)
create policy "own_rows" on contacts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on pipeline_stages
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on tags
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on activities
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on tasks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_rows" on discovery_notes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own_contact_tags" on contact_tags
  for all using (
    exists (select 1 from contacts c where c.id = contact_id and c.owner_id = auth.uid())
  );
```

### Seed das etapas (a correr no 1.º login)

**Track "sales" — Leads PME / Scalit:**
```sql
insert into pipeline_stages (owner_id, name, position, track, win_prob, is_won, is_lost) values
  (:uid, 'Lead',                       1, 'sales', 0.05, false, false),
  (:uid, 'Qualificado',                2, 'sales', 0.15, false, false),
  (:uid, 'Discovery Call agendada',    3, 'sales', 0.35, false, false),
  (:uid, 'Discovery Call realizada',   4, 'sales', 0.50, false, false),
  (:uid, 'Proposta/Estrutura enviada', 5, 'sales', 0.70, false, false),
  (:uid, 'Negociação',                 6, 'sales', 0.85, false, false),
  (:uid, 'Ganho',                      7, 'sales', 1.00, true,  false),
  (:uid, 'Perdido',                    8, 'sales', 0.00, false, true );
```

**Track "community" — Creators / Marca Pessoal:**
```sql
insert into pipeline_stages (owner_id, name, position, track, win_prob, is_won, is_lost) values
  (:uid, 'Lead',              1, 'community', 0.05, false, false),
  (:uid, 'Qualificado',       2, 'community', 0.20, false, false),
  (:uid, 'Convidado ZTL',     3, 'community', 0.40, false, false),
  (:uid, 'Membro ZTL',        4, 'community', 0.60, false, false),
  (:uid, 'Convidado FLC',     5, 'community', 0.75, false, false),
  (:uid, 'Membro FLC',        6, 'community', 0.90, false, false),
  (:uid, 'Ganho (Mentoria)',  7, 'community', 1.00, true,  false),
  (:uid, 'Perdido',           8, 'community', 0.00, false, true );
```

> **Nota multi-tenant (futuro):** quando chegar a Fase 4, adiciona-se `tenant_id` às tabelas
> e troca-se a política RLS para filtrar por `tenant_id`. Como o `owner_id` já existe, a
> migração é aditiva, não destrutiva.

---

## 3. Ecrãs

| Ecrã | Rota | Conteúdo |
|---|---|---|
| **Login** | `/login` | Email/password (Supabase Auth). |
| **Dashboard** | `/dashboard` | Cards de métricas (leads por etapa, valor do pipeline, conversão, follow-ups atrasados), leads por canal de origem. |
| **Pipeline (Kanban)** | `/pipeline` | Colunas = etapas; cartões arrastáveis (dnd-kit); cada cartão com nome, @, valor, dias na etapa, próximo follow-up. |
| **Contactos (lista)** | `/contacts` | Tabela com pesquisa, filtros (etapa/tag/origem), ordenação; botão "Novo contacto". |
| **Ficha do contacto** | `/contacts/[id]` | Dados, tags, timeline de atividades, tarefas, discovery notes; ações rápidas (registar interação, marcar follow-up, mudar etapa). |
| **Tarefas** | `/tasks` | Hoje / Atrasadas / Próximas; check para concluir. |

### Componentes-chave
- `PipelineBoard`, `PipelineColumn`, `ContactCard` (dnd-kit).
- `ContactTable` (filtros + pesquisa).
- `ContactTimeline`, `ActivityForm`.
- `TaskList`, `QuickAddLead` (modal rápido para não perder DMs).
- `MetricCard`, `SourceBreakdownChart`.

---

## 4. Lógica importante

- **Mudança de etapa** → atualiza `contacts.stage_id` + `stage_changed_at` e insere uma
  `activity` do tipo `stage_change` com `metadata = { from_stage, to_stage }`.
- **Valor ponderado do pipeline** = Σ (`deal_value` × `win_prob` da etapa).
- **"Dias na etapa"** = `now() - stage_changed_at`.
- **Follow-ups atrasados** = `tasks` com `due_date < now()` e `is_done = false`.
- **Captura via link na bio (Fase 3)** = endpoint público que cria um `contact` com
  `source = 'bio_link'` e `stage = Lead`.

---

## 5. Pontos de extensão para a AI (Fase 2)

Deixar no código, desde a v1, "ganchos" que ficam inativos:
- `contacts.ai_score` e `contacts.ai_summary` já no schema.
- Pasta `/app/api/ai/` reservada para rotas server-side que chamam a Anthropic API
  (a chave **nunca** no cliente).
- Funções stub: `qualifyLead(contact)`, `summarizeContact(contact, activities)`,
  `suggestFollowUp(contact)`, `draftMessage(contact, intent)` — retornam placeholder na v1.

---

## 6. Roadmap por fases

### Fase 0 — Setup (0,5 dia)
- Criar projeto Next.js + Tailwind + shadcn.
- Criar projeto Supabase; correr migração do schema; ligar `.env`.
- Gerar tipos TypeScript do Supabase.

### Fase 1 — MVP (foco principal)
1. Auth (login) + seed das etapas no 1.º acesso.
2. CRUD de contactos + ficha + tags.
3. Pipeline Kanban com drag & drop e registo de `stage_change`.
4. Atividades (timeline) + tarefas/follow-ups.
5. Dashboard com métricas.
6. Discovery notes.
> Resultado: CRM totalmente funcional para uso pessoal.

### Fase 2 — Camada de AI
- Rotas server-side para Claude; ativar score, resumos, lembretes inteligentes, geração de mensagens.

### Fase 3 — Instagram
- Link na bio → formulário → lead automático. Depois (opcional) Graph API.

### Fase 4 — Multi-tenant / SaaS
- `tenant_id` + RLS por tenant, onboarding de clientes, planos e billing.

---

## 7. Como arrancar no Claude Code

1. Coloca `PRD.md` e este `PLANO_TECNICO.md` na raiz do repositório.
2. Cria um `CLAUDE.md` que aponte para ambos (ex.: *"Lê PRD.md e PLANO_TECNICO.md antes de qualquer tarefa. Stack: Next.js + Supabase. Constrói por fases."*).
3. Primeiro pedido sugerido ao Claude Code:
   > "Faz a Fase 0 e a Fase 1, passo 1 (setup do projeto + Supabase + auth + schema + seed das etapas). Não avances para o Kanban sem o auth a funcionar."
4. Avança fase a fase, validando cada passo antes do seguinte.

### Variáveis de ambiente (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # só server-side
ANTHROPIC_API_KEY=...             # só Fase 2, só server-side
```

---

## 8. Decisões em aberto (para confirmares depois)
- Nome da marca/app e domínio.
- Moeda e formato de valores (EUR €).
- Queres notificações de follow-up por email? (pode entrar na Fase 1.5)
- Multi-idioma (PT/EN) desde já ou só PT?
