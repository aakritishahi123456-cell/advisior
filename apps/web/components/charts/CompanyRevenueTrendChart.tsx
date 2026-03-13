'use client'

import { memo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type RevenuePoint = { year: string; value: number }

function CompanyRevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#635BFF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#635BFF" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#635BFF" fill="url(#rev)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default memo(CompanyRevenueTrendChart)

