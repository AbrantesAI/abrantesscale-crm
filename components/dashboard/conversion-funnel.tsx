'use client'

import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FunnelStage = {
  id: string
  name: string
  count: number
  value: number
  winProb: number
  isWon: boolean
  isLost: boolean
}

type Props = {
  sales: FunnelStage[]
  community: FunnelStage[]
}

const SHADES = ['#7CB2F2', '#5BA0E6', '#3E8DDD', '#2A7AD0', '#1E66BC', '#1655A3', '#114788']
const eur = (n: number) => n.toLocaleString('pt-PT') + ' €'

export function ConversionFunnel({ sales, community }: Props) {
  const hasCommunity = community.some((s) => s.count > 0)
  const [track, setTrack] = useState<'sales' | 'community'>('sales')

  const stages = (track === 'sales' ? sales : community).filter((s) => !s.isLost)
  const counts = stages.map((s) => s.count)
  const maxCount = Math.max(1, ...counts)
  const firstCount = counts[0] ?? 0
  const wonStage = stages.find((s) => s.isWon)
  const overallConv = firstCount > 0 && wonStage ? Math.round((wonStage.count / firstCount) * 100) : 0

  return (
    <div className="space-y-3">
      {hasCommunity && (
        <div className="flex gap-1 p-0.5 bg-muted rounded-lg w-fit text-xs">
          <button
            onClick={() => setTrack('sales')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              track === 'sales' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            )}
          >
            Scalit / PME
          </button>
          <button
            onClick={() => setTrack('community')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              track === 'community' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            )}
          >
            Comunidade
          </button>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {stages.map((s, i) => {
          const pct = Math.max(22, Math.round((s.count / maxCount) * 100))
          const prev = i > 0 ? counts[i - 1] : null
          const dropoff = prev && prev > 0 ? Math.round((s.count / prev) * 100) : null
          const fill = s.isWon ? '#34a37e' : SHADES[Math.min(i, SHADES.length - 1)]

          return (
            <div key={s.id}>
              {dropoff !== null && (
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground py-0.5">
                  <ArrowDown className="w-2.5 h-2.5" />
                  {dropoff}%
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-20 sm:w-28 shrink-0 text-right text-[11px] sm:text-xs font-medium truncate">
                  {s.name}
                </div>
                <div className="flex-1 flex justify-center min-w-0">
                  <div
                    className="h-7 sm:h-8 rounded-md flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${pct}%`, minWidth: 38, backgroundColor: fill }}
                  >
                    {s.count}
                  </div>
                </div>
                <div className="w-16 sm:w-20 shrink-0 text-left text-[10px] sm:text-[11px] text-muted-foreground">
                  {s.value > 0 ? eur(s.value) : '—'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {firstCount > 0 && (
        <div className="flex items-center justify-between pt-1 border-t text-xs">
          <span className="text-muted-foreground">Conversão Lead → Ganho</span>
          <span className="font-bold text-primary">{overallConv}%</span>
        </div>
      )}
    </div>
  )
}
