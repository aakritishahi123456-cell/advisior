'use client'

import { TrendingUp, TrendingDown, DollarSign, Percent, Wallet, PiggyBank } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
}

function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {changeType === 'positive' ? (
          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
        ) : changeType === 'negative' ? (
          <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
        ) : null}
        <span className={`text-sm font-medium ${changeColors[changeType]}`}>
          {change}
        </span>
        <span className="text-sm text-gray-500 ml-1">vs last month</span>
      </div>
    </div>
  )
}

export function MetricsCards() {
  const metrics = [
    {
      title: 'Total Portfolio Value',
      value: 'NPR 2,450,000',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: <Wallet className="w-6 h-6 text-blue-600" />
    },
    {
      title: 'Monthly Returns',
      value: 'NPR 45,200',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: <TrendingUp className="w-6 h-6 text-green-600" />
    },
    {
      title: 'Total Investments',
      value: 'NPR 1,850,000',
      change: '+5.3%',
      changeType: 'positive' as const,
      icon: <PiggyBank className="w-6 h-6 text-purple-600" />
    },
    {
      title: 'YTD Returns',
      value: '18.7%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: <Percent className="w-6 h-6 text-orange-600" />
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
}
