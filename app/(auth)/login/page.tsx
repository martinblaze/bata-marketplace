'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: method === 'phone' ? phone : undefined,
          email: method === 'email' ? email : undefined,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userName', data.user.name)
        window.dispatchEvent(new Event('auth-change'))
        router.push('/marketplace')
      } else {
        setError(data.error || 'Login failed')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to your BATA account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Login With</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setMethod('phone')}
                  className={`py-3 px-4 rounded-lg font-semibold ${method === 'phone' ? 'bg-bata-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                  📱 Phone
                </button>
                <button type="button" onClick={() => setMethod('email')}
                  className={`py-3 px-4 rounded-lg font-semibold ${method === 'email' ? 'bg-bata-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                  📧 Email
                </button>
              </div>
            </div>

            {method === 'phone' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="08012345678" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="you@example.com" />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="Enter password" />
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-bata-primary hover:underline font-semibold">
                Forgot Password?
              </Link>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-bata-primary hover:bg-bata-dark text-white py-3.5 rounded-lg font-bold text-lg disabled:opacity-50">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">Don't have an account? <Link href="/signup" className="text-bata-primary font-semibold hover:underline">Sign Up</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}