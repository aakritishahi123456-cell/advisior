'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      toast.success('If an account exists, a reset link has been sent.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-fintech-primary to-fintech-secondary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Secure password recovery. We’ll email you a reset link.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                For your security, we won’t confirm whether the email exists.
              </p>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner mr-2" /> Sending…
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

