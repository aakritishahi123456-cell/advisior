'use client'

import { memo } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type LoanComparisonChartPoint = {
  rate: string
  emi: number
  totalInterest: number
}

function LoanComparisonChart({
  data,
  formatCurrency,
}: {
  data: LoanComparisonChartPoint[]
  formatCurrency: (value: number) => string
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="rate" />
        <YAxis />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Bar dataKey="emi" fill="#3b82f6" name="Monthly EMI" />
        <Bar dataKey="totalInterest" fill="#f59e0b" name="Total Interest" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default memo(LoanComparisonChart)

