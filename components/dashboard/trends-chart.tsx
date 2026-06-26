'use client'

import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import type { DailySnapshot } from '@/lib/types/database.types'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'

type Metric = 'pipeline_value' | 'mrr' | 'flc_members'

const METRIC_LABELS: Record<Metric, string> = {
  pipeline_value: 'Pipeline',
  mrr: 'MRR',
  flc_members: 'FLC',
}

const METRIC_COLORS: Record<Metric, string> = {
  pipeline_value: '#10b981',
  mrr: '#6366f1',
  flc_members: '#a855f7',
}

type SnapshotSlice = Pick<
  DailySnapshot,
  'snapshot_date' | 'pipeline_value' | 'mrr' | 'flc_members'
>

export function TrendsChart({ snapshots }: { snapshots: SnapshotSlice[] }) {
  const [metric, setMetric] = useState<Metric>('pipeline_value')

  if (snapshots.length < 2) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Tendências</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-6 text-center">
            Os gráficos de evolução aparecem a partir de amanhã, à medida que os snapshots se acumulam.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isEuro = metric !== 'flc_members'
  const color = METRIC_COLORS[metric]

  const data = snapshots.map((s) => ({
    date: format(parseISO(s.snapshot_date), 'd MMM', { locale: pt }),
    value: s[metric],
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Tendências (30 dias)</CardTitle>
          </div>
          <div className="flex gap-1">
            {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  metric === m
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#888' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#888' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                isEuro ? `${v.toLocaleString('pt-PT')}€` : String(v)
              }
              width={isEuro ? 56 : 24}
            />
            <Tooltip
              formatter={(v: number | string | ReadonlyArray<number | string> | undefined) => {
                const raw = Array.isArray(v) ? v[0] : v
                const num = raw != null ? Number(raw) : 0
                return [
                  isEuro ? `${num.toLocaleString('pt-PT')} €` : String(num),
                  METRIC_LABELS[metric],
                ] as [string, string]
              }}
              contentStyle={{
                backgroundColor: '#1e1e2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#aaa', marginBottom: 2 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill="url(#trendGrad)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
