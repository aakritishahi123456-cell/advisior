'use client'

import { memo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type BalancePoint = { year: string; assets: number; liabilities: number }

function CompanyBalanceSheetChart({ data }: { data: BalancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="assets" stroke="#635BFF" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="liabilities" stroke="#0A2540" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default memo(CompanyBalanceSheetChart)

