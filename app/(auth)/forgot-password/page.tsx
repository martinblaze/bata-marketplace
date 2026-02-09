'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Enter contact, 2: Verify OTP, 3: New password
  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters'
    if (!/\d/.test(pwd)) return 'Password must contain at least one number'
    return ''
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: method === 'phone' ? phone : undefined,
          email: method === 'email' ? email : undefined,
          isLogin: true,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setStep(2)
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleVerifyOTP = () => {
    if (otp.join('').length !== 6) {
      setError('Enter complete OTP')
      return
    }
    setStep(3)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: method === 'phone' ? phone : undefined,
          email: method === 'email' ? email : undefined,
          otpCode: otp.join(''),
          newPassword: password,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Password reset successful! You can now login.')
        router.push('/login')
      } else {
        setError(data.error || 'Failed to reset password')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Step {step} of 3</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Reset Via</label>
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

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

              <button type="submit" disabled={loading} className="w-full bg-bata-primary hover:bg-bata-dark text-white py-3.5 rounded-lg font-bold text-lg disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">Enter 6-Digit Code</label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" />
                  ))}
                </div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <button onClick={handleVerifyOTP} className="w-full bg-bata-primary hover:bg-bata-dark text-white py-3.5 rounded-lg font-bold text-lg">
                Verify Code
              </button>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 text-center"><strong>Dev:</strong> Check terminal for OTP</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="Enter new password" />
                <p className="text-xs text-gray-500 mt-1">Min 8 characters, must include a number</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none" placeholder="Confirm new password" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-bata-primary hover:bg-bata-dark text-white py-3.5 rounded-lg font-bold text-lg disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-bata-primary">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}