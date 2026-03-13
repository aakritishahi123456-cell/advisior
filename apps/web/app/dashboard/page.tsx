'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Bot,
  Sparkles,
  Building2,
  Landmark,
  PieChart,
  CreditCard,
  AlertCircle
} from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'

const DashboardPerformanceChart = dynamic(
  () => import('@/components/charts/DashboardPerformanceChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)
const DashboardAllocationChart = dynamic(
  () => import('@/components/charts/DashboardAllocationChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)

const portfolioData = [
  { name: 'Stocks', value: 45, color: '#635BFF' },
  { name: 'Mutual Funds', value: 25, color: '#00D4AA' },
  { name: 'Fixed Deposits', value: 20, color: '#0A2540' },
  { name: 'Cash', value: 10, color: '#94A3B8' },
]

const performanceData = [
  { month: 'Jan', value: 1000000 },
  { month: 'Feb', value: 1050000 },
  { month: 'Mar', value: 1020000 },
  { month: 'Apr', value: 1080000 },
  { month: 'May', value: 1150000 },
  { month: 'Jun', value: 1200000 },
]

const topStocks = [
  { symbol: 'NABIL', name: 'Nabil Bank', price: 490, change: 2.4 },
  { symbol: 'NICBL', name: 'NIC Asia Bank', price: 380, change: 1.8 },
  { symbol: 'PRVU', name: 'Prabhu Bank', price: 245, change: -0.5 },
  { symbol: 'HBL', name: 'HBL Bank', price: 520, change: 3.2 },
  { symbol: 'BOK', name: 'Bank of Kathmandu', price: 310, change: 1.1 },
]

const aiInsights = [
  {
    type: 'opportunity',
    title: 'Banking Sector Rising',
    description: 'Tier-1 banks showing strong momentum. Consider increasing allocation.',
    time: '2h ago'
  },
  {
    type: 'warning',
    title: 'High Interest Rates',
    description: 'Loan rates at peak. Consider fixing your home loan rate soon.',
    time: '5h ago'
  },
  {
    type: 'info',
    title: 'Dividend Season',
    description: 'Several banks announcing dividends next week.',
    time: '1d ago'
  },
]

export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const metrics = [
    {
      title: 'Total Portfolio',
      value: 'NPR 2,450,000',
      change: 12.5,
      trend: 'up',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      title: 'Monthly Returns',
      value: 'NPR 45,200',
      change: 8.2,
      trend: 'up',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      title: 'Total Investments',
      value: 'NPR 1,850,000',
      change: 5.3,
      trend: 'up',
      icon: <PiggyBank className="w-5 h-5" />,
    },
    {
      title: 'YTD Returns',
      value: '18.7%',
      change: 2.1,
      trend: 'up',
      icon: <Percent className="w-5 h-5" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, John! Here's your financial overview.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
              <div className="p-2 bg-[#635BFF]/10 rounded-xl">
                <div className="text-[#635BFF]">{metric.icon}</div>
              </div>
            </div>
            <div className={`flex items-center ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {metric.trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm font-semibold">+{metric.change}%</span>
              <span className="text-xs text-gray-400 ml-2">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Portfolio Performance */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
            <div className="flex gap-2">
              {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  className={`px-3 py-1 text-xs font-medium rounded-lg ${
                    period === '6M'
                      ? 'bg-[#0A2540] text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <DashboardPerformanceChart data={performanceData} />
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Asset Allocation</h3>
          <div className="h-48">
            <DashboardAllocationChart data={portfolioData} />
          </div>
          <div className="space-y-2 mt-4">
            {portfolioData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Stocks */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top NEPSE Stocks</h3>
            <a href="/dashboard/investment-research" className="text-sm text-[#635BFF] font-medium hover:underline">
              View All
            </a>
          </div>
          <div className="space-y-3">
            {topStocks.map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Landmark className="w-5 h-5 text-[#635BFF]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{stock.symbol}</p>
                    <p className="text-xs text-gray-500">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">NPR {stock.price}</p>
                  <p className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
              <span className="px-2 py-0.5 bg-gradient-to-r from-[#635BFF] to-[#8B85FF] text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            </div>
            <a href="/dashboard/ai-advisor" className="text-sm text-[#635BFF] font-medium hover:underline">
              Ask AI
            </a>
          </div>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-xl border ${
                  insight.type === 'opportunity' 
                    ? 'bg-green-50 border-green-200' 
                    : insight.type === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    insight.type === 'opportunity' 
                      ? 'bg-green-100' 
                      : insight.type === 'warning'
                      ? 'bg-amber-100'
                      : 'bg-blue-100'
                  }`}>
                    {insight.type === 'opportunity' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : insight.type === 'warning' ? (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{insight.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{insight.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a 
          href="/dashboard/loan-simulator"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#635BFF] hover:shadow-md transition-all"
        >
          <div className="p-2 bg-[#635BFF]/10 rounded-lg">
            <CreditCard className="w-5 h-5 text-[#635BFF]" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Loan Calculator</p>
            <p className="text-xs text-gray-500">Calculate EMI</p>
          </div>
        </a>
        <a 
          href="/dashboard/ai-advisor"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#635BFF] hover:shadow-md transition-all"
        >
          <div className="p-2 bg-[#00D4AA]/10 rounded-lg">
            <Bot className="w-5 h-5 text-[#00D4AA]" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Ask AI Advisor</p>
            <p className="text-xs text-gray-500">Get insights</p>
          </div>
        </a>
        <a 
          href="/dashboard/portfolio"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#635BFF] hover:shadow-md transition-all"
        >
          <div className="p-2 bg-[#0A2540]/10 rounded-lg">
            <PieChart className="w-5 h-5 text-[#0A2540]" />
          </div>
          <div>
            <p className="font-medium text-gray-900">View Portfolio</p>
            <p className="text-xs text-gray-500">Track holdings</p>
          </div>
        </a>
        <a 
          href="/dashboard/financial-planning"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#635BFF] hover:shadow-md transition-all"
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Plan Goals</p>
            <p className="text-xs text-gray-500">Financial planning</p>
          </div>
        </a>
      </div>
    </div>
  )
}
