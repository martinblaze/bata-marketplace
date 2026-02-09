'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RiderSignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [idDocument, setIdDocument] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setIdDocument(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/\d/.test(formData.password)) {
      setError('Password must contain at least one number')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!idDocument) {
      setError('Please upload your ID document')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/riders/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          idDocument,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Registration successful! Your account is pending verification.')
        router.push('/login')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-bata-primary to-bata-secondary rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h18v4H3V3zm0 6h18v12H3V9zm2 2v8h14v-8H5zm2 2h10v4H7v-4z"/>
              </svg>
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-bata-primary to-bata-secondary bg-clip-text text-transparent">BATA</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Rider</h1>
          <p className="text-gray-600">Earn ₦560 per delivery!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="Enter your full name" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="08012345678" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Optional)</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="Enter password" />
              <p className="text-xs text-gray-500 mt-1">Min 8 characters, must include a number</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="Confirm password" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID Document <span className="text-red-500">*</span></label>
              <div className="space-y-4">
                {idDocument && (
                  <div className="relative">
                    <img src={idDocument} alt="ID Document" className="w-full h-48 object-cover rounded-lg" />
                    <button type="button" onClick={() => setIdDocument('')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                      ×
                    </button>
                  </div>
                )}

                {!idDocument && (
                  <label className="block">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-bata-primary transition-colors">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-gray-600 font-medium">Upload Student ID or Valid ID</p>
                      <p className="text-sm text-gray-500 mt-1">Required for verification</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-bata-primary hover:bg-bata-dark text-white py-3.5 rounded-lg font-bold text-lg disabled:opacity-50">
              {loading ? 'Registering...' : 'Register as Rider'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">Already a rider? <Link href="/login" className="text-bata-primary font-semibold hover:underline">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}