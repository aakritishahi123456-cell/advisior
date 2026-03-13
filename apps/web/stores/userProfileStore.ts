import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { api, endpoints } from '../lib/apiClient'

interface UserProfileState {
  // State
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  preferences: UserPreferences
  settings: UserSettings
  
  // Actions
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  clearError: () => void
}

interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  bio?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface UserPreferences {
  language: 'en' | 'ne'
  timezone: string
  currency: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    marketing: boolean
    loanUpdates: boolean
    financialReports: boolean
    aiAnalysis: boolean
    systemUpdates: boolean
  }
}

interface UserSettings {
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends'
    showEmail: boolean
    showPhone: boolean
    showDateOfBirth: boolean
  }
  security: {
    twoFactorEnabled: boolean
    loginNotifications: boolean
    sessionTimeout: number
  }
  api: {
    rateLimitPerHour: number
    webhookUrl?: string
    apiKey?: string
  }
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  timezone: 'Asia/Kathmandu',
  currency: 'NPR',
  dateFormat: 'DD/MM/YYYY',
  notifications: {
    email: true,
    push: true,
    sms: false,
    marketing: false,
    loanUpdates: true,
    financialReports: true,
    aiAnalysis: true,
    systemUpdates: true,
  },
}

const defaultSettings: UserSettings = {
  privacy: {
    profileVisibility: 'private',
    showEmail: false,
    showPhone: false,
    showDateOfBirth: false,
  },
  security: {
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30,
  },
  api: {
    rateLimitPerHour: 1000,
  },
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      isLoading: false,
      error: null,
      preferences: defaultPreferences,
      settings: defaultSettings,

      // Fetch profile
      fetchProfile: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const [profileResponse, preferencesResponse, settingsResponse] = await Promise.all([
            api.get<UserProfile>(endpoints.profile.get),
            api.get<UserPreferences>(endpoints.profile.preferences),
            api.get<UserSettings>(endpoints.profile.settings),
          ])

          if (profileResponse.success && profileResponse.data) {
            set({
              profile: profileResponse.data,
              preferences: preferencesResponse.success && preferencesResponse.data 
                ? { ...defaultPreferences, ...preferencesResponse.data }
                : defaultPreferences,
              settings: settingsResponse.success && settingsResponse.data
                ? { ...defaultSettings, ...settingsResponse.data }
                : defaultSettings,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(profileResponse.error || 'Failed to fetch profile')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to fetch profile'
          })
          throw error
        }
      },

      // Update profile
      updateProfile: async (data: Partial<UserProfile>) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.patch<UserProfile>(endpoints.profile.update, data)
          
          if (response.success && response.data) {
            set({
              profile: response.data,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to update profile')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to update profile'
          })
          throw error
        }
      },

      // Update preferences
      updatePreferences: async (preferences: Partial<UserPreferences>) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.patch<UserPreferences>(endpoints.profile.preferences, preferences)
          
          if (response.success && response.data) {
            set({
              preferences: { ...get().preferences, ...response.data },
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to update preferences')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to update preferences'
          })
          throw error
        }
      },

      // Update settings
      updateSettings: async (settings: Partial<UserSettings>) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.patch<UserSettings>(endpoints.profile.settings, settings)
          
          if (response.success && response.data) {
            set({
              settings: { ...get().settings, ...response.data },
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to update settings')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to update settings'
          })
          throw error
        }
      },

      // Upload avatar
      uploadAvatar: async (file: File) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.upload<{ avatar: string }>(endpoints.profile.update, file)
          
          if (response.success && response.data) {
            set({
              profile: get().profile ? { ...get().profile, avatar: response.data.avatar } : null,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.error || 'Failed to upload avatar')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.error || 'Failed to upload avatar'
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
      name: 'user-profile-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        settings: state.settings,
      }),
    }
  )
)

// Selectors for common use cases
export const useUserProfile = () => {
  return useUserProfileStore(
    (store) => ({
      profile: store.profile,
      isLoading: store.isLoading,
      error: store.error,

      fullName:
        store.profile?.firstName && store.profile?.lastName
          ? `${store.profile.firstName} ${store.profile.lastName}`
          : store.profile?.firstName || store.profile?.email || '',
      initials:
        store.profile?.firstName && store.profile?.lastName
          ? `${store.profile.firstName[0]}${store.profile.lastName[0]}`.toUpperCase()
          : store.profile?.email?.substring(0, 2).toUpperCase() || '',
      hasAvatar: !!store.profile?.avatar,
      isComplete: !!(store.profile?.firstName && store.profile?.lastName),

      fetchProfile: store.fetchProfile,
      updateProfile: store.updateProfile,
      updatePreferences: store.updatePreferences,
      updateSettings: store.updateSettings,
      uploadAvatar: store.uploadAvatar,
      clearError: store.clearError,
    }),
    shallow
  )
}

// Hook for user preferences
export const useUserPreferences = () => {
  return useUserProfileStore(
    (store) => ({
      preferences: store.preferences,
      updatePreferences: store.updatePreferences,

      language: store.preferences.language,
      timezone: store.preferences.timezone,
      currency: store.preferences.currency,
      dateFormat: store.preferences.dateFormat,
      notifications: store.preferences.notifications,

      emailNotifications: store.preferences.notifications.email,
      pushNotifications: store.preferences.notifications.push,
      smsNotifications: store.preferences.notifications.sms,
      marketingNotifications: store.preferences.notifications.marketing,
    }),
    shallow
  )
}

// Hook for user settings
export const useUserSettings = () => {
  return useUserProfileStore(
    (store) => ({
      settings: store.settings,
      updateSettings: store.updateSettings,

      privacy: store.settings.privacy,
      profileVisibility: store.settings.privacy.profileVisibility,
      showEmail: store.settings.privacy.showEmail,
      showPhone: store.settings.privacy.showPhone,
      showDateOfBirth: store.settings.privacy.showDateOfBirth,

      security: store.settings.security,
      twoFactorEnabled: store.settings.security.twoFactorEnabled,
      loginNotifications: store.settings.security.loginNotifications,
      sessionTimeout: store.settings.security.sessionTimeout,

      api: store.settings.api,
      rateLimitPerHour: store.settings.api.rateLimitPerHour,
      webhookUrl: store.settings.api.webhookUrl,
      apiKey: store.settings.api.apiKey,
    }),
    shallow
  )
}

// Hook for profile completion
export const useProfileCompletion = () => {
  const profile = useUserProfileStore((s) => s.profile, shallow)

  const completionPercentage = profile
    ? {
        basicInfo: profile.firstName && profile.lastName ? 25 : 0,
        contact: profile.phone ? 25 : 0,
        bio: profile.bio ? 25 : 0,
        avatar: profile.avatar ? 25 : 0,
      }
    : { basicInfo: 0, contact: 0, bio: 0, avatar: 0 }

  const totalCompletion = Object.values(completionPercentage).reduce((sum, val) => sum + val, 0)

  return {
    completionPercentage,
    totalCompletion,
    isComplete: totalCompletion === 100,
    missingFields: Object.entries(completionPercentage)
      .filter(([_, value]) => value === 0)
      .map(([field]) => field),
  }
}
