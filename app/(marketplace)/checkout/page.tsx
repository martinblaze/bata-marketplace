// app/(marketplace)/checkout/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Check for cart items
    const cartData = sessionStorage.getItem('checkout_cart')
    if (cartData) {
      setCartItems(JSON.parse(cartData))
    } else {
      // Check for single product (old flow)
      const productData = sessionStorage.getItem('checkout_product')
      if (productData) {
        const product = JSON.parse(productData)
        setCartItems([{
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.images[0],
          sellerId: product.sellerId,
          sellerName: product.seller.name
        }])
      } else {
        router.push('/marketplace')
        return
      }
    }

    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handlePayment = async () => {
    if (!user?.hostelName) {
      alert('Please complete your profile first!')
      router.push('/profile/setup')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')

      // Initialize payment with cart items
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems: cartItems,
          deliveryFee: 800
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Development mode: Order created directly
        if (data.orderId) {
          sessionStorage.removeItem('checkout_product')
          sessionStorage.removeItem('checkout_cart')
          alert('🎉 Order placed successfully!')
          router.push('/orders')
        }
        // Production mode: Redirect to Paystack
        else if (data.authorization_url) {
          window.location.href = data.authorization_url
        }
      } else {
        setError(data.error || 'Payment failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0 || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent"></div>
      </div>
    )
  }

  const deliveryFee = 800
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalAmount = subtotal + deliveryFee
  const platformFee = (subtotal * 0.05) + 240 // 5% + ₦240
  const riderAmount = 560
  const sellerAmount = subtotal * 0.95 // 95%

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/cart" className="text-bata-primary hover:underline mb-6 inline-block">
          ← Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">by {item.sellerName}</p>
                    <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                    <p className="text-sm font-bold text-bata-primary mt-1">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold">₦{deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span>
                <span className="text-bata-primary">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Money breakdown info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">💰 Payment Breakdown</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Seller gets: ₦{sellerAmount.toLocaleString()} (95%)</li>
                <li>• Rider gets: ₦{riderAmount.toLocaleString()}</li>
                <li>• Platform: ₦{platformFee.toLocaleString()} (5% + ₦240)</li>
              </ul>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-semibold">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-semibold">{user.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Location</p>
                <p className="font-semibold">{user.hostelName}</p>
                <p className="text-sm text-gray-600 mt-1">Room {user.roomNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Landmark</p>
                <p className="text-gray-700">{user.landmark}</p>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/profile/setup" className="text-sm text-bata-primary hover:underline">
                Update delivery address →
              </Link>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 mt-8">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            Secure Escrow Payment
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Your payment is held securely in escrow</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Seller gets paid only after you confirm delivery</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Rider will pick up and deliver within hours</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>You can rate both seller and rider after delivery</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mt-6">
            {error}
          </div>
        )}

        {/* Place Order Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-gradient-to-r from-bata-primary to-green-600 hover:from-bata-dark hover:to-green-700 text-white py-5 rounded-xl font-bold text-xl mt-8 transition-all shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Processing...
            </span>
          ) : (
            `🔒 Pay Securely - ₦${totalAmount.toLocaleString()}`
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          By clicking "Pay Securely", you agree to BATA's Terms of Service
        </p>
      </div>
    </div>
  )
}