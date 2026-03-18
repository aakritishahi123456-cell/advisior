import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiError {
  success: false
  error: string
  details?: any
  code?: string
}

// API Client Class
class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor(baseURL: string = ApiClient.resolveBaseURL()) {
    this.baseURL = baseURL
    this.client = axios.create({
      baseURL: ApiClient.buildApiBaseURL(this.baseURL),
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private static resolveBaseURL(): string {
    const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '')
    const isProduction = process.env.NODE_ENV === 'production'
    const isLocalhost =
      configured.includes('localhost') || configured.includes('127.0.0.1')

    if (isProduction) {
      return ''
    }

    if (configured && (!isProduction || !isLocalhost)) {
      return configured
    }

    return 'http://localhost:3001'
  }

  private static buildApiBaseURL(baseURL: string): string {
    return baseURL ? `${baseURL}/api/v1` : '/api/v1'
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this._getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request timestamp
        config.metadata = { startTime: new Date() }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const endTime = new Date()
        const duration = endTime.getTime() - response.config.metadata?.startTime?.getTime()

        // Log request duration in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
        }

        return response
      },
      (error) => {
        // Handle different error types
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response
          
          switch (status) {
            case 401:
              // Unauthorized - clear token and redirect to login
              this.clearAuthToken()
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/login'
              }
              break
            case 403:
              // Forbidden - insufficient permissions
              console.error('Access forbidden:', data.error)
              break
            case 404:
              // Not found
              console.error('Resource not found:', data.error)
              break
            case 429:
              // Rate limited
              console.error('Rate limit exceeded:', data.error)
              break
            case 500:
              // Server error
              console.error('Server error:', data.error)
              break
            default:
              console.error('API error:', data.error)
          }
        } else if (error.request) {
          // Network error
          console.error('Network error:', error.message)
        } else {
          // Other error
          console.error('Request error:', error.message)
        }

        return Promise.reject(error)
      }
    )
  }

  // Auth token management
  private _getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private _setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  private _clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // File upload
  async upload<T = any>(url: string, file: File, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await this.client.post<ApiResponse<T>>(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Error handling
  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error
      const responseData = error.response.data

      if (typeof responseData === 'string') {
        return {
          success: false,
          error:
            error.response.status === 404
              ? 'API route not found. Check the deployed backend URL.'
              : 'The server returned an invalid response.',
          code: `HTTP_${error.response.status}`,
          details: responseData,
        }
      }

      if (responseData?.error) {
        return responseData as ApiError
      }

      if (responseData?.message) {
        return {
          success: false,
          error: responseData.message,
          code: `HTTP_${error.response.status}`,
          details: responseData,
        }
      }

      return {
        success: false,
        error: `Request failed with status ${error.response.status}.`,
        code: `HTTP_${error.response.status}`,
        details: responseData,
      }
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      }
    } else {
      // Other error
      return {
        success: false,
        error: error.message || 'An unexpected error occurred.',
        code: 'UNKNOWN_ERROR'
      }
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health')
      return true
    } catch (error) {
      return false
    }
  }

  // Set auth token (for login)
  setAuthToken(token: string): void {
    this._setAuthToken(token)
  }

  // Clear auth token (for logout)
  clearAuthToken(): void {
    this._clearAuthToken()
  }

  // Get base URL
  getBaseURL(): string {
    return this.baseURL
  }
}

// Create singleton instance
const apiClient = new ApiClient()

export default apiClient

// Export individual methods for convenience
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config),
  upload: <T = any>(url: string, file: File, config?: AxiosRequestConfig) => apiClient.upload<T>(url, file, config),
  healthCheck: () => apiClient.healthCheck(),
  setAuthToken: (token: string) => apiClient.setAuthToken(token),
  clearAuthToken: () => apiClient.clearAuthToken(),
  getBaseURL: () => apiClient.getBaseURL(),
}

// API Endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  // Loans
  loans: {
    list: '/loans',
    create: '/loans',
    simulate: '/loans/simulate',
    statistics: '/loans/statistics',
    byId: (id: string) => `/loans/${id}`,
    update: (id: string) => `/loans/${id}`,
    delete: (id: string) => `/loans/${id}`,
  },
  // Companies
  companies: {
    list: '/companies',
    create: '/companies',
    byId: (id: string) => `/companies/${id}`,
    update: (id: string) => `/companies/${id}`,
    delete: (id: string) => `/companies/${id}`,
    search: '/companies/search',
    bySymbol: (symbol: string) => `/companies/symbol/${symbol}`,
  },
  // Financial Reports
  reports: {
    list: '/reports',
    create: '/reports',
    upload: '/reports/upload',
    byId: (id: string) => `/reports/${id}`,
    update: (id: string) => `/reports/${id}`,
    delete: (id: string) => `/reports/${id}`,
    parse: (id: string) => `/reports/${id}/parse`,
    analytics: '/reports/analytics',
  },
  // User Profile
  profile: {
    get: '/profile',
    update: '/profile',
    settings: '/profile/settings',
    preferences: '/profile/preferences',
    subscription: '/profile/subscription',
  },
  // Subscriptions
  subscriptions: {
    plans: '/subscriptions/plans',
    current: '/subscriptions/current',
    upgrade: '/subscriptions/upgrade',
    downgrade: '/subscriptions/downgrade',
    cancel: '/subscriptions/cancel',
    history: '/subscriptions/history',
    reactivate: '/subscriptions/reactivate',
    updatePayment: '/subscriptions/update-payment',
  },
  // AI Analysis
  ai: {
    analyze: '/ai/analyze',
    reports: '/ai/reports',
    insights: '/ai/insights',
    recommendations: '/ai/recommendations',
  },
  // Notifications
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    preferences: '/notifications/preferences',
  },
  // Dashboard
  dashboard: {
    overview: '/dashboard/overview',
    metrics: '/dashboard/metrics',
    activity: '/dashboard/activity',
    summary: '/dashboard/summary',
  },
}

// Types for common API responses
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'FREE' | 'PRO'
  subscription?: Subscription
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  plan: 'FREE' | 'PRO'
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED'
  startDate: string
  endDate?: string
  autoRenew: boolean
}

export interface Company {
  id: string
  name: string
  symbol: string
  sector: string
  createdAt: string
  updatedAt: string
}

export interface Loan {
  id: string
  principal: number
  interestRate: number
  tenure: number
  emi: number
  totalPayment: number
  type: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface FinancialReport {
  id: string
  title: string
  reportType: string
  year?: number
  content?: string
  fileUrl?: string
  parsedData?: any
  createdAt: string
  updatedAt: string
}

export interface DashboardMetrics {
  totalLoans: number
  totalAmount: number
  activeReports: number
  subscriptionStatus: string
  recentActivity: any[]
}
