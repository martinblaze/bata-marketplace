// app/disputes/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Shield, AlertCircle, Send, Loader2, Package, User } from 'lucide-react'

interface DisputeMessage {
  id: string
  message: string
  senderType: string
  attachments: string[]
  createdAt: string
}

interface Dispute {
  id: string
  status: string
  reason: string
  buyerEvidence: string[]
  sellerEvidence: string[]
  resolution: string | null
  refundAmount: number | null
  createdAt: string
  updatedAt: string
  order: {
    id: string
    orderNumber: string
    totalAmount: number
    product: {
      name: string
      images: string[]
    }
  }
  buyer: {
    id: string
    name: string
    profilePhoto: string | null
  }
  seller: {
    id: string
    name: string
    profilePhoto: string | null
  }
  messages: DisputeMessage[]
}

export default function DisputeDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const disputeId = params.id as string

  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    // Get current user ID from token
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.userId)
      } catch (e) {
        console.error('Failed to parse token:', e)
      }
    }
    
    fetchDispute()
  }, [disputeId])

  const fetchDispute = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/disputes/${disputeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDispute(data.dispute)
      } else {
        setError('Dispute not found')
      }
    } catch (err) {
      setError('Failed to load dispute')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      })

      if (response.ok) {
        setNewMessage('')
        await fetchDispute() // Refresh messages
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setSending(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED_BUYER_FAVOR': return 'bg-green-100 text-green-800'
      case 'RESOLVED_SELLER_FAVOR': return 'bg-purple-100 text-purple-800'
      case 'RESOLVED_COMPROMISE': return 'bg-orange-100 text-orange-800'
      case 'DISMISSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-bata-primary animate-spin" />
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dispute Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-3 bg-bata-primary text-white rounded-lg font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  const isBuyer = currentUserId === dispute.buyer.id
  const isSeller = currentUserId === dispute.seller.id
  const isResolved = dispute.status.startsWith('RESOLVED_') || dispute.status === 'DISMISSED'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dispute #{dispute.id.slice(-8)}</h1>
                <p className="text-sm text-gray-600">Order #{dispute.order.orderNumber}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(dispute.status)}`}>
              {getStatusText(dispute.status)}
            </span>
          </div>

          {/* Order Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-4">
              <img
                src={dispute.order.product.images[0] || '/placeholder.png'}
                alt={dispute.order.product.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{dispute.order.product.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Amount: ₦{dispute.order.totalAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Opened on {new Date(dispute.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Resolution Info */}
          {isResolved && dispute.resolution && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-2">Resolution</h3>
              <p className="text-sm text-blue-800">{dispute.resolution}</p>
              {dispute.refundAmount !== null && (
                <p className="text-sm font-bold text-blue-900 mt-2">
                  Refund Amount: ₦{dispute.refundAmount.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Buyer</p>
                <p className="font-bold text-gray-900">{dispute.buyer.name}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Seller</p>
                <p className="font-bold text-gray-900">{dispute.seller.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Discussion</h2>
          
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {dispute.messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No messages yet</p>
            ) : (
              dispute.messages.map((msg) => {
                const isCurrentUser = (
                  (msg.senderType === 'BUYER' && isBuyer) ||
                  (msg.senderType === 'SELLER' && isSeller)
                )

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-lg ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : msg.senderType === 'ADMIN'
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-xs font-bold mb-1 opacity-75">
                        {msg.senderType === 'ADMIN' ? 'Admin' : msg.senderType}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Message Input */}
          {!isResolved && (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </form>
          )}

          {isResolved && (
            <div className="text-center text-gray-500 text-sm">
              This dispute has been resolved. No further messages can be sent.
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 mb-2">What happens now?</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Both parties can communicate through this page</li>
            <li>• Our admin team is reviewing all evidence</li>
            <li>• You'll be notified of the final decision</li>
            <li>• Decision time: 3-5 business days</li>
          </ul>
        </div>
      </div>
    </div>
  )
}