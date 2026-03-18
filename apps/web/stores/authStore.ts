import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { api, User, Subscription, endpoints } from '../lib/apiClient'

const nowIso = () => new Date().toISOString()

const demoAccounts: Array<{ email: string; password: string; user: User; token: string; refreshToken: string }> = [
  {
    email: 'demo@finsathi.ai',
    password: 'demo1234',
    token: 'demo-token-pro',
    refreshToken: 'demo-refresh-pro',
    user: {
      id: 'demo-pro',
      email: 'demo@finsathi.ai',
      firstName: 'Demo',
      lastName: 'Pro',
      role: 'PRO',
      subscription: {
        id: 'sub-demo-pro',
        plan: 'PRO',
        status: 'ACTIVE',
        startDate: nowIso(),
        autoRenew: true,
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  },
  {
    email: 'free@finsathi.ai',
    password: 'demo1234',
    token: 'demo-token-free',
    refreshToken: 'demo-refresh-free',
    user: {
      id: 'demo-free',
      email: 'free@finsathi.ai',
      firstName: 'Demo',
      lastName: 'Free',
      role: 'FREE',
      subscription: {
        id: 'sub-demo-free',
        plan: 'FREE',
        status: 'ACTIVE',
        startDate: nowIso(),
        autoRenew: false,
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  },
]

interface AuthState {
  // State
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  clearError: () => void
  updateProfile: (userData: Partial<User>) => Promise<void>
  
  // Subscription actions
  upgradeSubscription: (plan: string) => Promise<void>
  cancelSubscription: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          // Demo login (dev only)
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            const match = demoAccounts.find(
              (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
            )
            if (match) {
              localStorage.setItem('auth_token', match.token)
              localStorage.setItem('refresh_token', match.refreshToken)
              api.setAuthToken(match.token)
              set({
                user: match.user,
                token: match.token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
              return
            }
          }

          const response = await api.post<{ user: User; token: string; refreshToken: string }>(
            endpoints.auth.login,
            { email, password }
          )

          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data
            
            // Store tokens
            localStorage.setItem('auth_token', token)
            localStorage.setItem('refresh_token', refreshToken)
            
            // Update API client with token
            api.setAuthToken(token)
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Login failed')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Login failed',
            isAuthenticated: false,
            user: null,
            token: null
          })
          throw error
        }
      },

      // Register action
      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<{ user: User; token: string; refreshToken: string }>(
            endpoints.auth.register,
            userData
          )

          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data
            
            // Store tokens
            localStorage.setItem('auth_token', token)
            localStorage.setItem('refresh_token', refreshToken)
            
            // Update API client with token
            api.setAuthToken(token)
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Registration failed')
          }
        } catch (error: any) {
          const normalizedError =
            Array.isArray(error?.error)
              ? error.error.map((issue: any) => issue?.message).filter(Boolean).join(', ')
              : error?.error

          set({
            isLoading: false,
            error: normalizedError || 'Registration failed',
            isAuthenticated: false,
            user: null,
            token: null
          })
          throw error
        }
      },

      // Logout action
      logout: () => {
        // Clear tokens
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        
        // Clear API client token
        api.clearAuthToken()
        
        // Reset state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      // Refresh token action
      refreshToken: async () => {
        const refreshToken = localStorage.getItem('refresh_token')
        
        if (!refreshToken) {
          get().logout()
          return
        }

        try {
          const response = await api.post<{ token: string; refreshToken: string }>(
            endpoints.auth.refresh,
            { refreshToken }
          )

          if (response.success && response.data) {
            const { token, refreshToken: newRefreshToken } = response.data
            
            // Update stored tokens
            localStorage.setItem('auth_token', token)
            localStorage.setItem('refresh_token', newRefreshToken)
            
            // Update API client
            api.setAuthToken(token)
            
            set({ token })
          } else {
            throw new Error('Token refresh failed')
          }
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },

      // Clear error action
      clearError: () => {
        set({ error: null })
      },

      // Update profile action
      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.patch<User>(endpoints.profile.update, userData)
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Profile update failed')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Profile update failed'
          })
          throw error
        }
      },

      // Upgrade subscription action
      upgradeSubscription: async (plan: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<Subscription>(endpoints.subscriptions.upgrade, { plan })
          
          if (response.success && response.data) {
            set({
              user: get().user ? { ...get().user, subscription: response.data } : null,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Subscription upgrade failed')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Subscription upgrade failed'
          })
          throw error
        }
      },

      // Cancel subscription action
      cancelSubscription: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post<Subscription>(endpoints.subscriptions.cancel)
          
          if (response.success && response.data) {
            set({
              user: get().user ? { ...get().user, subscription: response.data } : null,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Subscription cancellation failed')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Subscription cancellation failed'
          })
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore token to API client on rehydration
        if (state?.token) {
          api.setAuthToken(state.token)
        }
      },
    }
  )
)

// Selectors for common use cases
export const useAuth = () => {
  return useAuthStore(
    (auth) => ({
      // User info
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      error: auth.error,

      // User properties
      isPro: auth.user?.subscription?.plan === 'PRO',
      isFree: auth.user?.subscription?.plan === 'FREE' || !auth.user?.subscription,
      userName: auth.user?.firstName || auth.user?.email,
      userRole: auth.user?.role,

      // Actions
      login: auth.login,
      register: auth.register,
      logout: auth.logout,
      refreshToken: auth.refreshToken,
      clearError: auth.clearError,
      updateProfile: auth.updateProfile,
      upgradeSubscription: auth.upgradeSubscription,
      cancelSubscription: auth.cancelSubscription,
    }),
    shallow
  )
}

// Hook for checking if user has specific permissions
export const usePermissions = () => {
  const { user, isPro, isFree } = useAuth()
  
  return {
    canAccessProFeatures: isPro,
    canAccessBasicFeatures: true, // All authenticated users can access basic features
    canAccessAdminFeatures: user?.role === 'ADMIN',
    canManageSubscription: isFree,
    canViewReports: true,
    canUseAIAnalysis: isPro,
    canCreateReports: true,
    canExportData: isPro,
  }
}

// Hook for subscription status
export const useSubscription = () => {
  return useAuthStore(
    (auth) => ({
      subscription: auth.user?.subscription,
      plan: auth.user?.subscription?.plan || 'FREE',
      status: auth.user?.subscription?.status || 'INACTIVE',
      isActive: auth.user?.subscription?.status === 'ACTIVE',
      isPro: auth.user?.subscription?.plan === 'PRO',
      isFree: auth.user?.subscription?.plan === 'FREE' || !auth.user?.subscription,
      endDate: auth.user?.subscription?.endDate,
      autoRenew: auth.user?.subscription?.autoRenew,
      upgrade: auth.upgradeSubscription,
      cancel: auth.cancelSubscription,
    }),
    shallow
  )
}

// Hook for authentication state
export const useAuthState = () => {
  return useAuthStore(
    (auth) => ({
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      error: auth.error,
      clearError: auth.clearError,
      refresh: auth.refreshToken,
    }),
    shallow
  )
}
