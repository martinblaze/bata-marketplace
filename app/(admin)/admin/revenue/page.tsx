// app/(admin)/admin/revenue/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Users, Package } from 'lucide-react'

export default function RevenuePage() {
  const [revenue, setRevenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenue()
  }, [])

  const fetchRevenue = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/revenue', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setRevenue(data.revenue)
      }
    } catch (error) {
      console.error('Failed to fetch revenue:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-sm opacity-90">Total Revenue</span>
          </div>
          <p className="text-4xl font-bold mb-2">₦{(revenue?.total || 0).toLocaleString()}</p>
          <p className="text-sm opacity-75">All time earnings</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm opacity-90">This Month</span>
          </div>
          <p className="text-4xl font-bold mb-2">₦{(revenue?.thisMonth || 0).toLocaleString()}</p>
          <p className="text-sm opacity-75">Current month revenue</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-sm opacity-90">Platform Fee (5%)</span>
          </div>
          <p className="text-4xl font-bold mb-2">₦{(revenue?.platformFee || 0).toLocaleString()}</p>
          <p className="text-sm opacity-75">Total collected fees</p>
        </div>
      </div>

      {/* Top Sellers */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Top Sellers by Revenue</h2>
        <div className="space-y-4">
          {revenue?.topSellers?.map((seller: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                  #{index + 1}
                </div>
                <div>
                  <p className="text-white font-semibold">{seller.name}</p>
                  <p className="text-sm text-gray-400">{seller.totalOrders} orders</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-400">
                  ₦{seller.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Total sales</p>
              </div>
            </div>
          )) || <p className="text-gray-400 text-center py-4">No data available</p>}
        </div>
      </div>
    </div>
  )
}