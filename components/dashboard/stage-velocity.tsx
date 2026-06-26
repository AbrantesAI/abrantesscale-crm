import { Clock } from 'lucide-react'

export type VelocityRow = {
  name: string
  avgDays: number
  count: number
}

/* Velocidade = tempo médio que um lead passa numa etapa antes de avançar.
   Dados de stage_transitions (days_in_prev). Barras mais longas = gargalos. */
export function StageVelocity({ data }: { data: VelocityRow[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Ainda sem histórico de movimentos. Move leads no pipeline para começar a medir.
      </p>
    )
  }

  const max = Math.max(...data.map((d) => d.avgDays), 1)

  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const pct = Math.round((d.avgDays / max) * 100)
        const slow = d.avgDays >= max * 0.66
        return (
          <div key={d.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate">{d.name}</span>
              <span className="flex items-center gap-1 shrink-0 tabular-nums">
                <Clock className="w-3 h-3 text-muted-foreground/60" />
                <span className={slow ? 'text-amber-400 font-medium' : 'text-foreground/80'}>
                  {d.avgDays} d
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: slow ? '#d8a23a' : '#3E8DDD' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
