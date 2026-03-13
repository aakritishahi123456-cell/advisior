import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { api } from '@/lib/apiClient'
import { LoanSimulationResult } from '@/types/loan'

interface LoanState {
  // State
  simulationResult: LoanSimulationResult | null
  simulationHistory: Array<{
    id: string
    principal: number
    interestRate: number
    tenure: number
    emi: number
    totalPayment: number
    createdAt: string
  }>
  comparisonResults: LoanSimulationResult[]
  isLoading: boolean
  error: string | null
  
  // Actions
  simulateLoan: (data: { principal: number; interestRate: number; tenure: number }) => Promise<LoanSimulationResult>
  saveSimulation: (data: { principal: number; interestRate: number; tenure: number }) => Promise<void>
  compareLoans: (loans: Array<{ principal: number; interestRate: number; tenure: number }>) => Promise<LoanSimulationResult[]>
  getSimulationHistory: () => Promise<void>
  clearError: () => void
  clearResults: () => void
}

export const useLoanStore = create<LoanState>()(
  persist(
    (set, get) => ({
      // Initial state
      simulationResult: null,
      simulationHistory: [],
      comparisonResults: [],
      isLoading: false,
      error: null,

      // Simulate loan
      simulateLoan: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<LoanSimulationResult>(
            '/loans/simulate',
            data
          )

          if (response.success && response.data) {
            set({
              simulationResult: response.data,
              isLoading: false,
              error: null
            })
            return response.data
          } else {
            throw new Error(response.error || 'Loan simulation failed')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to simulate loan',
            simulationResult: null
          })
          throw error
        }
      },

      // Save simulation to history
      saveSimulation: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/loans/save-simulation', data)
          
          if (response.success) {
            // Refresh history after saving
            await get().getSimulationHistory()
          } else {
            throw new Error(response.error || 'Failed to save simulation')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to save simulation'
          })
          throw error
        }
      },

      // Compare multiple loans
      compareLoans: async (loans) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<LoanSimulationResult[]>(
            '/loans/compare',
            { loans }
          )

          if (response.success && response.data) {
            set({
              comparisonResults: response.data,
              isLoading: false,
              error: null
            })
            return response.data
          } else {
            throw new Error(response.error || 'Failed to compare loans')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to compare loans',
            comparisonResults: []
          })
          throw error
        }
      },

      // Get simulation history
      getSimulationHistory: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.get('/loans/simulation-history')
          
          if (response.success && response.data) {
            set({
              simulationHistory: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to get simulation history')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to get simulation history',
            simulationHistory: []
          })
          throw error
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Clear all results
      clearResults: () => {
        set({
          simulationResult: null,
          comparisonResults: [],
          error: null
        })
      },
    }),
    {
      name: 'loan-storage',
      partialize: (state) => ({
        simulationHistory: state.simulationHistory,
      }),
    }
  )
)

// Selectors for common use cases
export const useLoanCalculator = () => {
  return useLoanStore(
    (store) => ({
      // Current simulation
      simulationResult: store.simulationResult,
      comparisonResults: store.comparisonResults,

      // History
      simulationHistory: store.simulationHistory,

      // State
      isLoading: store.isLoading,
      error: store.error,

      // Actions
      simulateLoan: store.simulateLoan,
      saveSimulation: store.saveSimulation,
      compareLoans: store.compareLoans,
      getSimulationHistory: store.getSimulationHistory,
      clearError: store.clearError,
      clearResults: store.clearResults,

      // Computed values
      hasResults: !!store.simulationResult,
      hasHistory: store.simulationHistory.length > 0,
      isComparing: store.comparisonResults.length > 0,

      // Quick EMI calculation (without API call)
      quickEMI: (principal: number, annualRate: number, tenureMonths: number): number => {
        if (annualRate === 0) {
          return principal / tenureMonths
        }

        const monthlyRate = annualRate / 12 / 100
        const emi =
          (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1)

        return Math.round(emi * 100) / 100
      },

      // Calculate affordability
      calculateAffordability: (monthlyIncome: number, existingEMIs: number = 0) => {
        // Rule of thumb: EMI should not exceed 40% of monthly income
        const maxEMI = monthlyIncome * 0.4 - existingEMIs

        // Calculate maximum loan amount at 12% interest for 5 years
        const annualRate = 12
        const tenureMonths = 60
        const monthlyRate = annualRate / 12 / 100

        // Rearranged EMI formula to calculate principal
        const maxLoanAmount =
          (maxEMI * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths))

        return {
          maxEMI: Math.round(maxEMI * 100) / 100,
          maxLoanAmount: Math.round(maxLoanAmount * 100) / 100,
          recommendedTenure: tenureMonths,
        }
      },
    }),
    shallow
  )
}

// Hook for loan statistics
export const useLoanStatistics = () => {
  return useLoanStore((store) => {
    const history = store.simulationHistory

    return {
      totalSimulations: history.length,
      averageLoanAmount: history.length > 0 ? history.reduce((sum, loan) => sum + loan.principal, 0) / history.length : 0,
      averageInterestRate: history.length > 0 ? history.reduce((sum, loan) => sum + loan.interestRate, 0) / history.length : 0,
      recentSimulations: history.slice(0, 5),
      totalInterestPaid: history.reduce((sum, loan) => sum + (loan.totalPayment - loan.principal), 0),
      mostCommonAmount:
        history.length > 0
          ? history.reduce((acc, loan) => {
              const amount = loan.principal
              acc[amount] = (acc[amount] || 0) + 1
              return acc
            }, {} as Record<number, number>)
          : {},
    }
  }, shallow)
}

// Hook for loan comparison
export const useLoanComparison = () => {
  return useLoanStore(
    (store) => {
      const results = store.comparisonResults
      return {
        comparisonResults: results,
        isComparing: results.length > 0,
        compareLoans: store.compareLoans,
        clearResults: store.clearResults,
        cheapestOption: results.length > 0 ? results.reduce((min, current) => (current.totalPayment < min.totalPayment ? current : min)) : null,
        mostExpensiveOption:
          results.length > 0 ? results.reduce((max, current) => (current.totalPayment > max.totalPayment ? current : max)) : null,
        potentialSavings: results.length > 1 ? results[0].totalPayment - results[results.length - 1].totalPayment : 0,
      }
    },
    shallow
  )
}

export default useLoanStore
