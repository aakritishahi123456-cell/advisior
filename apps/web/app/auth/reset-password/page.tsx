'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 900))
      toast.success('Password updated. Please sign in.')
      router.push('/auth/login')
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
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Create a new password</h1>
          <p className="mt-2 text-sm text-gray-600">
            {token ? 'Reset token detected.' : 'Use the link from your email to reset securely.'}
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="form-label">New password</label>
              <input
                className="form-input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div>
              <label className="form-label">Confirm password</label>
              <input
                className="form-input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner mr-2" /> Updating…
                </span>
              ) : (
                'Update password'
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

