'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLoanStore } from '@/stores/loanStore'
import { useAuth } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { formatNPR } from '@/utils/currency'
import Skeleton from '@/components/ui/Skeleton'

const LoanScheduleChart = dynamic(() => import('@/components/loan/LoanScheduleChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />,
})
const LoanComparisonChart = dynamic(() => import('@/components/loan/LoanComparisonChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />,
})

// Validation schema
const loanSimulationSchema = z.object({
  loanAmount: z.number()
    .positive('Loan amount must be positive')
    .min(1000, 'Minimum loan amount is NPR 1,000')
    .max(10000000, 'Maximum loan amount is NPR 10,000,000'),
  interestRate: z.number()
    .positive('Interest rate must be positive')
    .min(1, 'Interest rate must be at least 1%')
    .max(50, 'Interest rate cannot exceed 50%'),
  tenureMonths: z.number()
    .int('Tenure must be in months')
    .positive('Tenure must be positive')
    .min(1, 'Minimum tenure is 1 month')
    .max(360, 'Maximum tenure is 360 months (30 years)')
})

type LoanSimulationForm = z.infer<typeof loanSimulationSchema>

interface LoanSimulationResult {
  emi: number
  totalInterest: number
  totalPayment: number
  principal: number
  interestRate: number
  tenure: number
  schedule?: Array<{
    month: number
    principal: number
    interest: number
    emi: number
    balance: number
  }>
}

export default function LoanCalculator() {
  const { user, isAuthenticated } = useAuth()
  const { 
    simulateLoan, 
    saveSimulation, 
    getSimulationHistory, 
    simulationHistory,
    isLoading,
    error 
  } = useLoanStore()
  
  const [result, setResult] = useState<LoanSimulationResult | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [comparisonResults, setComparisonResults] = useState<LoanSimulationResult[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<LoanSimulationForm>({
    resolver: zodResolver(loanSimulationSchema),
    defaultValues: {
      loanAmount: 1000000,
      interestRate: 12,
      tenureMonths: 60
    },
    mode: 'onChange'
  })

  const loanAmount = watch('loanAmount')
  const interestRate = watch('interestRate')
  const tenureMonths = watch('tenureMonths')

  // Calculate EMI in real-time as user types
  useEffect(() => {
    if (!isValid || !loanAmount || !interestRate || !tenureMonths) return
    const handle = setTimeout(() => {
      calculateQuickEMI(loanAmount, interestRate, tenureMonths)
    }, 150)
    return () => clearTimeout(handle)
  }, [loanAmount, interestRate, tenureMonths, isValid])

  const calculateQuickEMI = useCallback((principal: number, annualRate: number, months: number) => {
    try {
      let emi: number
      if (annualRate === 0) {
        emi = principal / months
      } else {
        const monthlyRate = annualRate / 12 / 100
        emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      }

      const totalPayment = emi * months
      const totalInterest = totalPayment - principal

      setResult({
        emi: Math.round(emi * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        principal,
        interestRate: annualRate,
        tenure: months,
      })
    } catch (error) {
      console.error('Calculation error:', error)
    }
  }, [])

  const onSubmit = async (data: LoanSimulationForm) => {
    try {
      const simulation = await simulateLoan({
        principal: data.loanAmount,
        interestRate: data.interestRate,
        tenure: data.tenureMonths
      })

      setResult(simulation)
      toast.success('Loan simulation completed successfully')
    } catch (error: any) {
      toast.error(error.error || 'Failed to simulate loan')
    }
  }

  const handleSaveSimulation = async () => {
    if (!result || !isAuthenticated) {
      toast.error('Please login to save simulation')
      return
    }

    try {
      await saveSimulation({
        principal: result.principal,
        interestRate: result.interestRate,
        tenure: result.tenure
      })
      toast.success('Simulation saved to your history')
    } catch (error: any) {
      toast.error(error.error || 'Failed to save simulation')
    }
  }

  const handleCompareLoans = async () => {
    if (!result) return

    try {
      // Create comparison scenarios with different interest rates
      const scenarios = [
        { principal: result.principal, interestRate: 10, tenure: result.tenure },
        { principal: result.principal, interestRate: 12, tenure: result.tenure },
        { principal: result.principal, interestRate: 15, tenure: result.tenure },
        { principal: result.principal, interestRate: 18, tenure: result.tenure },
      ]

      const comparisons = await Promise.all(
        scenarios.map(scenario => simulateLoan(scenario))
      )

      setComparisonResults(comparisons)
      setComparing(true)
      toast.success('Loan comparison completed')
    } catch (error: any) {
      toast.error(error.error || 'Failed to compare loans')
    }
  }

  const getFullSimulation = async () => {
    if (!loanAmount || !interestRate || !tenureMonths) return

    try {
      const simulation = await simulateLoan({
        principal: loanAmount,
        interestRate,
        tenure: tenureMonths
      })

      setResult(simulation)
      setShowSchedule(true)
    } catch (error: any) {
      toast.error(error.error || 'Failed to get full simulation')
    }
  }

  // Prepare chart data
  const scheduleChartData = useMemo(() => {
    const schedule = result?.schedule
    if (!schedule || schedule.length === 0) return []

    // Recharts gets sluggish with hundreds of points; cap to ~120 points.
    const maxPoints = 120
    const stride = schedule.length > maxPoints ? Math.ceil(schedule.length / maxPoints) : 1

    return schedule
      .filter((_, idx) => idx % stride === 0 || idx === schedule.length - 1)
      .map((item) => ({
        month: `Month ${item.month}`,
        principal: item.principal,
        interest: item.interest,
        balance: item.balance,
      }))
  }, [result?.schedule])

  const comparisonChartData = useMemo(
    () =>
      comparisonResults.map((r) => ({
        rate: `${r.interestRate}%`,
        emi: r.emi,
        totalInterest: r.totalInterest,
      })),
    [comparisonResults]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Loan Calculator</h2>
        <p className="text-gray-600 mt-1">
          Calculate EMI, total interest, and compare different loan options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Loan Amount */}
              <div>
                <label className="form-label">Loan Amount (NPR)</label>
                <input
                  type="number"
                  {...register('loanAmount', { valueAsNumber: true })}
                  className="form-input"
                  placeholder="Enter loan amount"
                  step="10000"
                />
                {errors.loanAmount && (
                  <p className="form-error">{errors.loanAmount.message}</p>
                )}
              </div>

              {/* Interest Rate */}
              <div>
                <label className="form-label">Interest Rate (%)</label>
                <input
                  type="number"
                  {...register('interestRate', { valueAsNumber: true })}
                  className="form-input"
                  placeholder="Enter interest rate"
                  step="0.1"
                />
                {errors.interestRate && (
                  <p className="form-error">{errors.interestRate.message}</p>
                )}
              </div>

              {/* Tenure */}
              <div>
                <label className="form-label">Loan Tenure (Months)</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    {...register('tenureMonths', { valueAsNumber: true })}
                    className="w-full"
                    min="1"
                    max="360"
                    step="1"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>1 month</span>
                    <span className="font-medium">{tenureMonths} months</span>
                    <span>360 months</span>
                  </div>
                </div>
                {errors.tenureMonths && (
                  <p className="form-error">{errors.tenureMonths.message}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isLoading || !isValid}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <div className="spinner mr-2"></div>
                      Calculating...
                    </span>
                  ) : (
                    'Calculate EMI'
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCompareLoans}
                    disabled={!result || isLoading}
                    className="btn btn-outline"
                  >
                    Compare Rates
                  </button>
                  
                  <button
                    type="button"
                    onClick={getFullSimulation}
                    disabled={!loanAmount || !interestRate || !tenureMonths || isLoading}
                    className="btn btn-outline"
                  >
                    Full Schedule
                  </button>
                </div>

                {isAuthenticated && result && (
                  <button
                    type="button"
                    onClick={handleSaveSimulation}
                    disabled={isLoading}
                    className="btn btn-secondary w-full"
                  >
                    Save Simulation
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* EMI Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly EMI</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {formatNPR(result.emi)}
                </div>
                <p className="text-gray-600 mt-2">
                  For {result.tenure} months at {result.interestRate}% interest
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Principal</h4>
                  <div className="text-xl font-semibold text-gray-900 mt-1">
                    {formatNPR(result.principal)}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Total Interest</h4>
                  <div className="text-xl font-semibold text-orange-600 mt-1">
                    {formatNPR(result.totalInterest)}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Total Payment</h4>
                  <div className="text-xl font-semibold text-green-600 mt-1">
                    {formatNPR(result.totalPayment)}
                  </div>
                </div>
              </div>

              {/* Charts */}
              {showSchedule && result.schedule && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Amortization Schedule</h3>
                  <LoanScheduleChart data={scheduleChartData} formatCurrency={formatNPR} />
                </div>
              )}

              {comparing && comparisonResults.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interest Rate Comparison</h3>
                  <LoanComparisonChart data={comparisonChartData} formatCurrency={formatNPR} />
                </div>
              )}
            </>
          )}

          {!result && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <div className="text-gray-500">
                <div className="text-lg font-medium">Enter loan details to see calculations</div>
                <p className="mt-2">
                  Fill in the loan amount, interest rate, and tenure to calculate your EMI
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation History */}
      {isAuthenticated && simulationHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Simulations</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="table-header-cell">Amount</th>
                  <th className="table-header-cell">Rate</th>
                  <th className="table-header-cell">Tenure</th>
                  <th className="table-header-cell">EMI</th>
                  <th className="table-header-cell">Total Interest</th>
                  <th className="table-header-cell">Date</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {simulationHistory.slice(0, 5).map((loan) => (
                  <tr key={loan.id}>
                    <td className="table-cell">{formatNPR(loan.principal)}</td>
                    <td className="table-cell">{loan.interestRate}%</td>
                    <td className="table-cell">{loan.tenure} months</td>
                    <td className="table-cell">{formatNPR(loan.emi)}</td>
                    <td className="table-cell">{formatNPR(loan.totalPayment - loan.principal)}</td>
                    <td className="table-cell">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
