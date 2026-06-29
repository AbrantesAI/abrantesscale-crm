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
      supabase.from('activities').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(15),
      supabase.from('discovery_notes').select('*').eq('contact_id', contactId).eq('owner_id', user.id).maybeSingle(),
    ])

    if (!contact) return NextResponse.json({ error: 'Contacto não encontrado' }, { status: 404 })

    const context = buildContactContext(contact, activities ?? [], discoveryNote ?? null)
    const anthropic = getAnthropicClient()

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Cria um resumo executivo deste lead em 3-4 frases. Inclui: quem é, qual o potencial, onde está no funil e qual o próximo passo recomendado.

Dados do contacto:
${context}

Responde apenas com o resumo, sem formatação extra.` },
      ],
    })

    const summary = extractText(response)

    await supabase
      .from('contacts')
      .update({ ai_summary: summary, updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('owner_id', user.id)

    return NextResponse.json({ summary })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ai/summary]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
