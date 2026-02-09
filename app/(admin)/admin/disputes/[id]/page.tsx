// app/(admin)/admin/disputes/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, User, Package, DollarSign, MessageSquare } from 'lucide-react'

export default function DisputeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const disputeId = params.id as string

  const [dispute, setDispute] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [resolution, setResolution] = useState({
    status: 'RESOLVED_BUYER_FAVOR',
    resolution: '',
    refundAmount: 0,
    penalizeBuyer: false,
    penalizeSeller: false,
    penaltyReason: ''
  })

  useEffect(() => {
    fetchDispute()
  }, [])

  const fetchDispute = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/disputes/${disputeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDispute(data.dispute)
        setResolution(prev => ({
          ...prev,
          refundAmount: data.dispute.order.totalAmount
        }))
      }
    } catch (error) {
      console.error('Failed to fetch dispute:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!resolution.resolution.trim()) {
      alert('Please provide a resolution explanation')
      return
    }

    setResolving(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolution)
      })

      if (response.ok) {
        alert('Dispute resolved successfully')
        router.push('/admin/disputes')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to resolve dispute')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Dispute not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Dispute Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-500/10 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dispute #{dispute.id.slice(0, 8)}</h1>
            <p className="text-gray-400">Order #{dispute.order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 bg-gray-700/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-400" />
              <p className="text-gray-400 text-sm">Buyer</p>
            </div>
            <p className="text-white font-semibold">{dispute.buyer.name}</p>
            <p className="text-gray-400 text-sm">{dispute.buyer.email}</p>
          </div>

          <div className="p-4 bg-gray-700/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-green-400" />
              <p className="text-gray-400 text-sm">Seller</p>
            </div>
            <p className="text-white font-semibold">{dispute.seller.name}</p>
            <p className="text-gray-400 text-sm">{dispute.seller.email}</p>
          </div>

          <div className="p-4 bg-gray-700/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <p className="text-gray-400 text-sm">Order Amount</p>
            </div>
            <p className="text-white font-semibold text-xl">
              ₦{dispute.order.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-700/30 rounded-xl">
          <p className="text-gray-400 text-sm mb-2">Reason for Dispute:</p>
          <p className="text-white">{dispute.reason}</p>
        </div>
      </div>

      {/* Resolution Form */}
      {dispute.status === 'PENDING' || dispute.status === 'UNDER_REVIEW' ? (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Resolve Dispute</h2>

          <div className="space-y-6">
            {/* Resolution Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resolution Decision
              </label>
              <select
                value={resolution.status}
                onChange={(e) => setResolution({ ...resolution, status: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="RESOLVED_BUYER_FAVOR">Favor Buyer (Issue Refund)</option>
                <option value="RESOLVED_SELLER_FAVOR">Favor Seller (No Refund)</option>
                <option value="RESOLVED_COMPROMISE">Compromise (Partial Refund)</option>
                <option value="DISMISSED">Dismiss (No Action)</option>
              </select>
            </div>

            {/* Refund Amount */}
            {(resolution.status === 'RESOLVED_BUYER_FAVOR' || resolution.status === 'RESOLVED_COMPROMISE') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Refund Amount (₦)
                </label>
                <input
                  type="number"
                  value={resolution.refundAmount}
                  onChange={(e) => setResolution({ ...resolution, refundAmount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  max={dispute.order.totalAmount}
                />
              </div>
            )}

            {/* Resolution Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resolution Explanation *
              </label>
              <textarea
                value={resolution.resolution}
                onChange={(e) => setResolution({ ...resolution, resolution: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 min-h-32"
                placeholder="Explain your decision and reasoning..."
                required
              />
            </div>

            {/* Penalties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700/30 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resolution.penalizeBuyer}
                    onChange={(e) => setResolution({ ...resolution, penalizeBuyer: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-white font-medium">Penalize Buyer</span>
                </label>
              </div>

              <div className="p-4 bg-gray-700/30 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resolution.penalizeSeller}
                    onChange={(e) => setResolution({ ...resolution, penalizeSeller: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-white font-medium">Penalize Seller</span>
                </label>
              </div>
            </div>

            {(resolution.penalizeBuyer || resolution.penalizeSeller) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Penalty Reason
                </label>
                <input
                  type="text"
                  value={resolution.penaltyReason}
                  onChange={(e) => setResolution({ ...resolution, penaltyReason: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Reason for penalty..."
                />
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                disabled={resolving}
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
              >
                {resolving ? 'Resolving...' : 'Submit Resolution'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Resolution</h2>
          <p className="text-gray-400 mb-2">Status: <span className="text-white font-semibold">{dispute.status}</span></p>
          <p className="text-gray-400">Resolution: <span className="text-white">{dispute.resolution}</span></p>
          {dispute.refundAmount > 0 && (
            <p className="text-gray-400 mt-2">Refund: <span className="text-green-400 font-semibold">₦{dispute.refundAmount.toLocaleString()}</span></p>
          )}
        </div>
      )}
    </div>
  )
}