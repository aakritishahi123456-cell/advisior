'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Calculator, Info, CreditCard, TrendingDown, PieChart, RefreshCw } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'

const LoanBreakdownPieChart = dynamic(
  () => import('@/components/charts/LoanBreakdownPieChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)
const LoanAmortizationBarChart = dynamic(
  () => import('@/components/charts/LoanAmortizationBarChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)

export default function LoanSimulatorPage() {
  const [loanAmount, setLoanAmount] = useState(5000000)
  const [interestRate, setInterestRate] = useState(10.5)
  const [loanTerm, setLoanTerm] = useState(20)
  const [loanType, setLoanType] = useState('home')

  const loanTypes = [
    { id: 'home', name: 'Home Loan', rate: 10.5 },
    { id: 'personal', name: 'Personal Loan', rate: 14.5 },
    { id: 'vehicle', name: 'Vehicle Loan', rate: 12.5 },
    { id: 'business', name: 'Business Loan', rate: 13.5 },
  ]

  const calculations = useMemo(() => {
    const principal = loanAmount
    const annualRate = interestRate / 100
    const monthlyRate = annualRate / 12
    const months = loanTerm * 12

    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1)

    const totalPayment = emi * months
    const totalInterest = totalPayment - principal

    const amortization = []
    let balance = principal

    for (let year = 1; year <= loanTerm; year++) {
      let yearInterest = 0
      let yearPrincipal = 0

      for (let month = 1; month <= 12; month++) {
        const interest = balance * monthlyRate
        const principalPayment = emi - interest
        yearInterest += interest
        yearPrincipal += principalPayment
        balance -= principalPayment
      }

      amortization.push({
        year,
        principal: yearPrincipal,
        interest: yearInterest,
        balance: Math.max(0, balance)
      })
    }

    return { emi, totalPayment, totalInterest, amortization }
  }, [loanAmount, interestRate, loanTerm])

  const pieData = [
    { name: 'Principal', value: loanAmount, color: '#635BFF' },
    { name: 'Interest', value: calculations.totalInterest, color: '#00D4AA' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#635BFF]/10 rounded-xl">
          <Calculator className="w-6 h-6 text-[#635BFF]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Simulator</h1>
          <p className="text-sm text-gray-500">Calculate EMI and compare loan options</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Loan Details</h3>

            {/* Loan Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type</label>
              <div className="grid grid-cols-2 gap-2">
                {loanTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setLoanType(type.id)
                      setInterestRate(type.rate)
                    }}
                    className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                      loanType === type.id
                        ? 'bg-[#0A2540] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (NPR)
              </label>
              <input
                type="range"
                min="100000"
                max="50000000"
                step="100000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">1L</span>
                <span className="text-lg font-bold text-[#635BFF]">
                  NPR {loanAmount.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">5Cr</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
              <input
                type="range"
                min="5"
                max="25"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3"
              />
            </div>

            {/* Loan Term */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term (Years)
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 25, 30].map((year) => (
                  <button
                    key={year}
                    onClick={() => setLoanTerm(year)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      loanTerm === year
                        ? 'bg-[#0A2540] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setLoanAmount(5000000)
                setInterestRate(10.5)
                setLoanTerm(20)
              }}
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* EMI Card */}
          <div className="bg-gradient-to-br from-[#0A2540] to-[#635BFF] rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Monthly EMI</span>
              </div>
              <Info className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-4xl font-bold">
              NPR {Math.round(calculations.emi).toLocaleString()}
            </p>
            <p className="text-sm opacity-80 mt-2">per month for {loanTerm} years</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Principal</p>
              <p className="text-2xl font-bold text-gray-900">
                NPR {loanAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Interest</p>
              <p className="text-2xl font-bold text-red-600">
                NPR {Math.round(calculations.totalInterest).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Payment</p>
              <p className="text-2xl font-bold text-[#635BFF]">
                NPR {Math.round(calculations.totalPayment).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
            <div className="h-48">
              <LoanBreakdownPieChart data={pieData} />
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amortization Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Payment Breakdown</h3>
            <div className="h-64">
              <LoanAmortizationBarChart data={calculations.amortization} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
