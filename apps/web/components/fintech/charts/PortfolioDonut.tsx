'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export type AllocationSlice = { name: string; value: number; color: string }

export default function PortfolioDonut({ data }: { data: readonly AllocationSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip
          contentStyle={{
            background: 'rgba(2,6,23,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            color: '#fff',
          }}
        />
        <Pie
          data={data as any}
          dataKey="value"
          nameKey="name"
          innerRadius={72}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

