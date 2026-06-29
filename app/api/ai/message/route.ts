import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, CLAUDE_MODEL, extractText } from '@/lib/ai/client'
import { buildContactContext, SYSTEM_PROMPT } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { contactId, channel, goal } = await req.json()

    const [{ data: contact }, { data: activities }, { data: discoveryNote }] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).eq('owner_id', user.id).single(),
      supabase.from('activities').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(10),
      supabase.from('discovery_notes').select('*').eq('contact_id', contactId).eq('owner_id', user.id).maybeSingle(),
    ])

    if (!contact) return NextResponse.json({ error: 'Contacto não encontrado' }, { status: 404 })

    const context = buildContactContext(contact, activities ?? [], discoveryNote ?? null)
    const anthropic = getAnthropicClient()

    const channelLabel = channel === 'dm' ? 'DM no Instagram' : 'email'
    const isOutreach = goal === 'outreach'
    const goalLabel =
      goal === 'followup' ? 'fazer follow-up'
      : goal === 'call' ? 'agendar uma discovery call'
      : goal === 'proposal' ? 'apresentar proposta'
      : isOutreach ? 'iniciar uma primeira conversa a frio (cold DM), sem ainda vender nada'
      : 'criar ligação'

    // Ângulo de abertura aleatório → garante que cada mensagem é diferente
    // (evita padrões repetidos que o Instagram marca como spam)
    const angles = [
      'um elogio genuíno e específico ao trabalho/negócio da pessoa',
      'uma pergunta curiosa e leve sobre o que a pessoa faz',
      'uma observação sobre algo concreto do perfil/negócio dela',
      'partilhar uma ideia rápida que viste que poderia ajudar o negócio',
      'mencionar que o conteúdo/negócio dela te chamou à atenção e porquê',
      'uma abordagem casual, como se estivesses a falar com um conhecido',
    ]
    const angle = angles[Math.floor(Math.random() * angles.length)]

    const outreachRules = `A mensagem deve:
- Soar 100% humana e escrita à mão — nunca um template
- Abrir com ${angle}
- Ser curta: 2 a 4 linhas no máximo (é uma DM, não um email)
- Ser informal e em Português (Portugal), tratar por "tu"
- Não usar emojis a mais (no máximo um, ou nenhum)
- Não vender diretamente nem soar a comercial — o objetivo é só iniciar conversa
- Terminar com uma pergunta leve e aberta que convide a responder
- Variar a estrutura e as palavras (não começar sempre da mesma forma)`

    const standardRules = `A mensagem deve:
- Ser natural e humana (não soar a template)
- Referenciar algo específico do perfil da pessoa
- Ter entre 3-5 linhas
- Estar em Português (Portugal)
- Não usar emojis em excesso`

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Escreve uma ${channelLabel} personalizada para ${goalLabel} com este lead.

${isOutreach ? outreachRules : standardRules}

Dados do contacto:
${context}

Responde apenas com o texto da mensagem, sem explicações nem aspas.` },
      ],
    })

    const message = extractText(response)

    return NextResponse.json({ message })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ai/message]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
