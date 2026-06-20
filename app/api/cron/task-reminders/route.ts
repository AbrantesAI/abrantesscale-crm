import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN não configurado' }, { status: 500 })
  }

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('title, owner_id, contacts(full_name)')
    .eq('due_date', today)
    .eq('is_done', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Agrupar tarefas por owner
  const byOwner = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const list = byOwner.get(task.owner_id) ?? []
    list.push(task)
    byOwner.set(task.owner_id, list)
  }

  let sent = 0

  for (const [ownerId, ownerTasks] of byOwner) {
    const { data: { user } } = await supabase.auth.admin.getUserById(ownerId)
    const chatId = user?.user_metadata?.telegram_chat_id
    if (!chatId) continue

    const lines = ownerTasks.map((t) => {
      const contact = t.contacts ? ` → ${(t.contacts as { full_name: string }).full_name}` : ''
      return `• ${t.title}${contact}`
    }).join('\n')

    const text = `📋 *AbrantesScale — Tarefas para hoje*\n\n${lines}\n\nAbre o CRM para mais detalhes.`

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    })

    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
