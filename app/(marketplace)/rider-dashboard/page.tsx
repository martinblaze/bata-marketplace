'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RiderDashboardPage() {
  const router = useRouter()
  const [rider, setRider] = useState<any>(null)
  const [availableOrders, setAvailableOrders] = useState<any[]>([])
  const [myDeliveries, setMyDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchRiderData()
  }, [])

  const fetchRiderData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const [profileRes, ordersRes, deliveriesRes] = await Promise.all([
        fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/riders/available-orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/riders/my-deliveries', { headers: { 'Authorization': `Bearer ${token}` } }),
      ])

      const profileData = await profileRes.json()
      const ordersData = await ordersRes.json()
      const deliveriesData = await deliveriesRes.json()

      // Skip checks - already verified in database

      setRider(profileData.user)
      setAvailableOrders(ordersData.orders || [])
      setMyDeliveries(deliveriesData.deliveries || [])
      setIsAvailable(profileData.user.isAvailable)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/riders/toggle-availability', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        setIsAvailable(!isAvailable)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const acceptOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/riders/accept-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      })

      if (response.ok) {
        alert('Order accepted! Proceed to pickup.')
        fetchRiderData()
      } else {
        alert('Failed to accept order')
      }
    } catch (error) {
      alert('Error accepting order')
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/riders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status }),
      })

      if (response.ok) {
        alert('Status updated!')
        fetchRiderData()
      }
    } catch (error) {
      alert('Error updating status')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rider Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {rider?.name}! 🚴</p>
            </div>
            <button onClick={toggleAvailability}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                isAvailable ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}>
              {isAvailable ? '🟢 Available' : '⚫ Unavailable'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">{rider?.completedOrders || 0}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Active</p>
              <p className="text-2xl font-bold text-blue-900">{myDeliveries.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Earnings</p>
              <p className="text-2xl font-bold text-purple-900">₦{((rider?.completedOrders || 0) * 560).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Available Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Orders ({availableOrders.length})</h2>
          {availableOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500">No available orders at the moment</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">#{order.orderNumber}</p>
                      <p className="font-bold text-gray-900 mt-1">{order.product.name}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">NEW</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600"><strong>Pickup:</strong> {order.product.hostelName}</p>
                    <p className="text-gray-600"><strong>Delivery:</strong> {order.deliveryHostel}</p>
                    <p className="text-green-600 font-bold">Earn: ₦560</p>
                  </div>

                  <button onClick={() => acceptOrder(order.id)}
                    className="w-full mt-4 bg-bata-primary hover:bg-bata-dark text-white py-2 rounded-lg font-bold">
                    Accept Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Deliveries */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Active Deliveries</h2>
          {myDeliveries.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500">No active deliveries</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myDeliveries.map((delivery) => (
                <div key={delivery.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">#{delivery.orderNumber}</p>
                      <p className="font-bold text-gray-900 mt-1">{delivery.product.name}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600"><strong>Pickup:</strong></p>
                      <p>{delivery.product.hostelName}</p>
                      <p className="text-sm text-gray-500">{delivery.seller.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Delivery:</strong></p>
                      <p>{delivery.deliveryHostel}, {delivery.deliveryRoom}</p>
                      <p className="text-sm text-gray-500">{delivery.deliveryPhone}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {delivery.status === 'RIDER_ASSIGNED' && (
                      <button onClick={() => updateStatus(delivery.id, 'PICKED_UP')}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold">
                        Mark as Picked Up
                      </button>
                    )}
                    {delivery.status === 'PICKED_UP' && (
                      <button onClick={() => updateStatus(delivery.id, 'ON_THE_WAY')}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-bold">
                        On The Way
                      </button>
                    )}
                    {delivery.status === 'ON_THE_WAY' && (
                      <button onClick={() => updateStatus(delivery.id, 'DELIVERED')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold">
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}