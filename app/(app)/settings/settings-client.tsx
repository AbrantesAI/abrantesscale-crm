'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { saveTelegramChatId, sendTestNotification } from './actions'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle, Send } from 'lucide-react'

export function SettingsClient({ telegramChatId }: { telegramChatId: string }) {
  const [chatId, setChatId] = useState(telegramChatId)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, startSave] = useTransition()
  const [testing, startTest] = useTransition()

  function handleSave() {
    setSaveMsg(null)
    startSave(async () => {
      const result = await saveTelegramChatId(chatId)
      if ('error' in result) setSaveMsg({ ok: false, text: result.error as string })
      else setSaveMsg({ ok: true, text: 'Guardado com sucesso.' })
    })
  }

  function handleTest() {
    setTestMsg(null)
    startTest(async () => {
      const result = await sendTestNotification()
      if ('error' in result) setTestMsg({ ok: false, text: result.error as string })
      else setTestMsg({ ok: true, text: 'Mensagem enviada! Verifica o Telegram.' })
    })
  }

  return (
    <div className="space-y-6">
      {/* Telegram */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-base">Notificações Telegram</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recebe um resumo das tarefas do dia todos os dias às 8h.
          </p>
        </div>

        {/* Instruções */}
        <ol className="space-y-2 text-sm text-muted-foreground list-none">
          <li className="flex gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-semibold">1</span>
            <span>No Telegram, pesquisa <strong className="text-foreground">@BotFather</strong> e envia <code className="bg-muted px-1 rounded text-xs">/newbot</code> para criar um bot. Guarda o token que te dá e adiciona-o ao <code className="bg-muted px-1 rounded text-xs">.env.local</code> como <code className="bg-muted px-1 rounded text-xs">TELEGRAM_BOT_TOKEN</code>.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-semibold">2</span>
            <span>Pesquisa <strong className="text-foreground">@userinfobot</strong> no Telegram e envia qualquer mensagem. Ele responde com o teu <strong className="text-foreground">Id</strong> — é esse número que colocas aqui em baixo.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-semibold">3</span>
            <span>Abre o teu bot no Telegram e envia <code className="bg-muted px-1 rounded text-xs">/start</code> para o ativar.</span>
          </li>
        </ol>

        {/* Input + guardar */}
        <div className="space-y-2">
          <label className="text-sm font-medium">O teu Chat ID</label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="font-mono"
            />
            <Button onClick={handleSave} disabled={saving} className="shrink-0">
              {saving ? 'A guardar...' : 'Guardar'}
            </Button>
          </div>
          {saveMsg && (
            <p className={cn('text-xs flex items-center gap-1', saveMsg.ok ? 'text-emerald-500' : 'text-destructive')}>
              {saveMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {saveMsg.text}
            </p>
          )}
        </div>

        {/* Teste */}
        <div className="space-y-2 pt-1 border-t border-border">
          <p className="text-sm text-muted-foreground">Depois de guardar, envia uma mensagem de teste para confirmar que está tudo bem.</p>
          <Button variant="outline" onClick={handleTest} disabled={testing || !chatId} className="gap-2">
            <Send className="w-4 h-4" />
            {testing ? 'A enviar...' : 'Enviar notificação de teste'}
          </Button>
          {testMsg && (
            <p className={cn('text-xs flex items-center gap-1', testMsg.ok ? 'text-emerald-500' : 'text-destructive')}>
              {testMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {testMsg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
