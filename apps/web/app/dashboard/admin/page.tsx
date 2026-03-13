'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Bot, 
  Activity,
  Search,
  DollarSign,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
}

function StatCard({ title, value, change, changeType = 'neutral', icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
}

interface ChartProps {
  title: string
  data: { label: string; value: number }[]
}

function SimpleBarChart({ title, data }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-20">{item.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivity() {
  const activities = [
    { user: 'john@example.com', action: 'New subscription', plan: 'PRO', time: '2 min ago' },
    { user: 'jane@example.com', action: 'AI Advisor query', plan: 'Investor', time: '5 min ago' },
    { user: 'bob@example.com', action: 'Loan simulation', plan: '-', time: '10 min ago' },
    { user: 'alice@example.com', action: 'Company search', plan: 'Free', time: '15 min ago' },
    { user: 'mike@example.com', action: 'Payment received', plan: 'PRO', time: '20 min ago' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{activity.user}</p>
              <p className="text-xs text-gray-500">{activity.action}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-blue-600">{activity.plan}</span>
              <p className="text-xs text-gray-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SubscriptionBreakdown() {
  const data = [
    { plan: 'Free', users: 1250, revenue: 0 },
    { plan: 'PRO', users: 450, revenue: 449550 },
    { plan: 'Investor', users: 120, revenue: 299880 },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Breakdown</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Plan</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Users</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue (NPR)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">{row.plan}</td>
                <td className="py-3 px-4 text-sm text-gray-900 text-right">{row.users.toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-gray-900 text-right">Rs. {row.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="py-3 px-4 text-gray-900">Total</td>
              <td className="py-3 px-4 text-gray-900 text-right">1,820</td>
              <td className="py-3 px-4 text-gray-900 text-right">Rs. 749,430</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function MarketDataStatus() {
  const data = [
    { symbol: 'NABIL', name: 'Nabil Bank', price: 620, change: 2.5, status: 'active' },
    { symbol: 'NICA', name: 'Nic Asia Bank', price: 485, change: -1.2, status: 'active' },
    { symbol: 'SCB', name: 'Standard Chartered', price: 310, change: 0.8, status: 'active' },
    { symbol: 'MBL', name: 'Machhapuchhre Bank', price: 380, change: 1.5, status: 'active' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Market Data Status</h3>
        <span className="flex items-center gap-2 text-xs text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>
      <div className="space-y-3">
        {data.map((stock, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-semibold text-gray-900">{stock.symbol}</p>
              <p className="text-xs text-gray-500">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">Rs. {stock.price}</p>
              <p className={`text-xs ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.change}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AIAdvisorUsage() {
  const data = [
    { metric: 'Total Queries', value: '12,450', change: '+15%' },
    { metric: 'Active Users', value: '890', change: '+8%' },
    { metric: 'Avg Response Time', value: '1.2s', change: '-20%' },
    { metric: 'Success Rate', value: '99.2%', change: '+0.5%' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Advisor Usage</h3>
      <div className="grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={index} className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">{item.metric}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{item.value}</p>
            <p className="text-xs text-green-600 mt-1">{item.change}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value="1,820"
          change="+12% from last month"
          changeType="positive"
          icon={<Users className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="Monthly Revenue"
          value="Rs. 749,430"
          change="+8% from last month"
          changeType="positive"
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          title="Active Subscriptions"
          value="570"
          change="+5% from last month"
          changeType="positive"
          icon={<CreditCard className="w-6 h-6 text-purple-600" />}
        />
        <StatCard
          title="AI Advisor Queries"
          value="12,450"
          change="+15% from last month"
          changeType="positive"
          icon={<Bot className="w-6 h-6 text-orange-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart 
          title="Revenue by Plan" 
          data={[
            { label: 'Free', value: 0 },
            { label: 'PRO', value: 449550 },
            { label: 'Investor', value: 299880 },
          ]} 
        />
        <SimpleBarChart 
          title="Feature Usage" 
          data={[
            { label: 'AI Advisor', value: 12450 },
            { label: 'Trading', value: 8900 },
            { label: 'Analysis', value: 6700 },
            { label: 'Search', value: 15200 },
            { label: 'Loans', value: 4300 },
          ]} 
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SubscriptionBreakdown />
        <div className="space-y-6">
          <MarketDataStatus />
          <AIAdvisorUsage />
        </div>
        <RecentActivity />
      </div>
    </div>
  )
}
