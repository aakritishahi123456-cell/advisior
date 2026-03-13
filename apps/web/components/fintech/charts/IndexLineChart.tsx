'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export type IndexPoint = { date: string; value: number }

export default function IndexLineChart({ data }: { data: IndexPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="idx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#635BFF" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#635BFF" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={{
            background: 'rgba(2,6,23,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            color: '#fff',
          }}
          labelStyle={{ color: 'rgba(226,232,240,0.9)' }}
        />
        <Line type="monotone" dataKey="value" stroke="#635BFF" strokeWidth={2.2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

