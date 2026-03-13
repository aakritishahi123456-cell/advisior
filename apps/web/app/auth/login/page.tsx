'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/stores/authStore'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const isDev = process.env.NODE_ENV !== 'production'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await login(formData.email, formData.password)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (err: any) {
      // Error is already handled in the store
      toast.error(err.error || 'Login failed')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">FS</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-200">
          {isDev && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Demo credentials</p>
              <p className="text-sm text-blue-800 mt-1">
                Pro: <span className="font-mono">demo@finsathi.ai</span> / <span className="font-mono">demo1234</span>
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Free: <span className="font-mono">free@finsathi.ai</span> / <span className="font-mono">demo1234</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setFormData({ email: 'demo@finsathi.ai', password: 'demo1234' })}
                >
                  Use Pro demo
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setFormData({ email: 'free@finsathi.ai', password: 'demo1234' })}
                >
                  Use Free demo
                </button>
              </div>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Links */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
