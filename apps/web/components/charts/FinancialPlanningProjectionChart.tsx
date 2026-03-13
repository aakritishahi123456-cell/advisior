'use client'

import { memo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type ProjectionPoint = { year: string; value: number }

function FinancialPlanningProjectionChart({ data }: { data: ProjectionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="year" stroke="#94A3B8" fontSize={12} />
        <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `NPR ${(Number(v) / 1_000_000).toFixed(1)}M`} />
        <Tooltip
          formatter={(v: number) => `NPR ${Number(v).toLocaleString()}`}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px' }}
        />
        <Line type="monotone" dataKey="value" stroke="#635BFF" strokeWidth={3} dot={{ fill: '#635BFF' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default memo(FinancialPlanningProjectionChart)

