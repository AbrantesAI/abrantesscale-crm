# Briefing para o Claude Code — próximos builds

> Cola estes prompts no Claude Code **um de cada vez**, pela ordem apresentada.
> Espera que cada um termine, testa, e só depois passas ao seguinte.
> O Claude Code já tem o contexto no `CLAUDE.md` / `PLANO_TECNICO.md` — estes prompts assumem isso.

Regras que valem para todos (relembra se ele se desviar):
- Português (PT) na interface. TypeScript estrito, sem `any`.
- Toda a query respeita RLS e filtra por `owner_id`. Crons usam o service client (`createServiceClient`) + `Bearer ${CRON_SECRET}`.
- Tipos vêm de `lib/types/database.types.ts`. Se criares tabelas/colunas novas, atualiza os tipos.
- Lógica sensível em Server Actions / route handlers, nunca no cliente.
- No fim de cada tarefa, corre `npx tsc --noEmit` e garante que passa.

---

## Prompt 1 — Cron de snapshots diários + gráfico de tendências

```
Quero registar uma fotografia diária do estado do negócio para poder ver evolução ao longo do tempo. A tabela `daily_snapshots` já existe (migration 002).

1. Cria a rota `app/api/cron/daily-snapshot/route.ts`:
   - Método GET, `runtime = 'nodejs'`.
   - Autenticação: header `authorization` tem de ser `Bearer ${process.env.CRON_SECRET}`; caso contrário 401.
   - Usa `createServiceClient` (lib/supabase/service).
   - Para cada owner que tenha contactos, calcula e faz UPSERT em `daily_snapshots` (conflito em `owner_id, snapshot_date`, com `snapshot_date = hoje`):
     - `total_leads` = total de contactos do owner
     - `active_leads` = contactos com `status = 'active'`
     - `pipeline_value` = soma de `deal_value` dos contactos ativos cuja etapa NÃO é `is_won` nem `is_lost`
     - `mrr` = soma de `contacts.mrr` dos contactos ativos numa etapa `is_won` do track 'sales' + os que têm `community_status = 'full_leverage_circle'` (× 49.99 se não tiverem mrr próprio)
     - `ztl_members` = contactos com `community_status = 'zero_to_leverage'`
     - `flc_members` = contactos com `community_status = 'full_leverage_circle'`
   - Devolve `{ ok: true, owners: N }`.

2. Cria/atualiza `vercel.json` na raiz com os crons (mantém o de task-reminders se já existir):
   - `daily-snapshot` → `0 6 * * *` (06:00 UTC, diário)
   - `task-reminders` → `0 7 * * *`

3. No Dashboard, adiciona um card "Tendências" (componente client com recharts, em `components/dashboard/trends-chart.tsx`):
   - Lê os últimos 30 `daily_snapshots` do owner (ordenados por data).
   - Gráfico de área/linha com `pipeline_value` e `mrr` ao longo do tempo.
   - Toggle simples para alternar a métrica visível (pipeline / MRR / membros FLC).
   - Se houver menos de 2 snapshots, mostra um estado vazio: "Os gráficos de evolução aparecem a partir de amanhã, à medida que os snapshots se acumulam."

Não inventes colunas que não existam — confirma os nomes em `lib/types/database.types.ts`. No fim corre `npx tsc --noEmit`.
```

Depois de implementado, testa localmente com:
```
curl -H "Authorization: Bearer SEU_CRON_SECRET" http://localhost:3000/api/cron/daily-snapshot
```

---

## Prompt 2 — Bot de Telegram orientado a eventos

```
Já existe o cron `task-reminders` que envia as tarefas do dia via Telegram (usa `TELEGRAM_BOT_TOKEN` e `user_metadata.telegram_chat_id`). Quero que o bot passe a notificar eventos do CRM em tempo real, não só tarefas.

1. Cria um helper `lib/telegram.ts` com `sendTelegram(chatId: string, text: string)` que faz POST a `https://api.telegram.org/bot${token}/sendMessage` com `parse_mode: 'Markdown'`. Não rebenta se o token ou chatId faltarem (faz no-op silencioso).

2. Adiciona uma função `notifyOwner(ownerId, text)` que vai buscar o `telegram_chat_id` do owner (via `supabase.auth.admin.getUserById`) e chama `sendTelegram`. Tem de poder ser chamada a partir de Server Actions.

3. Dispara notificações nestes eventos (chama `notifyOwner` dentro das Server Actions existentes, sem partir o fluxo — usa try/catch para nunca falhar a ação principal):
   - Novo lead criado → "🟢 Novo lead: *{nome}* via {origem}"
   - Mudança de etapa → "➡️ *{nome}*: {etapa antiga} → {etapa nova}" (no `moveContact`)
   - Negócio ganho (movido para etapa `is_won`) → "🏆 GANHO: *{nome}* — {deal_value} €"
   - Lead marcado como perdido (etapa `is_lost`) → "🔴 Perdido: *{nome}* — {motivo se houver}"
   - Novo membro FLC (`community_status` muda para 'full_leverage_circle') → "💎 Novo membro FLC: *{nome}*"

4. Nas Definições (`/settings`), adiciona um campo para o utilizador guardar o `telegram_chat_id` no seu `user_metadata`, com instruções curtas de como o obter (falar com @userinfobot).

Mantém PT, TypeScript estrito, e corre `npx tsc --noEmit` no fim.
```

---

## Prompt 3 — Motor de Outreach (prospecção sem chamadas)

```
O módulo `/outreach` já existe (usa `contacts.outreach_status`). Quero transformá-lo num motor de prospecção que não dependa de telefonemas no horário de trabalho.

1. Migration nova `006_outreach_engine.sql`:
   - Tabela `outreach_sequences` (owner_id, name, channel 'email'|'linkedin'|'dm', created_at).
   - Tabela `outreach_steps` (sequence_id, step_order, delay_days, template text).
   - Tabela `outreach_enrollments` (contact_id, sequence_id, current_step, status 'active'|'paused'|'done', next_action_at, started_at).
   - RLS `own_rows` em todas (igual às existentes). Atualiza `database.types.ts`.

2. UI em `/outreach`:
   - Gestão de sequências e passos (criar/editar templates com variáveis tipo {primeiro_nome}, {empresa}).
   - Inscrever um contacto numa sequência.
   - Vista "Ações de hoje": lista de enrollments com `next_action_at <= hoje`, mostrando o template já preenchido com os dados do contacto e um botão "copiar mensagem" + "marcar como enviado" (avança o passo e recalcula `next_action_at`).
   - Templates por ICP: pré-preenche a partir de `icp_definition` (sales) quando fizer sentido.

3. Liga ao funil: quando um contacto responde e é qualificado, botão para o mover para a primeira etapa do track 'sales'.

Foco em copiar/colar e follow-up assíncrono — nada que exija ligar durante o dia. PT, TS estrito, `npx tsc --noEmit` no fim.
```

---

## Ordem recomendada e porquê

1. **Snapshots** primeiro — quanto mais cedo arrancar, mais histórico acumulas (os gráficos de evolução dependem disto).
2. **Bot de eventos** a seguir — rápido, alta motivação, e a infraestrutura já existe.
3. **Outreach** por último deste lote — é o maior trabalho, mas é o que mais te aproxima do 1.º cliente Scalit.

> Dica: dá um prompt de cada vez. Se o Claude Code tentar fazer os três ao mesmo tempo, trava-o e pede para focar só no Prompt 1.
