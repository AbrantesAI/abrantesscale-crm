import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, CLAUDE_MODEL, extractText } from '@/lib/ai/client'
import { buildContactContext, SYSTEM_PROMPT } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { contactId } = await req.json()

    const [{ data: contact }, { data: activities }, { data: discoveryNote }] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).eq('owner_id', user.id).single(),
      supabase.from('activities').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(10),
      supabase.from('discovery_notes').select('*').eq('contact_id', contactId).eq('owner_id', user.id).maybeSingle(),
    ])

    if (!contact) return NextResponse.json({ error: 'Contacto não encontrado' }, { status: 404 })

    const context = buildContactContext(contact, activities ?? [], discoveryNote ?? null)
    const anthropic = getAnthropicClient()

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Analisa este lead e dá uma pontuação de 1 a 10 (10 = lead perfeito, muito provável de converter).

Dados do contacto:
${context}

Responde APENAS com JSON neste formato exato, sem mais nada:
{"score": <número 1-10>, "reason": "<1-2 frases a explicar a pontuação>"}` },
      ],
    })

    const text = extractText(response)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text)

    await supabase
      .from('contacts')
      .update({ ai_score: parsed.score, updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('owner_id', user.id)

    return NextResponse.json({ score: parsed.score, reason: parsed.reason })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ai/score]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
