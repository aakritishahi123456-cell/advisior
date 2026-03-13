'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SettingsSecurityPage() {
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionAlerts, setSessionAlerts] = useState(true)

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 400))
    toast.success('Security settings saved')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-gray-900">Security</h2>
      <p className="text-sm text-gray-500 mt-1">Protect your account with extra verification and alerts.</p>

      <div className="mt-6 space-y-4">
        <div className="flex items-start justify-between gap-6 rounded-2xl border border-gray-200 p-4">
          <div>
            <p className="font-semibold text-gray-900">Two‑factor authentication (2FA)</p>
            <p className="text-sm text-gray-500 mt-1">Add an extra step to sign in.</p>
          </div>
          <button
            type="button"
            onClick={() => setTwoFactor((v) => !v)}
            className={`w-12 h-7 rounded-full transition-colors relative ${twoFactor ? 'bg-fintech-secondary' : 'bg-gray-200'}`}
            aria-pressed={twoFactor}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${twoFactor ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="flex items-start justify-between gap-6 rounded-2xl border border-gray-200 p-4">
          <div>
            <p className="font-semibold text-gray-900">New session alerts</p>
            <p className="text-sm text-gray-500 mt-1">Email notifications when a new device signs in.</p>
          </div>
          <button
            type="button"
            onClick={() => setSessionAlerts((v) => !v)}
            className={`w-12 h-7 rounded-full transition-colors relative ${sessionAlerts ? 'bg-fintech-secondary' : 'bg-gray-200'}`}
            aria-pressed={sessionAlerts}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${sessionAlerts ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      <div className="pt-4 mt-6 border-t border-gray-200 flex justify-end">
        <button className="btn btn-primary" onClick={handleSave}>
          Save security settings
        </button>
      </div>
    </div>
  )
}

