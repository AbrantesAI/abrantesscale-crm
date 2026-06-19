'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Copy, Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  contactId: string
  initialScore: number | null
  initialSummary: string | null
}

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 8 ? 'bg-emerald-500' :
    score >= 5 ? 'bg-amber-500' :
    'bg-red-500'
  return (
    <span className={cn('inline-block w-2.5 h-2.5 rounded-full mr-1.5', color)} />
  )
}

export function AiPanel({ contactId, initialScore, initialSummary }: Props) {
  const [score, setScore] = useState(initialScore)
  const [scoreReason, setScoreReason] = useState('')
  const [summary, setSummary] = useState(initialSummary ?? '')
  const [message, setMessage] = useState('')
  const [channel, setChannel] = useState('dm')
  const [goal, setGoal] = useState('followup')
  const [loading, setLoading] = useState<'score' | 'summary' | 'message' | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function fetchScore() {
    setLoading('score')
    setError('')
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setScore(data.score)
      setScoreReason(data.reason)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(null)
    }
  }

  async function fetchSummary() {
    setLoading('summary')
    setError('')
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSummary(data.summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(null)
    }
  }

  async function fetchMessage() {
    setLoading('message')
    setError('')
    try {
      const res = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, channel, goal }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessage(data.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(null)
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lead Score</p>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1"
            onClick={fetchScore}
            disabled={loading === 'score'}
          >
            <RefreshCw className={cn('w-3 h-3', loading === 'score' && 'animate-spin')} />
            {score !== null ? 'Recalcular' : 'Calcular'}
          </Button>
        </div>
        {score !== null ? (
          <div>
            <div className="flex items-center gap-2">
              <ScoreDot score={score} />
              <span className="text-2xl font-bold">{score}</span>
              <span className="text-muted-foreground text-sm">/10</span>
            </div>
            {scoreReason && <p className="text-xs text-muted-foreground mt-1">{scoreReason}</p>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Clica em "Calcular" para obter um score deste lead.</p>
        )}
      </div>

      {/* Resumo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resumo executivo</p>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1"
            onClick={fetchSummary}
            disabled={loading === 'summary'}
          >
            <RefreshCw className={cn('w-3 h-3', loading === 'summary' && 'animate-spin')} />
            {summary ? 'Atualizar' : 'Gerar'}
          </Button>
        </div>
        {summary ? (
          <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Gera um resumo do perfil e potencial deste lead.</p>
        )}
      </div>

      {/* Gerador de mensagens */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gerar mensagem</p>
        <div className="flex gap-2">
          <Select value={channel} onValueChange={(v) => setChannel(v ?? 'dm')}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dm">DM Instagram</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={goal} onValueChange={(v) => setGoal(v ?? 'followup')}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="followup">Follow-up</SelectItem>
              <SelectItem value="call">Agendar call</SelectItem>
              <SelectItem value="proposal">Apresentar proposta</SelectItem>
              <SelectItem value="connect">Criar ligação</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="w-full h-7 text-xs gap-1.5"
          onClick={fetchMessage}
          disabled={loading === 'message'}
        >
          <Sparkles className={cn('w-3 h-3', loading === 'message' && 'animate-pulse')} />
          {loading === 'message' ? 'A gerar...' : 'Gerar mensagem'}
        </Button>
        {message && (
          <div className="space-y-1.5">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="text-sm resize-none"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs gap-1.5"
              onClick={copyMessage}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar mensagem'}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
