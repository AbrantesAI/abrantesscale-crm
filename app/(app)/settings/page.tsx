import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const telegramChatId = (user.user_metadata?.telegram_chat_id as string | undefined) ?? ''

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Definições</h1>
      <SettingsClient telegramChatId={telegramChatId} />
    </div>
  )
}
