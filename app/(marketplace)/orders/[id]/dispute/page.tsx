// app/(marketplace)/orders/[id]/dispute/page.tsx - FIXED VERSION
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Shield, Upload, AlertCircle } from 'lucide-react'

interface Order {
    id: string
    orderNumber: string
    totalAmount: number
    product: {
        name: string
        images: string[]
    }
    seller: {
        name: string
    }
    status: string
    deliveredAt: string | null
    dispute?: {
        id: string
        status: string
        createdAt: string
    }
}

export default function OpenDisputePage() {
    const router = useRouter()
    const params = useParams()
    const orderId = params.id as string

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        reason: '',
        evidence: [] as string[]
    })

    useEffect(() => {
        fetchOrder()
    }, [orderId])

    const fetchOrder = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await response.json()
            if (response.ok) {
                // Check if order already has a dispute
                if (data.dispute) {
                    setError('This order already has an open dispute.')
                    // Optionally redirect to the existing dispute
                    // setTimeout(() => {
                    //   router.push(`/disputes/${data.dispute.id}`)
                    // }, 3000)
                }
                setOrder(data)
            } else {
                setError('Order not found')
            }
        } catch (err) {
            setError('Failed to load order')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        // Check again if dispute exists
        if (order?.dispute) {
            setError('This order already has a dispute. Please refresh the page.')
            setSubmitting(false)
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/disputes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId,
                    ...formData
                })
            })

            const data = await response.json()

            if (response.ok) {
                alert('Dispute opened successfully! Our team will review it.')
                router.push(`/disputes/${data.dispute.id}`)
            } else {
                setError(data.error || 'Failed to open dispute')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent"></div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        )
    }

    // FIXED: Check if order is eligible for dispute (delivered/completed within last 7 days)
    const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : null
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // Allow disputes for DELIVERED or COMPLETED orders
    const isValidStatus = ['DELIVERED', 'COMPLETED'].includes(order.status)
    const isWithinTimeWindow = deliveredDate ? deliveredDate > sevenDaysAgo : false
    const canDispute = deliveredDate && isWithinTimeWindow && isValidStatus

    if (!canDispute) {
        let errorMessage = ''
        
        if (!isValidStatus) {
            errorMessage = 'Only delivered or completed orders can be disputed.'
        } else if (!deliveredDate) {
            errorMessage = 'Order delivery date is not set. Please contact support.'
        } else if (!isWithinTimeWindow) {
            errorMessage = 'Dispute window has expired (must be within 7 days of delivery).'
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot Open Dispute</h2>
                    <p className="text-gray-600 mb-6">
                        {errorMessage}
                    </p>
                    
                    {/* Show order status for debugging */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                        <p className="text-sm text-gray-600 mb-1">
                            <strong>Order Status:</strong> {order.status}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Delivered At:</strong> {deliveredDate ? deliveredDate.toLocaleDateString() : 'Not set'}
                        </p>
                    </div>
                    
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-8 h-8 text-red-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Open a Dispute</h1>
                            <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex gap-4">
                            <img
                                src={order.product.images[0] || '/placeholder.png'}
                                alt={order.product.name}
                                className="w-20 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900">{order.product.name}</h3>
                                <p className="text-sm text-gray-600">Seller: {order.seller.name}</p>
                                <p className="text-sm font-bold text-bata-primary mt-1">
                                    ₦{order.totalAmount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Warning */}
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Before opening a dispute:</strong>
                        </p>
                        <ul className="mt-2 ml-4 space-y-1 text-sm text-yellow-800 list-disc">
                            <li>Try to resolve the issue with the seller first</li>
                            <li>Provide clear evidence to support your claim</li>
                            <li>False disputes may result in penalties</li>
                        </ul>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Describe the problem *
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-40"
                                placeholder="Explain what went wrong with this order...

Examples:
- Product received is different from what was advertised
- Product is damaged or defective
- Product never arrived
- Product is fake or counterfeit"
                                required
                            />
                        </div>

                        {/* Evidence */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Evidence
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Upload photos or screenshots</p>
                                <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-bold text-blue-900 mb-2">What happens next?</h3>
                            <ul className="space-y-1 text-sm text-blue-800">
                                <li>• Your payment is held in escrow</li>
                                <li>• The seller will be notified and can respond</li>
                                <li>• Our team will review evidence from both parties</li>
                                <li>• A decision will be made within 3-5 business days</li>
                                <li>• Refunds (if applicable) are processed to your wallet</li>
                            </ul>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                disabled={submitting || !!order.dispute}
                            >
                                {submitting ? 'Opening Dispute...' : 'Open Dispute'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}