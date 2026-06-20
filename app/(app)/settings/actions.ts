'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function saveTelegramChatId(chatId: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: { telegram_chat_id: chatId.trim() || null },
  })
  if (error) return { error: 'Erro ao guardar. Tenta novamente.' }
  return { success: true }
}

export async function sendTestNotification() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const chatId = user.user_metadata?.telegram_chat_id as string | undefined
  if (!chatId) return { error: 'Guarda o Chat ID primeiro.' }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return { error: 'TELEGRAM_BOT_TOKEN não está configurado no servidor.' }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '✅ *AbrantesScale CRM* — Notificações Telegram configuradas com sucesso!',
      parse_mode: 'Markdown',
    }),
  })

  if (!res.ok) return { error: 'Erro ao enviar. Verifica se o Chat ID está correto e se enviaste /start ao bot.' }
  return { success: true }
}
