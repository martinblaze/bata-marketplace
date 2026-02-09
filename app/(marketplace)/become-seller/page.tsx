// app/(marketplace)/become-seller/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BecomeSellerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    } else {
      setCheckingAuth(false)
    }
  }, [])

  const handleBecomeSeller = async () => {
    if (!confirm('Are you sure you want to become a seller? This will allow you to list products for sale.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/become-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        // Update localStorage
        localStorage.setItem('userRole', 'SELLER')
        // Trigger auth change for navbar
        window.dispatchEvent(new Event('auth-change'))
        alert('🎉 You are now a seller! You can now list products for sale.')
        router.push('/sell')
      } else {
        setError(data.error || 'Failed to become seller')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-bata-primary hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Seller</h1>
          <p className="text-gray-600 mb-8">Start selling your products to thousands of students on campus</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 text-lg mb-4">✨ Seller Benefits</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Earn Money:</strong> Turn unused items into cash</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Secure Payments:</strong> Escrow system protects your earnings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Built-in Delivery:</strong> Rider network handles logistics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Trust System:</strong> Build reputation with ratings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>No Listing Fees:</strong> Completely free to list products</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-bold text-yellow-900 text-lg mb-4">📋 Seller Requirements</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• You must be a verified student</li>
                <li>• Products must comply with campus policies</li>
                <li>• You need to complete your profile with delivery address</li>
                <li>• You're responsible for accurate product descriptions</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-green-900 text-lg mb-4">💸 How It Works</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                  <p className="font-medium">List Your Product</p>
                  <p className="text-sm text-gray-600 mt-1">Add photos, description, price</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                  <p className="font-medium">Buyer Orders</p>
                  <p className="text-sm text-gray-600 mt-1">Payment held in escrow</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                  <p className="font-medium">Get Paid</p>
                  <p className="text-sm text-gray-600 mt-1">Receive payment after delivery</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <button
                onClick={handleBecomeSeller}
                disabled={loading}
                className="w-full bg-gradient-to-r from-bata-primary to-bata-secondary hover:from-bata-dark hover:to-bata-dark text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Processing...' : '🎉 Become a Seller Now!'}
              </button>
              
              <p className="text-center text-gray-500 text-sm mt-4">
                By becoming a seller, you agree to our{' '}
                <Link href="/terms/sellers" className="text-bata-primary hover:underline">
                  Seller Terms & Conditions
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}