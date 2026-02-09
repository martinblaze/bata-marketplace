// app/(marketplace)/orders/page.tsx - COMPLETE UPDATED VERSION
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star } from 'lucide-react'

interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Review {
  id: string;
  type: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface Seller {
  id: string;
  name: string;
  profilePhoto: string | null;
  email: string;
  phone: string;
  avgRating: number;
  trustLevel: string;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
}

interface Rider {
  id: string;
  name: string;
  phone: string | null;
}

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number;
  quantity?: number;
  deliveryAddress: string;
  createdAt: string;
  completedAt?: string;
  isPaid?: boolean;
  seller: Seller;
  product: Product;
  rider?: Rider;
  reviews?: Review[];
  productReviews?: ProductReview[];
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    } else {
      setCheckingAuth(false)
      fetchOrders()
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) {
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelivery = async (orderId: string) => {
    if (!confirm('Confirm you received the product? This will release payment to seller and rider.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/orders/confirm-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message || 'Payment released! Thank you! 🎉')
        fetchOrders() // Refresh orders
      } else {
        alert(result.error || 'Failed to confirm delivery')
      }
    } catch (error) {
      alert('Error confirming delivery')
      console.error(error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-orange-100 text-orange-800'
      case 'SHIPPED': return 'bg-blue-100 text-blue-800'
      case 'RIDER_ASSIGNED': return 'bg-indigo-100 text-indigo-800'
      case 'PICKED_UP': return 'bg-purple-100 text-purple-800'
      case 'ON_THE_WAY': return 'bg-pink-100 text-pink-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'DISPUTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatusText = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Check if order can be reviewed
  const canReviewOrder = (order: Order) => {
    return order.status === 'DELIVERED' || order.status === 'COMPLETED'
  }

  // Check if product has been reviewed
  const hasReviewedProduct = (order: Order) => {
    return order.productReviews && order.productReviews.length > 0
  }

  // Check if seller has been reviewed
  const hasReviewedSeller = (order: Order) => {
    return order.reviews && order.reviews.some((r: Review) => r.type === 'SELLER')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start shopping on BATA marketplace!</p>
            <Link href="/marketplace" className="inline-block bg-bata-primary hover:bg-bata-dark text-white px-8 py-3 rounded-lg font-bold">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order #{order.orderNumber || order.id.slice(-8)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {formatStatusText(order.status)}
                  </span>
                </div>

                <div className="flex gap-4">
                  <img
                    src={order.product?.images?.[0] || '/placeholder.png'}
                    alt={order.product?.name || 'Product'}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{order.product?.name || 'Product'}</h3>
                    <p className="text-sm text-gray-600">
                      Seller: {order.seller?.name || 'Seller'}
                      {order.seller?.avgRating > 0 && (
                        <span className="ml-2 inline-flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 mr-1" />
                          {order.seller.avgRating.toFixed(1)}
                        </span>
                      )}
                    </p>
                    <p className="text-lg font-bold text-bata-primary mt-2">
                      ₦{order.totalAmount?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantity: {order.quantity || 1}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>Delivery:</strong> {order.deliveryAddress || 'Not specified'}
                  </p>
                  {order.rider && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Rider:</strong> {order.rider.name} ({order.rider.phone || 'No phone'})
                    </p>
                  )}
                </div>

                {/* Review Status */}
                {canReviewOrder(order) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Review Status
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${hasReviewedProduct(order)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {hasReviewedProduct(order) ? 'Product Reviewed ✓' : 'Product Not Reviewed'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${hasReviewedSeller(order)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {hasReviewedSeller(order) ? 'Seller Reviewed ✓' : 'Seller Not Reviewed'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {/* View Details Button */}
                  <button
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors min-w-[140px]"
                  >
                    View Details
                  </button>

                  {/* Review Product Button */}
                  {canReviewOrder(order) && !hasReviewedProduct(order) && (
                    <button
                      onClick={() => router.push(`/orders/${order.id}/review-product`)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-w-[160px]"
                    >
                      <Star className="w-4 h-4" />
                      Review Product
                    </button>
                  )}

                  {/* Review Seller Button */}
                  {canReviewOrder(order) && hasReviewedProduct(order) && !hasReviewedSeller(order) && (
                    <button
                      onClick={() => router.push(`/orders/${order.id}/review-seller`)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-w-[160px]"
                    >
                      <Star className="w-4 h-4" />
                      Review Seller
                    </button>
                  )}

                  {/* Confirm Delivery Button - FIXED CONDITION */}
                  {order.status === 'DELIVERED' && (
                    <button
                      onClick={() => confirmDelivery(order.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-bold transition-colors min-w-[160px]"
                    >
                      ✅ Confirm Received & Pay
                    </button>
                  )}

                  {/* Already Reviewed Status */}
                  {canReviewOrder(order) && hasReviewedProduct(order) && hasReviewedSeller(order) && (
                    <button
                      className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg font-medium cursor-default min-w-[140px]"
                      disabled
                    >
                      ✓ All Reviews Submitted
                    </button>
                  )}

                  {/* Order Completed Status */}
                  {order.status === 'COMPLETED' && (
                    <button
                      className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg font-medium cursor-default min-w-[140px]"
                      disabled
                    >
                      ✓ Order Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}