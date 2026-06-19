import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroqClient, GROQ_MODEL } from '@/lib/ai/client'
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
    const groq = getGroqClient()

    const channelLabel = channel === 'dm' ? 'DM no Instagram' : 'email'
    const goalLabel = goal === 'followup' ? 'fazer follow-up' : goal === 'call' ? 'agendar uma discovery call' : goal === 'proposal' ? 'apresentar proposta' : 'criar ligação'

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Escreve uma ${channelLabel} personalizada para ${goalLabel} com este lead.

A mensagem deve:
- Ser natural e humana (não soar a template)
- Referenciar algo específico do perfil da pessoa
- Ter entre 3-5 linhas
- Estar em Português (Portugal)
- Não usar emojis em excesso

Dados do contacto:
${context}

Responde apenas com o texto da mensagem, sem explicações.` },
      ],
    })

    const message = completion.choices[0].message.content?.trim() ?? ''

    return NextResponse.json({ message })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ai/message]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
