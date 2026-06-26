'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, CheckCircle2, ShieldAlert, Lightbulb, Briefcase, Euro, Search, Heart, Target, Star } from 'lucide-react'
import { saveIcp } from '@/app/(app)/icp/actions'
import { cn } from '@/lib/utils'
import type { IcpDefinition } from '@/lib/types/database.types'

type IcpData = Pick<IcpDefinition, 'sector' | 'main_pain' | 'ticket' | 'qual_signals' | 'red_flags' | 'approach'>

const SALES_FIELDS: { key: keyof IcpData; label: string; placeholder: string; icon: React.ReactNode; span?: boolean }[] = [
  { key: 'sector',       label: 'Setor ideal',              placeholder: 'Ex: Restauração, Clínicas, E-commerce PME...', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'main_pain',    label: 'Dor principal',            placeholder: 'Ex: Não têm tempo para marketing, precisam de mais clientes...', icon: <Search className="w-4 h-4" /> },
  { key: 'ticket',       label: 'Ticket médio esperado',    placeholder: 'Ex: 500 €/mês setup + 300 €/mês retainer...', icon: <Euro className="w-4 h-4" /> },
  { key: 'qual_signals', label: 'Sinais de qualificação',   placeholder: 'Ex: Já investe em marketing, tem > 5 funcionários, factura > 200k...', icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: 'red_flags',    label: 'Red flags',                placeholder: 'Ex: Quer resultados em 1 semana, não tem orçamento, trabalha sozinho...', icon: <ShieldAlert className="w-4 h-4" /> },
  { key: 'approach',     label: 'Gancho de abordagem',      placeholder: 'Ex: "Ajudo restaurantes a atrair 20% mais clientes com IA em 30 dias"', icon: <Lightbulb className="w-4 h-4" />, span: true },
]

const COMMUNITY_FIELDS: { key: keyof IcpData; label: string; placeholder: string; icon: React.ReactNode; span?: boolean }[] = [
  { key: 'sector',       label: 'A Pessoa',                      placeholder: 'Quem é o teu ICP? Descreve a "Pessoa B"...', icon: <Target className="w-4 h-4" /> },
  { key: 'main_pain',    label: 'A Dor',                         placeholder: 'A dor interna / auto-traição...', icon: <Heart className="w-4 h-4" /> },
  { key: 'ticket',       label: 'O Desejo',                      placeholder: 'O que ela quer a longo prazo vs. o que a move agora...', icon: <Star className="w-4 h-4" /> },
  { key: 'qual_signals', label: 'Nível & Sinais de Qualificação', placeholder: 'Nível 1 — já tentou, bateu na parede...', icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: 'red_flags',    label: 'Anti-ICP (quem NÃO queremos)',  placeholder: 'Sonhador passivo, quer solução mágica...', icon: <ShieldAlert className="w-4 h-4" /> },
  { key: 'approach',     label: 'O Porquê Tu (autoridade)',      placeholder: 'As tuas provas reais, o teu diferencial...', icon: <Lightbulb className="w-4 h-4" />, span: true },
]

const COMMUNITY_DEFAULTS: IcpData = {
  sector: `Action taker queimado — já tentou muita coisa (cursos, side-hustles, várias tentativas), bateu na parede vezes sem conta e recuou para um conforto resignado. O "conforto" não é preguiça — é o refúgio de quem já levou pancada. Parada porque já tentou e falhou, não por nunca ter tentado.

Tem emprego/situação estável. Sabe que é inteligente e capaz, sente que poderia fazer muito mais — mas por uma crença limitante não dá o próximo passo. Por dentro está desesperada: sente que tem de mudar de vida e não sabe como.

Não está zangada com o mundo. Está zangada consigo própria.

Característica central: comparação constante. "Porque é que ele conseguiu e eu ainda não?"`,

  main_pain: `A dor não é circunstancial, é interna. É a auto-traição: "eu sei que era capaz, e mesmo assim não avanço."

Estrutura das crenças (hipótese):
• "Não tenho tempo com o trabalho que já tenho." → Máscara pública: desculpa socialmente aceitável, dita aos outros e a si própria.
• "Eles conseguiram porque tiveram sorte, eu não." → Armadura do ego: protege-a de admitir que a diferença foi ação, não sorte.
• "E se eu falhar à frente de toda a gente?" → A raiz: o medo real do julgamento. As outras duas existem para ela nunca chegar aqui.

⚠️ Estado: hipótese de trabalho. Dor ainda não validada com linguagem real do ICP. Comentários atuais = validação de pares ("facts", "lezzz go") — sem linguagem de dor. A validar com lote de 10 guiões focados em dor.`,

  ticket: `DESEJO DE TOPO (destino):
Acordar sem peso nos ombros. Paz. Tranquilidade de não ter de pensar em dinheiro. Sentir que provou a si própria que era capaz. Estar rodeada de pessoas incríveis. Não ter medo de se expressar.
Símbolos: independência de localização (Bali, Marbella, Tailândia), trabalhar do computador em algo com prazer, 10k–30k/mês.

DESEJO IMEDIATO (o que move o download da oferta grátis ZTL):
Dar o primeiro passo sem se humilhar. A primeira prova de que é possível para ela.

⚠️ Não apontar o canhão todo para "Bali 30k" — soa a fantasia distante. Apontar para "o teu primeiro passo, sem medo."
Vender o estado, não o número: "Acordar sem o peso de domingo à noite" bate na dor e no sonho ao mesmo tempo.`,

  qual_signals: `Nível 1 — Já tentou e bateu na parede.
Comprou cursos, tentou várias coisas, talvez ganhou uns trocos — desistiu ou estagnou. Já se queimou, está cética mas ainda com esperança. É action taker por natureza, temporariamente travada por desilusão acumulada + medo de falhar outra vez.

A crença-raiz ("e se falhar à frente de todos?") é mais forte aqui: o terror não é falhar pela 1ª vez, é falhar outra vez, publicamente, e confirmar que "afinal não era para ela".

Canal de alcance: Reels no Instagram.
Consome: Alex Hormozi, Iman Gadzhi, Diggie Oliveira, conteúdo "começou do nada", RAW vence.
Padrões: RAW vence, narrativa "começou do nada" é o íman, saturação de course sellers "bullshit" → oportunidade de diferenciação.`,

  red_flags: `Anti-ICP — quem NÃO queremos (filtro de qualificação):
• O sonhador passivo (Nível 0): tem ambições mas não está disposto aos sacrifícios. Sonha, guarda Reels, nunca age.
• Quem procura solução mágica sem esforço.

Filtro: o questionário de qualificação na bio (@abrantesscale) é a porta. Desenhar as perguntas para separar action takers de sonhadores passivos.`,

  approach: `O Bernardo já foi a Pessoa B. Não vende teoria — vende o seu próprio mapa de fuga. Autoridade impossível de copiar.

PROVAS REAIS:
• 14 Reels publicados sem rever (venceu o medo de exposição — jun 2026)
• Leads reais a entrar pelo questionário da bio
• FashionClearance construído do zero, a faturar todos os meses
• Responsável de marketing a lançar campanhas Meta com orçamento real
• Atleta de Muay Thai — sabe levar pancada e voltar

DIFERENCIAL:
A Pessoa B não confia no guru de Dubai que nunca teve uma dúvida. Confia em quem está na lama com ela. O diferencial não é a ausência de medo — é ter o mesmo medo dela e agir na mesma. Ela não o escolhe apesar da dúvida. Escolhe-o pela forma como a enfrenta. (= Protocolo Sem Espelho)`,
}

const SALES_EMPTY: IcpData = { sector: '', main_pain: '', ticket: '', qual_signals: '', red_flags: '', approach: '' }

function IcpForm({
  track,
  fields,
  icp,
  defaultValues,
}: {
  track: string
  fields: typeof SALES_FIELDS
  icp: IcpData | null
  defaultValues?: IcpData
}) {
  const initial = icp ?? defaultValues ?? SALES_EMPTY
  const [editing, setEditing] = useState(!icp)
  const [form, setForm] = useState<IcpData>(initial)
  const [saved, setSaved] = useState(false)
  const [saving, startSave] = useTransition()

  function handleSave() {
    startSave(async () => {
      await saveIcp(track, {
        sector:       form.sector       ?? '',
        main_pain:    form.main_pain    ?? '',
        ticket:       form.ticket       ?? '',
        qual_signals: form.qual_signals ?? '',
        red_flags:    form.red_flags    ?? '',
        approach:     form.approach     ?? '',
      })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            {icp && (
              <Button size="sm" variant="ghost" onClick={() => { setForm(initial); setEditing(false) }}>
                Cancelar
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? 'A guardar...' : saved ? '✓ Guardado' : 'Guardar'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {fields.map(({ key, label, placeholder, icon }) => (
          <div key={key} className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              {icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            {editing ? (
              <textarea
                value={form[key] ?? ''}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={4}
                className="w-full text-sm bg-muted border border-border rounded-md px-3 py-2 resize-y outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            ) : (
              <p className={cn('text-sm whitespace-pre-wrap leading-relaxed', !form[key] && 'text-muted-foreground/50 italic')}>
                {form[key] || placeholder}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function IcpClient({
  salesIcp,
  communityIcp,
}: {
  salesIcp: IcpData | null
  communityIcp: IcpData | null
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── Espaço 1: Marca Pessoal / ZTL ── */}
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <h2 className="text-base font-semibold">Marca Pessoal</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-4">
            Zero to Leverage · Full Leverage Circle · Mentoria 1:1
          </p>
          <p className="text-xs text-amber-500 font-medium mt-0.5 ml-4">
            Estado: hipótese de trabalho — a validar com dados reais dos Reels
          </p>
        </div>
        <IcpForm
          track="community"
          fields={COMMUNITY_FIELDS}
          icp={communityIcp}
          defaultValues={COMMUNITY_DEFAULTS}
        />
      </div>

      {/* ── Espaço 2: Agência Scalit ── */}
      <div className="space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-base font-semibold">Agência Scalit</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-4">
            PMEs · AI & Automação · Pipeline B2B
          </p>
        </div>
        <IcpForm
          track="sales"
          fields={SALES_FIELDS}
          icp={salesIcp}
        />
      </div>
    </div>
  )
}
