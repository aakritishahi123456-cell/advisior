'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export type MoveRow = { symbol: string; change: number }

export default function GainersLosersBar({ data }: { data: MoveRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="symbol" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={{
            background: 'rgba(2,6,23,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            color: '#fff',
          }}
        />
        <Bar dataKey="change" radius={[10, 10, 10, 10]} fill="#00D4AA" />
      </BarChart>
    </ResponsiveContainer>
  )
}

