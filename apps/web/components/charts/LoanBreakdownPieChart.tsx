'use client'

import { memo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export type LoanBreakdownSlice = { name: string; value: number; color: string }

function LoanBreakdownPieChart({ data }: { data: LoanBreakdownSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => `NPR ${Number(value).toLocaleString()}`} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default memo(LoanBreakdownPieChart)
