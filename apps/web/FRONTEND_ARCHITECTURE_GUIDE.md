# Frontend Architecture Guide for FinSathi AI

## Overview
This guide documents the comprehensive Next.js dashboard architecture for FinSathi AI, featuring a modern, scalable, and maintainable frontend application.

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **State Management**: Zustand
- **API Client**: Axios with interceptors
- **UI Framework**: Tailwind CSS
- **Icons**: Heroicons
- **Forms**: React Hook Form + Zod
- **Notifications**: React Hot Toast
- **Charts**: Recharts
- **Date Handling**: date-fns

### Design System
- **Grid System**: 12-column responsive grid
- **Spacing**: 8px base unit
- **Typography**: Inter font family
- **Colors**: Blue primary with semantic color palette
- **Components**: Reusable UI components with consistent styling

## Folder Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # Dashboard route group
│   │   ├── loan-calculator/
│   │   ├── companies/
│   │   ├── reports/
│   │   └── profile/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── providers.tsx            # App providers
├── components/                   # Reusable components
│   ├── common/                   # Shared components
│   ├── layout/                   # Layout components
│   ├── dashboard/               # Dashboard components
│   ├── loan/                     # Loan components
│   ├── companies/               # Company components
│   ├── reports/                 # Report components
│   └── profile/                 # Profile components
├── lib/                          # Utility libraries
│   ├── apiClient.ts             # API client with Axios
│   ├── utils.ts                  # Helper functions
│   └── constants.ts             # App constants
├── stores/                       # Zustand stores
│   ├── authStore.ts             # Authentication state
│   ├── userProfileStore.ts      # User profile state
│   └── subscriptionStore.ts     # Subscription state
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── styles/                       # Additional styles
├── public/                       # Static assets
└── package.json                  # Dependencies
```

## State Management Architecture

### Zustand Stores

#### 1. Auth Store (`stores/authStore.ts`)
```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<void>
}
```

**Features**:
- User authentication management
- Token persistence and refresh
- Profile updates
- Subscription management integration

#### 2. User Profile Store (`stores/userProfileStore.ts`)
```typescript
interface UserProfileState {
  profile: UserProfile | null
  preferences: UserPreferences
  settings: UserSettings
  isLoading: boolean
  error: string | null
  
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
}
```

**Features**:
- User profile management
- Preferences and settings
- Avatar upload
- Profile completion tracking

#### 3. Subscription Store (`stores/subscriptionStore.ts`)
```typescript
interface SubscriptionState {
  currentSubscription: Subscription | null
  availablePlans: SubscriptionPlan[]
  billingHistory: BillingHistoryEntry[]
  isLoading: boolean
  error: string | null
  
  fetchCurrentSubscription: () => Promise<void>
  fetchAvailablePlans: () => Promise<void>
  upgradePlan: (planId: string) => Promise<void>
  cancelSubscription: (reason?: string) => Promise<void>
}
```

**Features**:
- Subscription management
- Plan comparison and upgrades
- Billing history
- Feature access control

## API Client Architecture

### Axios Configuration (`lib/apiClient.ts`)
```typescript
class ApiClient {
  private client: AxiosInstance
  
  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    })
    
    this.setupInterceptors()
  }
  
  private setupInterceptors() {
    // Request interceptor - adds auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
    
    // Response interceptor - handles errors and logging
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    )
  }
}
```

**Features**:
- Automatic token management
- Request/response interceptors
- Error handling and logging
- Type-safe API responses
- File upload support

### API Endpoints
```typescript
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  loans: {
    list: '/loans',
    create: '/loans',
    simulate: '/loans/simulate',
    statistics: '/loans/statistics',
  },
  companies: {
    list: '/companies',
    create: '/companies',
    search: '/companies/search',
    bySymbol: (symbol: string) => `/companies/symbol/${symbol}`,
  },
  reports: {
    list: '/reports',
    create: '/reports',
    upload: '/reports/upload',
    parse: (id: string) => `/reports/${id}/parse`,
    analytics: '/reports/analytics',
  },
  // ... more endpoints
}
```

## UI Component Architecture

### Design System

#### Tailwind CSS Configuration
```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    }
  }
}
```

#### Custom CSS Classes (`app/globals.css`)
```css
/* Button Styles */
.btn {
  @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

/* Card Styles */
.card {
  @apply bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200;
}

/* Form Styles */
.form-input {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}

/* Dashboard Grid */
.dashboard-grid {
  @apply grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3;
}
```

### Component Hierarchy

#### 1. Layout Components
- **Layout**: Root dashboard layout with sidebar and header
- **Sidebar**: Navigation menu with user info
- **Header**: Top navigation with user menu and notifications

#### 2. Common Components
- **Button**: Reusable button with variants
- **Card**: Container component with consistent styling
- **Modal**: Overlay dialogs
- **Spinner**: Loading indicators
- **Badge**: Status indicators
- **ProFeatureGate**: Feature access control

#### 3. Feature Components
- **Dashboard**: Overview, metrics, quick actions
- **Loan Calculator**: EMI calculations, comparisons
- **Companies**: Browse, search, comparison
- **Reports**: Upload, list, analytics
- **Profile**: User settings, subscription management

## Page Architecture

### Authentication Pages
```typescript
// app/auth/login/page.tsx
export default function LoginPage() {
  const { login, isLoading, error } = useAuth()
  // Login form implementation
}

// app/auth/register/page.tsx
export default function RegisterPage() {
  const { register, isLoading, error } = useAuth()
  // Registration form implementation
}
```

### Dashboard Pages
```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated])
  
  // Dashboard content
}
```

### Feature Pages
```typescript
// app/dashboard/loan-calculator/page.tsx
export default function LoanCalculatorPage() {
  const { canAccessProFeatures } = usePermissions()
  
  return (
    <ProFeatureGate feature="Advanced loan calculations">
      <LoanCalculator />
    </ProFeatureGate>
  )
}
```

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Grid System
```css
/* 12-column grid system */
.grid {
  @apply grid grid-cols-12 gap-6;
}

/* Responsive columns */
.col-12 { @apply col-span-12; }
.col-6 { @apply col-span-6 lg:col-span-6; }
.col-4 { @apply col-span-4 lg:col-span-4 md:col-span-6 sm:col-span-12; }
.col-3 { @apply col-span-3 lg:col-span-3 md:col-span-6 sm:col-span-12; }
```

### Mobile-First Approach
```css
/* Base styles for mobile */
.component {
  @apply p-4 text-sm;
}

/* Tablet and up */
@media (min-width: 640px) {
  .component {
    @apply p-6 text-base;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    @apply p-8 text-lg;
  }
}
```

## Performance Optimizations

### 1. Code Splitting
```typescript
// Dynamic imports for heavy components
const LoanCalculator = dynamic(() => import('@/components/loan/LoanCalculator'), {
  loading: () => <div>Loading...</div>
})
```

### 2. Image Optimization
```typescript
// Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="FinSathi AI"
  width={120}
  height={120}
  priority
/>
```

### 3. Bundle Optimization
```javascript
// next.config.js
module.exports = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
```

## Security Features

### 1. Authentication
- JWT token management
- Automatic token refresh
- Secure token storage (localStorage)
- Route protection

### 2. Input Validation
- Zod schemas for form validation
- XSS protection
- CSRF protection

### 3. API Security
- Request interceptors for auth
- Error handling for sensitive data
- Request rate limiting

## Development Workflow

### 1. Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

### 2. Component Development
```typescript
// Component structure
interface ComponentProps {
  // Props definition
}

export function Component({ prop }: ComponentProps) {
  // Component implementation
  return (
    <div className="component-styles">
      {/* JSX content */}
    </div>
  )
}
```

### 3. State Management
```typescript
// Store pattern
export const useFeatureStore = create<FeatureState>()(
  persist(
    (set, get) => ({
      // State and actions
    }),
    {
      name: 'feature-storage',
      partialize: (state) => ({ /* partial state */ }),
    }
  )
)
```

## Testing Strategy

### 1. Unit Tests
```typescript
// Component testing
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/common/Button'

test('renders button with correct text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### 2. Integration Tests
```typescript
// Store testing
import { renderHook } from '@testing-library/react'
import { useAuthStore } from '@/stores/authStore'

test('login updates auth state', async () => {
  const { result } = renderHook(() => useAuthStore())
  
  await act(async () => {
    await result.current.login('test@example.com', 'password')
  })
  
  expect(result.current.isAuthenticated).toBe(true)
})
```

## Deployment

### 1. Build Process
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### 2. Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=FinSathi AI
```

### 3. Performance Monitoring
- Core Web Vitals tracking
- Error reporting
- Analytics integration

## Best Practices

### 1. Code Organization
- Feature-based folder structure
- Consistent naming conventions
- Type safety with TypeScript
- Reusable components

### 2. Performance
- Lazy loading for heavy components
- Image optimization
- Bundle size optimization
- Caching strategies

### 3. Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### 4. SEO
- Meta tags optimization
- Structured data
- Sitemap generation
- Page speed optimization

This architecture provides a solid foundation for building a scalable, maintainable, and performant dashboard application for FinSathi AI with modern React and Next.js best practices.
