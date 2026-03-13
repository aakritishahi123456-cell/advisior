import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { api, endpoints } from '../lib/apiClient'

interface SubscriptionState {
  // State
  currentSubscription: Subscription | null
  availablePlans: SubscriptionPlan[]
  billingHistory: BillingHistoryEntry[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCurrentSubscription: () => Promise<void>
  fetchAvailablePlans: () => Promise<void>
  fetchBillingHistory: () => Promise<void>
  upgradePlan: (planId: string) => Promise<void>
  downgradePlan: (planId: string) => Promise<void>
  cancelSubscription: (reason?: string) => Promise<void>
  reactivateSubscription: () => Promise<void>
  updatePaymentMethod: (paymentDetails: PaymentDetails) => Promise<void>
  clearError: () => void
}

interface Subscription {
  id: string
  plan: string
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED'
  startDate: string
  endDate?: string
  autoRenew: boolean
  features: string[]
  limits: {
    loansPerMonth: number
    reportsPerMonth: number
    aiAnalysisPerMonth: number
    apiCallsPerHour: number
    storageGB: number
  }
  pricing: {
    monthly: number
    yearly: number
    currency: string
  }
  paymentMethod?: PaymentMethod
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
    currency: string
  }
  features: string[]
  limits: {
    loansPerMonth: number
    reportsPerMonth: number
    aiAnalysisPerMonth: number
    apiCallsPerHour: number
    storageGB: number
  }
  isPopular?: boolean
  trialDays?: number
}

interface BillingHistoryEntry {
  id: string
  date: string
  type: 'subscription' | 'upgrade' | 'downgrade' | 'payment' | 'refund'
  amount: number
  currency: string
  status: 'completed' | 'pending' | 'failed'
  description: string
  invoiceUrl?: string
  paymentMethod: string
}

interface PaymentMethod {
  id: string
  type: 'credit-card' | 'bank-transfer' | 'digital-wallet'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

interface PaymentDetails {
  type: 'credit-card' | 'bank-transfer' | 'digital-wallet'
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  bankAccount?: string
  walletProvider?: string
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSubscription: null,
      availablePlans: [],
      billingHistory: [],
      isLoading: false,
      error: null,

      // Fetch current subscription
      fetchCurrentSubscription: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.get<Subscription>(endpoints.subscriptions.current)
          
          if (response.success && response.data) {
            set({
              currentSubscription: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to fetch subscription')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to fetch subscription'
          })
          throw error
        }
      },

      // Fetch available plans
      fetchAvailablePlans: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.get<SubscriptionPlan[]>(endpoints.subscriptions.plans)
          
          if (response.success && response.data) {
            set({
              availablePlans: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to fetch available plans')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to fetch available plans'
          })
          throw error
        }
      },

      // Fetch billing history
      fetchBillingHistory: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.get<BillingHistoryEntry[]>(endpoints.subscriptions.history)
          
          if (response.success && response.data) {
            set({
              billingHistory: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to fetch billing history')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to fetch billing history'
          })
          throw error
        }
      },

      // Upgrade plan
      upgradePlan: async (planId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<Subscription>(endpoints.subscriptions.upgrade, { planId })
          
          if (response.success && response.data) {
            set({
              currentSubscription: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to upgrade plan')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to upgrade plan'
          })
          throw error
        }
      },

      // Downgrade plan
      downgradePlan: async (planId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<Subscription>(endpoints.subscriptions.downgrade, { planId })
          
          if (response.success && response.data) {
            set({
              currentSubscription: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to downgrade plan')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to downgrade plan'
          })
          throw error
        }
      },

      // Cancel subscription
      cancelSubscription: async (reason?: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<Subscription>(endpoints.subscriptions.cancel, { reason })
          
          if (response.success && response.data) {
            set({
              currentSubscription: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to cancel subscription')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to cancel subscription'
          })
          throw error
        }
      },

      // Reactivate subscription
      reactivateSubscription: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<Subscription>(endpoints.subscriptions.reactivate)
          
          if (response.success && response.data) {
            set({
              currentSubscription: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to reactivate subscription')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to reactivate subscription'
          })
          throw error
        }
      },

      // Update payment method
      updatePaymentMethod: async (paymentDetails: PaymentDetails) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<Subscription>(endpoints.subscriptions.updatePayment, paymentDetails)
          
          if (response.success && response.data) {
            set({
              currentSubscription: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to update payment method')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to update payment method'
          })
          throw error
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        currentSubscription: state.currentSubscription,
      }),
    }
  )
)

// Selectors for common use cases
export const useSubscription = () => {
  return useSubscriptionStore(
    (store) => ({
      currentSubscription: store.currentSubscription,
      availablePlans: store.availablePlans,
      billingHistory: store.billingHistory,
      isLoading: store.isLoading,
      error: store.error,

      // Computed values
      isSubscribed: !!store.currentSubscription,
      isActive: store.currentSubscription?.status === 'ACTIVE',
      isCancelled: store.currentSubscription?.status === 'CANCELLED',
      isExpired: store.currentSubscription?.status === 'EXPIRED',
      planName: store.currentSubscription?.plan || 'FREE',
      features: store.currentSubscription?.features || [],
      limits: store.currentSubscription?.limits,
      autoRenew: store.currentSubscription?.autoRenew || false,
      endDate: store.currentSubscription?.endDate,

      // Actions
      fetchCurrentSubscription: store.fetchCurrentSubscription,
      fetchAvailablePlans: store.fetchAvailablePlans,
      fetchBillingHistory: store.fetchBillingHistory,
      upgradePlan: store.upgradePlan,
      downgradePlan: store.downgradePlan,
      cancelSubscription: store.cancelSubscription,
      reactivateSubscription: store.reactivateSubscription,
      updatePaymentMethod: store.updatePaymentMethod,
      clearError: store.clearError,
    }),
    shallow
  )
}

// Hook for subscription limits
export const useSubscriptionLimits = () => {
  const subscription = useSubscription()
  
  return {
    limits: subscription.limits,
    
    // Individual limits
    loansPerMonth: subscription.limits?.loansPerMonth || 5,
    reportsPerMonth: subscription.limits?.reportsPerMonth || 10,
    aiAnalysisPerMonth: subscription.limits?.aiAnalysisPerMonth || 3,
    apiCallsPerHour: subscription.limits?.apiCallsPerHour || 100,
    storageGB: subscription.limits?.storageGB || 1,
    
    // Check if limit reached
    isLoansLimitReached: false, // This would be calculated from actual usage
    isReportsLimitReached: false,
    isAiAnalysisLimitReached: false,
    isApiLimitReached: false,
    isStorageLimitReached: false,
  }
}

// Hook for subscription features
export const useSubscriptionFeatures = () => {
  const subscription = useSubscription()
  
  return {
    features: subscription.features,
    
    // Feature checks
    hasAdvancedAnalytics: subscription.features.includes('advanced-analytics'),
    hasAiAnalysis: subscription.features.includes('ai-analysis'),
    hasPrioritySupport: subscription.features.includes('priority-support'),
    hasCustomBranding: subscription.features.includes('custom-branding'),
    hasApiAccess: subscription.features.includes('api-access'),
    hasBulkOperations: subscription.features.includes('bulk-operations'),
    hasExportData: subscription.features.includes('export-data'),
    hasRealTimeUpdates: subscription.features.includes('real-time-updates'),
    
    // Plan comparison
    canUpgradeToPro: subscription.planName === 'FREE',
    needsDowngrade: subscription.planName === 'PRO' && !subscription.isActive,
  }
}

// Hook for billing information
export const useBilling = () => {
  const subscription = useSubscription()
  
  return {
    billingHistory: subscription.billingHistory,
    currentPlan: subscription.currentSubscription,
    
    // Billing calculations
    monthlyPrice: subscription.currentSubscription?.pricing?.monthly || 0,
    yearlyPrice: subscription.currentSubscription?.pricing?.yearly || 0,
    yearlySavings: subscription.currentSubscription?.pricing?.monthly 
      ? (subscription.currentSubscription.pricing.monthly * 12) - (subscription.currentSubscription.pricing.yearly || 0)
      : 0,
    currency: subscription.currentSubscription?.pricing?.currency || 'NPR',
    
    // Payment method
    paymentMethod: subscription.currentSubscription?.paymentMethod,
    hasPaymentMethod: !!subscription.currentSubscription?.paymentMethod,
    
    // Actions
    fetchBillingHistory: subscription.fetchBillingHistory,
    updatePaymentMethod: subscription.updatePaymentMethod,
  }
}
