'use client'

import { useState } from 'react'
import { Target, TrendingUp, Calculator, GraduationCap, Home, Briefcase, ArrowRight, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import Skeleton from '@/components/ui/Skeleton'

const FinancialPlanningProjectionChart = dynamic(
  () => import('@/components/charts/FinancialPlanningProjectionChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)

const planningGoals = [
  { id: 'retirement', name: 'Retirement Planning', icon: Briefcase, targetAmount: 10000000, currentAmount: 2500000, timeline: '25 years' },
  { id: 'home', name: 'Buy a Home', icon: Home, targetAmount: 5000000, currentAmount: 1500000, timeline: '5 years' },
  { id: 'education', name: 'Education Fund', icon: GraduationCap, targetAmount: 2000000, currentAmount: 500000, timeline: '10 years' },
]

const projectionData = [
  { year: '2024', value: 2500000 },
  { year: '2025', value: 3200000 },
  { year: '2026', value: 4000000 },
  { year: '2027', value: 4900000 },
  { year: '2028', value: 6000000 },
  { year: '2029', value: 7200000 },
]

export default function FinancialPlanningPage() {
  const [selectedGoal, setSelectedGoal] = useState(planningGoals[0])

  const monthlyInvestmentOptions = [
    { amount: 10000, return: '4.2 Cr', risk: 'Low' },
    { amount: 25000, return: '6.8 Cr', risk: 'Medium' },
    { amount: 50000, return: '9.5 Cr', risk: 'High' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#635BFF]/10 rounded-xl">
          <Target className="w-6 h-6 text-[#635BFF]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Planning</h1>
          <p className="text-sm text-gray-500">Plan and achieve your financial goals</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Goals</h3>
            <div className="space-y-3">
              {planningGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    selectedGoal.id === goal.id 
                      ? 'bg-[#635BFF]/10 border-2 border-[#635BFF]' 
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${selectedGoal.id === goal.id ? 'bg-[#635BFF]' : 'bg-gray-200'}`}>
                    <goal.icon className={`w-5 h-5 ${selectedGoal.id === goal.id ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">{goal.name}</p>
                    <p className="text-sm text-gray-500">{goal.timeline} • NPR {goal.targetAmount.toLocaleString()} target</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedGoal.name} Projection
            </h3>
            <div className="h-64">
              <FinancialPlanningProjectionChart data={projectionData} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-[#635BFF]" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Investment Calculator</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
                <input type="text" value={`NPR ${selectedGoal.targetAmount.toLocaleString()}`} readOnly className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Savings</label>
                <input type="text" value={`NPR ${selectedGoal.currentAmount.toLocaleString()}`} readOnly className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                <input type="text" value={selectedGoal.timeline} readOnly className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 font-semibold" />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-4">Recommended Monthly Investment</p>
              <div className="space-y-3">
                {monthlyInvestmentOptions.map((opt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">NPR {opt.amount.toLocaleString()}/month</p>
                      <p className="text-xs text-gray-500">Risk: {opt.risk}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#635BFF]">Est. Returns</p>
                      <p className="font-bold text-gray-900">{opt.return}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full mt-6 py-3 bg-[#635BFF] text-white font-semibold rounded-xl hover:bg-[#4B44B3] transition-colors">
              Create Plan
            </button>
          </div>

          <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">On Track!</span>
            </div>
            <p className="text-sm text-green-700">You're 25% towards your {selectedGoal.name} goal. Keep up the good work!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
