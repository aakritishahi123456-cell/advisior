'use client'

import { memo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export type AllocationSlice = { name: string; value: number; color: string }

function PortfolioRecommendedAllocationChart({ data }: { data: ReadonlyArray<AllocationSlice> }) {
  const chartData = data.slice()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default memo(PortfolioRecommendedAllocationChart)
