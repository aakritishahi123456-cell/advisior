'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SettingsNotificationsPage() {
  const [prefs, setPrefs] = useState({
    marketSignals: true,
    priceAlerts: true,
    loanRateAlerts: false,
    weeklyDigest: true,
    productUpdates: true,
  })

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 400))
    toast.success('Notification preferences saved')
  }

  const Row = ({
    title,
    description,
    keyName,
  }: {
    title: string
    description: string
    keyName: keyof typeof prefs
  }) => (
    <div className="flex items-start justify-between gap-6 py-4">
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => toggle(keyName)}
        className={`w-12 h-7 rounded-full transition-colors relative ${prefs[keyName] ? 'bg-fintech-secondary' : 'bg-gray-200'}`}
        aria-pressed={prefs[keyName]}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
            prefs[keyName] ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-gray-900">Notification settings</h2>
      <p className="text-sm text-gray-500 mt-1">Control what FinSathi notifies you about.</p>

      <div className="mt-6 divide-y divide-gray-200">
        <Row title="Market signals" description="BUY/HOLD/SELL alerts with reasoning." keyName="marketSignals" />
        <Row title="Price alerts" description="Get notified when tracked stocks cross thresholds." keyName="priceAlerts" />
        <Row title="Loan rate alerts" description="Watch changes in loan interest rate ranges." keyName="loanRateAlerts" />
        <Row title="Weekly digest" description="Summary of performance, insights, and upcoming events." keyName="weeklyDigest" />
        <Row title="Product updates" description="New features and platform improvements." keyName="productUpdates" />
      </div>

      <div className="pt-4 mt-4 border-t border-gray-200 flex justify-end">
        <button className="btn btn-primary" onClick={handleSave}>
          Save preferences
        </button>
      </div>
    </div>
  )
}

