'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Card from './Card'

interface MetricCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  sparkline?: number[]
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  trend = 'neutral',
  icon,
  sparkline,
}: MetricCardProps) {
  const trendColors = {
    up: 'text-gains',
    down: 'text-losses',
    neutral: 'text-text-secondary',
  }

  const trendBgColors = {
    up: 'bg-gains-50',
    down: 'bg-losses-50',
    neutral: 'bg-surface-tertiary',
  }

  return (
    <Card className="relative overflow-hidden" hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          
          {change !== undefined && (
            <div className={`flex items-center mt-3 ${trendColors[trend]}`}>
              {trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
              {trend === 'neutral' && <Minus className="w-4 h-4 mr-1" />}
              <span className="text-sm font-semibold">
                {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-text-tertiary ml-2">{changeLabel}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-fintech-secondary/10 to-fintech-accent/10">
            {icon}
          </div>
        )}
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
          >
            <path
              d={`M 0 40 ${sparkline
                .map((val, i) => {
                  const x = (i / (sparkline.length - 1)) * 100
                  const y = 40 - (val / Math.max(...sparkline)) * 35
                  return `L ${x} ${y}`
                })
                .join(' ')} L 100 40 Z`}
              fill={trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94A3B8'}
              fillOpacity="0.2"
              stroke={trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94A3B8'}
              strokeWidth="2"
            />
          </svg>
        </div>
      )}
    </Card>
  )
}
