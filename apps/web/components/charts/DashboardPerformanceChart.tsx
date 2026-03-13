'use client'

import { memo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type PerformancePoint = { month: string; value: number }

function DashboardPerformanceChart({ data }: { data: PerformancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
        <YAxis
          stroke="#94A3B8"
          fontSize={12}
          tickFormatter={(value) => `NPR ${Number(value) / 1000000}M`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
          }}
          formatter={(value: any) => [`NPR ${Number(value).toLocaleString()}`, 'Value']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#635BFF"
          strokeWidth={3}
          dot={{ fill: '#635BFF', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#635BFF' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default memo(DashboardPerformanceChart)
