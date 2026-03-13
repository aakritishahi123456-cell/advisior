'use client'

import { memo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type LoanScheduleChartPoint = {
  month: string
  principal: number
  interest: number
  balance: number
}

function LoanScheduleChart({
  data,
  formatCurrency,
}: {
  data: LoanScheduleChartPoint[]
  formatCurrency: (value: number) => string
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Line type="monotone" dataKey="principal" stroke="#10b981" strokeWidth={2} />
        <Line type="monotone" dataKey="interest" stroke="#f59e0b" strokeWidth={2} />
        <Line type="monotone" dataKey="balance" stroke="#ef4444" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default memo(LoanScheduleChart)

