'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SettingsProfilePage() {
  const [form, setForm] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
    phone: '+977-9800000000',
  })

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await new Promise((r) => setTimeout(r, 500))
    toast.success('Profile updated')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-gray-900">Profile settings</h2>
      <p className="text-sm text-gray-500 mt-1">Used for personalization and account recovery.</p>

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">First name</label>
            <input className="form-input" name="firstName" value={form.firstName} onChange={onChange} />
          </div>
          <div>
            <label className="form-label">Last name</label>
            <input className="form-input" name="lastName" value={form.lastName} onChange={onChange} />
          </div>
        </div>
        <div>
          <label className="form-label">Email</label>
          <input className="form-input" name="email" type="email" value={form.email} onChange={onChange} />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input className="form-input" name="phone" value={form.phone} onChange={onChange} />
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}

