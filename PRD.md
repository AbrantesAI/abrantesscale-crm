# PRD — CRM "AI Brand" (nome provisório)

> Documento de Requisitos de Produto · v1
> Autor: Bernardo Abrantes · Data: 2026-06-16
> Objetivo deste documento: servir de base para o desenvolvimento no Claude Code.

---

## 1. Visão

Um CRM pessoal feito à medida do meu negócio: atrair, qualificar e converter pessoas
que me descobrem no Instagram em clientes de serviços de **AI, automações e CRMs**.

A aplicação tem de refletir o **meu funil real** (Reels → Stories → DMs → Discovery Call
→ Implementação) em vez de um funil genérico de vendas. Começa como ferramenta pessoal
(single-user), mas a arquitetura fica preparada para, no futuro, servir também os meus
clientes (multi-tenant) e integrar o Instagram de forma mais profunda.

### Princípios de produto
1. **Simplicidade primeiro.** A v1 tem de ser usável em minutos, não um ERP.
2. **O funil é o centro.** Tudo gira à volta de mover pessoas pelas etapas.
3. **AI como acelerador, não muleta.** Automações entram numa fase 2, mas o modelo de
   dados é desenhado desde já para as suportar.
4. **Preparado para escalar.** Decisões técnicas não fecham a porta ao multi-tenant nem
   à integração com Instagram.

---

## 2. Utilizadores

| Perfil | Fase | Necessidades |
|---|---|---|
| **Eu (admin/owner)** | v1 | Gerir contactos, mover leads no pipeline, registar interações e notas, agendar follow-ups. |
| Equipa | futuro | Vários logins, permissões. |
| Clientes (tenants) | futuro | Cada cliente com o seu CRM isolado. |

Na v1 há **um único utilizador autenticado**. Mesmo assim, todas as tabelas têm um
`owner_id` desde o início para que a migração para multi-tenant não exija reescrever dados.

---

## 3. O meu funil (mapeamento Instagram → CRM)

O funil de marketing vive no Instagram; o CRM começa a registar a pessoa a partir do
momento em que há **interação 1:1 com potencial comercial** (tipicamente uma DM). As
fases de topo de funil (Reels/Stories) são contexto e tags, não etapas do pipeline.

```
INSTAGRAM (marketing)                CRM (vendas)
─────────────────────                ─────────────────────────────
[Top]    Reels  ───► atração
[Middle] Stories ──► relação/interação
[Bottom] DMs ──────────────────────► 1. Lead (entrada no CRM)
                                      2. Qualificado (há fit)
                                      3. Discovery Call agendada
                                      4. Discovery Call realizada
                                      5. Proposta/Estrutura enviada
                                      6. Negociação
                                      7. Ganho  (cliente / implementação)
                                         Perdido (saída)
```

### Etapas do pipeline (v1)
1. **Lead** — pessoa entrou no radar (DM, comentário relevante, formulário). Ainda não qualificada.
2. **Qualificado** — percebi que há fit (o que constroem/empreendem faz sentido para AI).
3. **Discovery Call agendada** — call marcada.
4. **Discovery Call realizada** — call feita, recolhida a informação do negócio deles.
5. **Proposta/Estrutura enviada** — entreguei a estrutura/plano de implementação de AI.
6. **Negociação** — ajustes, preço, condições.
7. **Ganho** — fechado; passa a cliente / início de implementação.
- **Perdido** — não avançou (com motivo registado).

Cada lead guarda o **canal de origem** (Reels, Stories, DM, comentário, referência,
link na bio, outro) para eu perceber o que converte melhor.

---

## 4. Funcionalidades — v1 (MVP)

### 4.1 Autenticação
- Login com email/password (Supabase Auth). Single-user, mas pronto para multi-utilizador.

### 4.2 Contactos / Leads
- Criar, editar, arquivar contactos.
- Ficha do contacto: nome, @ do Instagram, email, telefone, empresa/projeto, website,
  canal de origem, tags, notas, etapa atual do pipeline, valor potencial do negócio.
- Lista de contactos com pesquisa, filtros (etapa, tag, origem) e ordenação.

### 4.3 Pipeline (Kanban)
- Vista de quadro com colunas = etapas do funil.
- Arrastar cartões entre etapas (drag & drop).
- Cada cartão mostra: nome, @, valor, dias na etapa, próximo follow-up.
- Mover de etapa regista automaticamente um evento no histórico.

### 4.4 Interações & Atividades
- Registar interações com um contacto: nota, DM, call, email, follow-up.
- Timeline cronológica por contacto.
- Marcar uma atividade como tarefa com data (ex.: "fazer follow-up dia X").

### 4.5 Tarefas & Follow-ups
- Lista das minhas tarefas pendentes (hoje, atrasadas, próximas).
- Cada tarefa ligada (opcional) a um contacto.

### 4.6 Dashboard
- Métricas-chave: nº de leads por etapa, valor total do pipeline, taxa de conversão,
  leads por canal de origem, follow-ups em atraso.

### 4.7 Discovery Calls
- Registar a estrutura recolhida na call (o que o negócio faz, dores, onde a AI encaixa).
- Campo livre + campos guiados, para depois alimentar a proposta.

---

## 5. Funcionalidades — Fases futuras

### Fase 2 — Camada de AI (modelo de dados já preparado na v1)
- **Qualificação de leads:** AI atribui score/prioridade com base no perfil e interações.
- **Resumos & insights:** resumo automático de conversas e do estado do pipeline; próximos passos sugeridos.
- **Lembretes inteligentes:** AI sugere quando e a quem fazer follow-up.
- **Geração de mensagens:** rascunhos de DMs, emails e follow-ups personalizados por lead.

### Fase 3 — Instagram
- Captação de leads via **link na bio → formulário** que cria o lead automaticamente (mais simples, sem risco).
- Mais tarde: Instagram Graph API (conta Business/Creator) para puxar DMs/comentários — sujeito às limitações da Meta.
- Código preparado desde a v1 com um campo `source` e um modelo de "lead capture" extensível.

### Fase 4 — Multi-tenant (produto vendável / SaaS)
- Isolamento de dados por organização (RLS por `tenant_id`).
- Onboarding de clientes, planos, billing.

---

## 6. User stories (v1)

- Como **owner**, quero adicionar rapidamente um lead que me mandou DM, para não o perder.
- Como **owner**, quero arrastar um lead de "Qualificado" para "Discovery Call agendada", para refletir o estado real.
- Como **owner**, quero ver todos os follow-ups atrasados num só sítio, para não falhar nenhum.
- Como **owner**, quero filtrar leads por canal de origem (Reels vs Stories vs DM), para saber o que converte.
- Como **owner**, quero registar a estrutura da discovery call, para construir a proposta depois.
- Como **owner**, quero ver o valor total do meu pipeline, para prever faturação.

---

## 7. Métricas de sucesso

- **Adoção pessoal:** uso diário; nenhum lead perdido por falta de follow-up.
- **Conversão:** taxa Lead → Ganho; tempo médio em cada etapa.
- **Origem:** % de clientes por canal (validar se Reels/Stories estão a converter).
- **Pipeline:** valor total e valor ponderado (por probabilidade da etapa).

---

## 8. Fora de âmbito (v1)

- Multi-tenant ativo, billing, equipas.
- Integração automática com a API do Instagram (só preparação no código).
- Automações de AI em produção (só preparação no modelo de dados).
- App móvel nativa (a web responsiva chega para já).

---

## 9. Requisitos não-funcionais

- **Responsivo** (uso frequente no telemóvel).
- **Rápido** — listas e Kanban fluidos.
- **Privado e seguro** — Row Level Security no Supabase; dados só do owner.
- **Manutenível** — código limpo, tipado (TypeScript), pronto para crescer.
