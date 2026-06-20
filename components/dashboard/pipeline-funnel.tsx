'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Props = {
  data: { name: string; count: number; isWon: boolean }[]
}

const BLUE = '#4a90f5'

export function PipelineFunnel({ data }: Props) {
  if (data.length === 0) return (
    <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de pipeline.</p>
  )

  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{ height: Math.max(180, data.length * 38) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 8, right: 36, top: 4, bottom: 4 }}
          barSize={18}
        >
          <XAxis type="number" hide domain={[0, max]} />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: '#6b7a99' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(74, 144, 245, 0.06)' }}
            content={({ payload }) => {
              if (!payload?.[0]) return null
              const d = payload[0].payload as { name: string; count: number }
              return (
                <div style={{
                  background: '#111827',
                  border: '1px solid rgba(74,144,245,0.25)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}>
                  <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{d.name}</p>
                  <p style={{ color: BLUE }}>{d.count} lead{d.count !== 1 ? 's' : ''}</p>
                </div>
              )
            }}
          />
          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            label={{ position: 'right', fontSize: 11, fill: '#6b7a99' }}
          >
            {data.map((entry, i) => {
              if (entry.isWon) return <Cell key={entry.name} fill="#10b981" />
              const opacity = Math.max(0.3, 1 - (i / data.length) * 0.6)
              return <Cell key={entry.name} fill={BLUE} fillOpacity={opacity} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
