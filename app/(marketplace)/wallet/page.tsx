// app/(marketplace)/wallet/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  reference: string
  createdAt: string
  balanceBefore: number
  balanceAfter: number
}

interface WalletData {
  availableBalance: number
  pendingBalance: number
  completedOrders: number
  role: string
}

interface User {
  id: string
  name: string
  phone: string
  email?: string
}

export default function WalletPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  
  // Withdrawal form
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bankCode, setBankCode] = useState('057') // Zenith by default

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Fetch user profile
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const userData = await userResponse.json()
      
      if (userResponse.ok) {
        setUser(userData.user)
      }

      // Fetch wallet data (NEW ENDPOINT)
      const walletResponse = await fetch('/api/wallet', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const walletData = await walletResponse.json()
      
      if (walletResponse.ok) {
        setWallet(walletData.wallet)
      }

      // Fetch transactions
      const txResponse = await fetch('/api/wallet/transactions', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const txData = await txResponse.json()
      
      if (txResponse.ok) {
        setTransactions(txData.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!wallet || amount > wallet.availableBalance) {
      alert('Insufficient balance')
      return
    }

    if (!accountNumber || !accountName) {
      alert('Please fill all fields')
      return
    }

    setWithdrawing(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          accountNumber,
          accountName,
          bankCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Withdrawal successful! Reference: ${data.reference}`)
        setShowWithdrawForm(false)
        setWithdrawAmount('')
        setAccountNumber('')
        setAccountName('')
        fetchWalletData() // Refresh data
      } else {
        alert(data.error || 'Withdrawal failed')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setWithdrawing(false)
    }
  }

  // Enhanced loading check
  if (loading || !user || !wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <Link href="/marketplace" className="text-bata-primary hover:underline">
            ← Back to Marketplace
          </Link>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Available Balance */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <p className="text-green-100 text-sm mb-2">Available Balance</p>
            <h2 className="text-4xl font-bold mb-4">
              ₦{wallet.availableBalance.toLocaleString()}
            </h2>
            <button
              onClick={() => setShowWithdrawForm(true)}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
            >
              💸 Withdraw
            </button>
          </div>

          {/* Pending Balance (Escrow) */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white">
            <p className="text-yellow-100 text-sm mb-2">Pending (Escrow)</p>
            <h2 className="text-4xl font-bold mb-4">
              ₦{wallet.pendingBalance.toLocaleString()}
            </h2>
            <p className="text-yellow-100 text-sm">
              Released after delivery confirmation
            </p>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <p className="text-blue-100 text-sm mb-2">Completed Orders</p>
            <h2 className="text-4xl font-bold mb-4">{wallet.completedOrders}</h2>
            <p className="text-blue-100 text-sm">
              {wallet.role === 'SELLER' ? 'Sales' : wallet.role === 'RIDER' ? 'Deliveries' : 'Purchases'}
            </p>
          </div>
        </div>

        {/* Withdraw Form Modal */}
        {showWithdrawForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Withdraw Funds</h3>
              
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="5000"
                    min="1000"
                    max={wallet.availableBalance}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bata-primary focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: ₦{wallet.availableBalance.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="0123456789"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bata-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bata-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank
                  </label>
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bata-primary focus:border-transparent"
                    required
                  >
                    <option value="057">Zenith Bank</option>
                    <option value="058">GTBank</option>
                    <option value="033">UBA</option>
                    <option value="032">Union Bank</option>
                    <option value="011">First Bank</option>
                    <option value="214">FCMB</option>
                    <option value="070">Fidelity Bank</option>
                    <option value="044">Access Bank</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawing}
                    className="flex-1 bg-bata-primary hover:bg-bata-dark text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {withdrawing ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(tx.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Ref: {tx.reference}</p>
                  </div>
                  
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        tx.type === 'CREDIT'
                          ? 'text-green-600'
                          : tx.type === 'DEBIT' || tx.type === 'WITHDRAWAL'
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : tx.type === 'ESCROW' ? '🔒' : '-'}₦{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          tx.type === 'CREDIT'
                            ? 'bg-green-100 text-green-700'
                            : tx.type === 'DEBIT' || tx.type === 'WITHDRAWAL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </p>
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