'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const HOSTELS = [
  'Aroma',
  'Tempsite',
  'Express Gate',
  'Ifite',
  'Amansea',
  'Bus Stand (Inside School)',
  'School Hostel (Inside School)',
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    hostelName: '',
    roomNumber: '',
    landmark: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/marketplace')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-bata-primary to-bata-secondary rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h18v4H3V3zm0 6h18v12H3V9zm2 2v8h14v-8H5zm2 2h10v4H7v-4z"/>
              </svg>
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-bata-primary to-bata-secondary bg-clip-text text-transparent">
              BATA
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Help us deliver to you accurately</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hostel Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hostel / Location <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.hostelName}
                onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
              >
                <option value="">Select your hostel/location</option>
                {HOSTELS.map((hostel) => (
                  <option key={hostel} value={hostel}>
                    {hostel}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                placeholder="e.g., Room 12, Block A"
              />
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Landmark / Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                placeholder="e.g., Near the water dispenser, blue door"
              />
              <p className="text-xs text-gray-500 mt-1">
                Help riders find you easily
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bata-primary hover:bg-bata-dark text-white py-3.5 rounded-lg font-bold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>📍 Why we need this:</strong> Your location helps sellers and riders deliver items directly to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
