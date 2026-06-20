# Catálogo de Tabelas & Dashboards — AbrantesScale CRM

> Referência para o Claude Code · v1 · 2026-06-20
> Tudo aqui está desenhado à medida do teu schema atual (Supabase/Postgres) e do teu funil real:
> **Reels/Stories → DM → Pipeline → Zero to Leverage (free) → Full Leverage Circle (49,99 €/mês) → Scalit / Mentoria 1:1.**

## Como usar este documento

O documento tem três partes que se complementam:

1. **Parte A — Tabelas de base de dados (SQL).** Novas tabelas para guardar os dados que ainda não capturas. Sem estes dados, muitos dashboards não conseguem existir. Cada tabela diz *porquê*, *o que desbloqueia* e traz o SQL pronto a correr.
2. **Parte B — Vistas SQL de análise.** "Views" que fazem o cálculo pesado (conversões, MRR, velocidade) uma vez, para o frontend só ler. É o que torna os dashboards rápidos e simples.
3. **Parte C — Dashboards & visualizações ("tabelas bonitas").** O que mostrar no ecrã: cartões de KPI, funil, cohort, tabelas ordenáveis, gráficos. Cada um diz que dados usa e que decisão ajuda a tomar.

No fim há uma **ordem de implementação sugerida** (o que dá mais valor primeiro).

Convenção: todas as tabelas seguem o teu padrão atual — `id uuid`, `owner_id uuid` (RLS `auth.uid() = owner_id`), `created_at timestamptz`. Não repito as políticas RLS em cada bloco para não poluir; aplica o mesmo `own_rows` que já tens.

---

# Parte A — Tabelas de base de dados (SQL)

Estado atual (já tens): `contacts`, `pipeline_stages`, `tags`, `contact_tags`, `activities`, `tasks`, `discovery_notes`.

O que falta para fazeres análises a sério está agrupado por área do funil.

## A1. Histórico de etapas — `stage_transitions`

**O problema:** hoje só guardas `stage_changed_at` (último movimento) e um `activity` solto. Não consegues responder a "quanto tempo um lead demora em cada etapa" nem "qual a taxa de conversão entre Discovery Call e Proposta".

**Desbloqueia:** funil de conversão real, velocidade do pipeline, tempo médio por etapa, deteção de leads encalhados.

```sql
create table stage_transitions (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  contact_id  uuid not null references contacts(id) on delete cascade,
  from_stage  uuid references pipeline_stages(id),
  to_stage    uuid references pipeline_stages(id),
  track       text,                 -- 'sales' | 'community'
  changed_at  timestamptz default now(),
  days_in_prev numeric              -- dias que esteve na etapa anterior (preenchido por trigger)
);
create index on stage_transitions(contact_id);
create index on stage_transitions(owner_id, changed_at);
```

> Dica: cria um trigger no `contacts` que insere aqui automaticamente sempre que `stage_id` muda. Assim nunca te esqueces de registar.

## A2. Negócios / projetos — `deals`

**O problema:** o valor está em `contacts.deal_value`, o que assume 1 contacto = 1 negócio. Mas um cliente Scalit pode ter vários projetos ao longo do tempo, e queres separar *valor único* de *recorrente (MRR)*.

**Desbloqueia:** previsão de faturação, separar one-off vs recorrente, histórico de negócios por cliente, win rate por tipo de oferta.

> Ordem de execução: cria `offers` (A3) **antes** de `deals`, porque `deals.offer_id` aponta para ela.

```sql
create table deals (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  contact_id    uuid not null references contacts(id) on delete cascade,
  name          text not null,
  offer_id      uuid references offers(id),      -- ver A3
  value         numeric default 0,               -- valor total ou setup
  mrr           numeric default 0,               -- mensalidade recorrente, se aplicável
  billing_type  text default 'one_off',          -- 'one_off' | 'recurring'
  stage_id      uuid references pipeline_stages(id),
  status        text default 'open',             -- 'open' | 'won' | 'lost'
  lost_reason   text,
  expected_close date,
  closed_at     timestamptz,
  created_at    timestamptz default now()
);
create index on deals(owner_id, status);
create index on deals(contact_id);
```

## A3. Ofertas / produtos — `offers`

**O problema:** as tuas ofertas (ZTL, FLC, serviços Scalit, mentoria) estão espalhadas como strings (`funnel_destination`). Uma tabela de referência dá-te consistência e permite análise por produto.

**Desbloqueia:** receita por produto, conversão por oferta, qual a oferta mais rentável.

```sql
create table offers (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,                    -- 'Zero to Leverage', 'Full Leverage Circle', 'Scalit — Setup IA', 'Mentoria 1:1'
  type         text,                             -- 'community_free' | 'community_paid' | 'service' | 'mentoria'
  price        numeric default 0,
  billing      text default 'one_off',           -- 'free' | 'one_off' | 'monthly'
  funnel_stage text,                             -- 'tofu' | 'mofu' | 'bofu'
  is_active    boolean default true
);
```

## A4. Subscrições / membros — `subscriptions`

**O problema:** o FLC é 49,99 €/mês. Recorrência implica *churn*, *MRR* e *lifetime* — métricas que `contacts` sozinho não capta. O ZTL (free) também tem um ciclo de vida (entrou → completou os 7 dias → fez upgrade).

**Desbloqueia:** MRR, churn rate, retenção por cohort, LTV, conversão free → pago.

```sql
create table subscriptions (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  contact_id    uuid not null references contacts(id) on delete cascade,
  offer_id      uuid references offers(id),
  plan          text,                            -- 'zero_to_leverage' | 'full_leverage_circle'
  status        text default 'active',           -- 'trialing' | 'active' | 'past_due' | 'cancelled'
  mrr           numeric default 0,
  started_at    timestamptz default now(),
  cancelled_at  timestamptz,
  cancel_reason text
);
create index on subscriptions(owner_id, status);
create index on subscriptions(contact_id);
```

## A5. Receita / pagamentos — `payments`

**O problema:** "valor de pipeline" é potencial; não é dinheiro real. Para saberes a faturação verdadeira precisas de registar cada entrada.

**Desbloqueia:** receita real ao longo do tempo, MRR efetivo, comparação meta vs realizado, receita por canal/oferta.

```sql
create table payments (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  contact_id      uuid references contacts(id) on delete set null,
  deal_id         uuid references deals(id) on delete set null,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount          numeric not null,
  kind            text default 'one_off',        -- 'one_off' | 'recurring'
  source          text,                          -- 'scalit' | 'full_leverage_circle' | 'mentoria'
  paid_at         timestamptz default now()
);
create index on payments(owner_id, paid_at);
```

## A6. Conteúdo publicado — `content_pieces`

**O problema:** o topo do funil (Reels, Stories, posts, newsletters) não existe na base de dados. Sem isto não consegues ligar "este Reel trouxe X leads" nem ver que pilar converte melhor.

**Desbloqueia:** atribuição de leads a conteúdo, performance por pilar/formato, calendário editorial, ligação direta ao teu `gerar_conteudo.py`.

```sql
create table content_pieces (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  platform      text,                            -- 'instagram' | 'skool' | 'newsletter' | 'linkedin'
  format        text,                            -- 'reel' | 'story' | 'post' | 'carousel' | 'email'
  pillar        text,                            -- 'ai_aplicada' | 'tudo_e_vendas' | 'builds_in_public' | 'mindset'
  title         text,
  hook          text,
  url           text,
  published_at  timestamptz,
  created_at    timestamptz default now()
);
create index on content_pieces(owner_id, published_at);
```

## A7. Métricas de conteúdo — `content_metrics`

**O problema:** as métricas de um Reel mudam ao longo do tempo (views, saves, alcance). Uma linha por conteúdo perde o histórico.

**Desbloqueia:** gráficos de evolução, taxa de engagement, alcance → perfil → lead (a tua jornada de topo de funil).

```sql
create table content_metrics (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  content_id      uuid not null references content_pieces(id) on delete cascade,
  captured_at     date default current_date,
  views           int default 0,
  reach           int default 0,
  likes           int default 0,
  comments        int default 0,
  saves           int default 0,
  shares          int default 0,
  profile_visits  int default 0,
  link_clicks     int default 0,
  new_followers   int default 0,
  unique (content_id, captured_at)
);
```

> Liga leads ao conteúdo: adiciona `origin_content_id uuid references content_pieces(id)` à tabela `contacts`. Aí consegues "este Reel converteu em N leads e X € de pipeline".

## A8. Campanhas de Ads — `campaigns` + `campaign_metrics`

**O problema:** geres Meta Ads (Atlantic Gold, imóveis de 800k€). O custo e o retorno desses anúncios não estão em lado nenhum do CRM.

**Desbloqueia:** CPL (custo por lead), CAC, ROAS, comparação de canais pagos vs orgânicos, o número que mostras em "Builds in Public".

```sql
create table campaigns (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,                     -- 'Atlantic Gold — Meta Ads', 'Lançamento ZTL'
  channel     text,                              -- 'meta_ads' | 'google' | 'organic' | 'email'
  objective   text,                              -- 'leads' | 'awareness' | 'sales'
  budget      numeric default 0,
  client_id   uuid references contacts(id),      -- se for campanha de um cliente Scalit
  started_at  date,
  ended_at    date,
  status      text default 'active'
);

create table campaign_metrics (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  captured_at   date default current_date,
  spend         numeric default 0,
  impressions   int default 0,
  clicks        int default 0,
  leads         int default 0,
  conversions   int default 0,
  unique (campaign_id, captured_at)
);
```

## A9. Snapshots diários — `daily_snapshots`

**O problema:** o teu CRM mostra sempre o *estado atual*. Não consegues ver "como estava o pipeline há um mês" porque os dados são vivos. Para gráficos de tendência precisas de fotografias diárias.

**Desbloqueia:** todos os gráficos de evolução temporal (pipeline ao longo do tempo, nº de membros, MRR histórico) sem depender de APIs externas.

```sql
create table daily_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  snapshot_date   date default current_date,
  total_leads     int default 0,
  active_leads    int default 0,
  pipeline_value  numeric default 0,
  weighted_value  numeric default 0,
  mrr             numeric default 0,
  ztl_members     int default 0,
  flc_members     int default 0,
  unique (owner_id, snapshot_date)
);
```

> Preenche com um cron diário (Supabase scheduled function / pg_cron) que faz o `insert` agregando o estado do dia.

## A10. Metas — `goals`

**O problema:** tens metas (Scalit a 1.500–3.000 €/mês até Dez 2026; comunidade a 500 membros). Sem as guardar, não consegues mostrar "realizado vs objetivo".

**Desbloqueia:** barras de progresso, gauges, o storytelling de "Builds in Public".

```sql
create table goals (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  metric      text not null,                     -- 'mrr' | 'new_leads' | 'flc_members' | 'revenue'
  target      numeric not null,
  period      text,                              -- 'monthly' | 'quarterly' | 'yearly'
  period_start date,
  period_end  date
);
```

## A11. Motivos de perda — `lost_reasons` (tabela de referência)

Pequena, mas torna a análise de win/loss limpa em vez de texto livre. Valores típicos para ti: *preço*, *sem orçamento*, *timing*, *não-fit*, *sem resposta*, *foi para concorrente*, *fez sozinho com IA*.

```sql
create table lost_reasons (
  id        uuid primary key default uuid_generate_v4(),
  owner_id  uuid not null references auth.users(id) on delete cascade,
  label     text not null
);
```

## A12. Extras opcionais (fase 2+)

Tabelas que valem a pena quando escalares, mas não são prioridade agora:

- **`touchpoints`** — multi-touch attribution (cada interação antes da conversão), para saberes o caminho completo Reel → Story → DM → call.
- **`referrals`** — quem indicou quem (`referrer_contact_id` → `referred_contact_id`), para medir o teu motor de referências.
- **`ai_score_history`** — histórico dos scores de IA (`ai_score`) ao longo do tempo, para a Fase 2 do PRD.
- **`email_campaigns` + `email_metrics`** — se as newsletters crescerem, separa-as de `content_pieces` com opens/clicks/unsubscribes próprios.

---

# Parte B — Vistas SQL de análise

Estas "views" fazem o trabalho pesado no Postgres. O frontend só faz `select * from v_xxx` — rápido e simples.

## B1. `v_funnel_conversion` — taxa de conversão por etapa

```sql
create view v_funnel_conversion as
select
  ps.track,
  ps.name as stage,
  ps.position,
  count(c.id) as contacts_in_stage,
  count(c.id) filter (where c.created_at > now() - interval '90 days') as last_90d
from pipeline_stages ps
left join contacts c on c.stage_id = ps.id and c.status = 'active'
group by ps.track, ps.name, ps.position
order by ps.track, ps.position;
```

## B2. `v_stage_velocity` — tempo médio em cada etapa

```sql
create view v_stage_velocity as
select
  ps.name as stage,
  ps.track,
  round(avg(st.days_in_prev), 1) as avg_days,
  count(*) as transitions
from stage_transitions st
join pipeline_stages ps on ps.id = st.from_stage
group by ps.name, ps.track;
```

## B3. `v_source_roi` — origem → leads → ganhos → receita

```sql
create view v_source_roi as
select
  c.source,
  count(*) as leads,
  count(*) filter (where ps.is_won) as won,
  round(100.0 * count(*) filter (where ps.is_won) / nullif(count(*),0), 1) as win_rate,
  coalesce(sum(p.amount),0) as revenue
from contacts c
left join pipeline_stages ps on ps.id = c.stage_id
left join payments p on p.contact_id = c.id
group by c.source
order by revenue desc;
```

## B4. `v_mrr_monthly` — MRR e churn por mês

```sql
create view v_mrr_monthly as
select
  date_trunc('month', started_at) as month,
  count(*) filter (where status in ('active','trialing')) as active_subs,
  sum(mrr) filter (where status = 'active') as mrr,
  count(*) filter (where cancelled_at is not null) as churned
from subscriptions
group by 1
order by 1;
```

## B5. `v_content_performance` — conteúdo → engagement → leads gerados

```sql
create view v_content_performance as
select
  cp.id, cp.format, cp.pillar, cp.title, cp.published_at,
  cm.views, cm.saves, cm.link_clicks,
  count(c.id) as leads_gerados
from content_pieces cp
left join lateral (
  select * from content_metrics m
  where m.content_id = cp.id order by captured_at desc limit 1
) cm on true
left join contacts c on c.origin_content_id = cp.id
group by cp.id, cp.format, cp.pillar, cp.title, cp.published_at,
         cm.views, cm.saves, cm.link_clicks
order by cp.published_at desc;
```

Outras úteis (mesmo padrão): `v_cohort_retention` (membros por mês de entrada × retenção), `v_pipeline_aging` (leads parados há mais de N dias), `v_goal_progress` (realizado vs `goals`), `v_cpl_by_campaign` (spend/leads por campanha).

---

# Parte C — Dashboards & visualizações ("tabelas bonitas")

O que mostrar no ecrã. Para gráficos no Next.js, **recharts** é a escolha natural (combina com shadcn/ui que já usas). Cada item diz: *o que é*, *que dados usa*, *que decisão ajuda*.

## C1. Scorecard de KPIs (linha de cartões no topo)

Já tens 4 cartões. Sugestão de conjunto completo, agrupado:

| Cartão | Fórmula | Porquê |
|---|---|---|
| **MRR** | soma `subscriptions.mrr` ativas | o número mais importante do negócio recorrente |
| **Receita do mês** | soma `payments.amount` do mês | dinheiro real, não potencial |
| **Pipeline ponderado** | Σ `deal_value × win_prob` | previsão honesta de faturação |
| **Novos leads (30d)** | `contacts` criados em 30d | saúde do topo de funil |
| **Taxa de conversão** | ganhos / total leads | eficiência comercial |
| **Membros FLC** | `subscriptions` plano FLC ativas | progresso da comunidade paga |
| **Churn (mês)** | cancelados / ativos no início | saúde da retenção |
| **CAC** | spend Ads / novos clientes | quanto custa cada cliente |

> Cartão com *sparkline* (mini-gráfico de tendência) e seta ↑/↓ vs período anterior fica especialmente bonito e informativo. Os dados de tendência vêm de `daily_snapshots`.

## C2. Funil de conversão (funnel chart)

A peça central. Barras decrescentes Lead → Qualificado → Discovery → Proposta → Negociação → Ganho, com a **% de drop-off** entre cada etapa. Um para o track `sales`, outro para `community`. Dados: `v_funnel_conversion`. Decisão: onde estás a perder leads.

## C3. Receita / MRR ao longo do tempo (area chart)

Gráfico de área empilhada: MRR (FLC) + receita one-off (Scalit) + mentoria, por mês. Dados: `v_mrr_monthly` + `payments`. Decisão: estás a crescer? Linha-meta sobreposta (de `goals`).

## C4. Tabela de performance de conteúdo (sortable)

A tua "tabela bonita" por excelência. Colunas: miniatura/título, pilar (badge colorido), formato, views, saves, **leads gerados**, **€ pipeline atribuído**. Ordenável por qualquer coluna. Dados: `v_content_performance`. Decisão: que pilar/formato repetir. Liga diretamente à tua estratégia dos 4 pilares.

## C5. Cohort de retenção (heatmap table)

Tabela-mapa-de-calor: linhas = mês de entrada na comunidade, colunas = mês 0, 1, 2, 3… , células coloridas pela % que continua membro. Dados: `subscriptions`. Decisão: o FLC retém ou é porta giratória.

## C6. Origem → Receita (tabela de atribuição)

Tabela: origem (Reels/Stories/DM/referral…) × leads × win rate × receita real. Dados: `v_source_roi`. Decisão: onde investir tempo. Substitui o teu gráfico de barras atual "Leads por origem" por uma versão com a coluna de receita.

## C7. Velocidade do pipeline (bar chart horizontal)

Dias médios em cada etapa. Barras mais longas = gargalos. Dados: `v_stage_velocity`. Decisão: que etapa está a travar negócios.

## C8. Leads encalhados / aging (tabela de alerta)

Tabela vermelha/âmbar: leads parados na mesma etapa há mais de X dias, ordenados pelo mais antigo, com botão de follow-up. Dados: `contacts.stage_changed_at`. Decisão: a quem ligar hoje. Liga-se às tuas `tasks`.

## C9. Win / Loss (donut + tabela de motivos)

Donut ganhos vs perdidos no período + tabela dos motivos de perda mais frequentes. Dados: `deals` + `lost_reasons`. Decisão: porque perdes negócios (preço? timing? fizeram sozinhos com IA?).

## C10. Meta vs Realizado (barras de progresso / gauges)

Para cada meta de `goals`: barra ou gauge "realizado / objetivo" (ex.: MRR 850 € / 1.500 €). Dados: `goals` + `v_goal_progress`. É literalmente o teu "Builds in Public" automatizado.

## C11. CPL / ROAS por campanha (combo chart)

Barras de spend + linha de CPL por campanha. Dados: `campaign_metrics`. Decisão: que anúncios escalar (relevante para Atlantic Gold e para os clientes Scalit).

## C12. Mapa de calor de atividade (calendar heatmap)

Estilo GitHub: intensidade de interações (`activities`) por dia. Dados: `activities`. Decisão: consistência do teu esforço comercial — combina com a tua narrativa de disciplina.

## C13. Sankey de jornada (avançado)

Diagrama de fluxo origem → etapa → desfecho (ganho/perdido/comunidade). Mostra visualmente como as pessoas atravessam o funil completo. Dados: `stage_transitions` + `contacts.source`. Impacto visual alto para apresentações.

## C14. Funil de comunidade (free → pago)

Específico do teu modelo: Reels → ZTL (free) → completou os 7 dias → FLC (pago) → Scalit/Mentoria. Mostra a conversão em cada salto. Dados: `subscriptions` + `stage_transitions` track `community`. Decisão: o motor free→pago funciona.

## C15. Top leads / "quentes" (tabela priorizada)

Tabela dos leads a tratar primeiro, ordenada por `ai_score` (Fase 2) ou por `deal_value × proximidade da etapa de fecho`. Dados: `contacts` + `pipeline_stages`. Decisão: foco do dia.

---

# Ordem de implementação sugerida

Por valor entregue vs esforço:

1. **`stage_transitions` + trigger** → desbloqueia funil real (C2) e velocidade (C7). Maior retorno imediato.
2. **`daily_snapshots` + cron** → desbloqueia todas as tendências e sparklines (C1, C3). Começa já, porque só acumula valor com o tempo.
3. **`offers` + `deals` + `payments`** → separa potencial de receita real; alimenta o scorecard (C1) e win/loss (C9).
4. **`subscriptions`** → MRR, churn, cohort (C3, C5, C14). Essencial quando o FLC arrancar.
5. **`content_pieces` + `content_metrics` + `origin_content_id`** → atribuição de conteúdo (C4, C6). Liga ao teu `gerar_conteudo.py`.
6. **`goals`** → meta vs realizado (C10). Rápido e ótimo para motivação/Builds in Public.
7. **`campaigns` + `campaign_metrics`** → CPL/ROAS (C11). Quando quiseres medir o pago a sério.
8. **Extras** (`touchpoints`, `referrals`, `ai_score_history`, email) → fase 2+.

> Regra prática: cada tabela nova só vale a pena quando há um dashboard que a consome. Implementa em pares **tabela → vista → visualização** para nunca teres dados mortos.
