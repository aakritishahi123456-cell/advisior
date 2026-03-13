'use client'

import { memo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type AmortizationPoint = { year: number; principal: number; interest: number; balance: number }

function LoanAmortizationBarChart({ data }: { data: AmortizationPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="year" stroke="#94A3B8" fontSize={12} />
        <YAxis
          stroke="#94A3B8"
          fontSize={12}
          tickFormatter={(value) => `NPR ${(Number(value) / 100000).toFixed(0)}L`}
        />
        <Tooltip
          formatter={(value: any) => `NPR ${Number(value).toLocaleString()}`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
          }}
        />
        <Bar dataKey="principal" stackId="a" fill="#635BFF" name="Principal" />
        <Bar dataKey="interest" stackId="a" fill="#00D4AA" name="Interest" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default memo(LoanAmortizationBarChart)
