'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingBag,
  Package,
  TrendingUp,
  Award,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  Grid,
  List,
  Filter,
  Search
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  quantity: number
  images: string[]
  category: string
  isActive: boolean
  viewCount: number
  createdAt: string
  _count: {
    orders: number
  }
}

export default function MyShopPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'outofstock'>('all')
  const [restockingId, setRestockingId] = useState<string | null>(null)
  const [restockAmount, setRestockAmount] = useState<number>(1)
  const [userRole, setUserRole] = useState('')
  const [isSellerMode, setIsSellerMode] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await response.json()
        if (response.ok && data.user) {
          setUserRole(data.user.role || 'BUYER')
          
          const sellerModePref = localStorage.getItem('sellerMode')
          if (sellerModePref !== null) {
            setIsSellerMode(sellerModePref === 'true')
          } else if (data.user.isSellerMode !== undefined) {
            setIsSellerMode(data.user.isSellerMode)
            localStorage.setItem('sellerMode', data.user.isSellerMode.toString())
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error)
      }
    }
    
    loadUserData()
    fetchMyProducts()
  }, [])

  const fetchMyProducts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/products/my-products', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products || [])
      } else {
        alert(data.error || 'Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleRestock = async (productId: string) => {
    if (restockAmount < 1) {
      alert('Please enter a valid quantity')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products/${productId}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: restockAmount }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Successfully restocked ${restockAmount} items!`)
        setRestockingId(null)
        setRestockAmount(1)
        fetchMyProducts()
      } else {
        alert(data.error || 'Failed to restock')
      }
    } catch (error) {
      console.error('Restock error:', error)
      alert('Network error')
    }
  }

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        alert('Product deleted successfully')
        fetchMyProducts()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Network error')
    }
  }

  const toggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        fetchMyProducts()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      alert('Network error')
    }
  }

  const toggleSellerMode = async () => {
    const newMode = !isSellerMode
    setIsSellerMode(newMode)
    localStorage.setItem('sellerMode', newMode.toString())
    
    if (userRole === 'SELLER' || userRole === 'ADMIN') {
      try {
        const token = localStorage.getItem('token')
        await fetch('/api/auth/toggle-seller-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ isSellerMode: newMode }),
        })
      } catch (error) {
        console.error('Error updating seller mode:', error)
      }
    }
  }

  const filteredProducts = products.filter(product => {
    let matchesFilter = true
    if (filter === 'active') matchesFilter = product.quantity > 0 && product.isActive
    if (filter === 'outofstock') matchesFilter = product.quantity === 0
    
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with mode toggle - Enhanced */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              {isSellerMode ? 'My Shop Dashboard' : 'My Items'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isSellerMode ? 'Manage your products and track performance' : 'View your purchased items'}
            </p>
          </div>
          
          {userRole === 'SELLER' || userRole === 'ADMIN' ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
                <button
                  onClick={() => !isSellerMode && toggleSellerMode()}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isSellerMode 
                      ? 'bg-gradient-to-r from-bata-primary to-bata-dark text-white shadow-md cursor-default' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Seller Mode
                </button>
                <button
                  onClick={() => isSellerMode && toggleSellerMode()}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    !isSellerMode 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md cursor-default' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Buyer Mode
                </button>
              </div>
              {isSellerMode && (
                <Link 
                  href="/sell" 
                  className="bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </Link>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
              Buyer Account • <Link href="/become-seller" className="text-bata-primary hover:underline font-semibold">Become a Seller</Link>
            </div>
          )}
        </div>

        {/* Search Bar - Only for seller mode */}
        {isSellerMode && (
          <div className="mb-8">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your products..."
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-bata-primary focus:outline-none focus:ring-2 focus:ring-bata-primary/20 shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Conditional content based on mode */}
        {isSellerMode ? (
          // Enhanced Seller Dashboard
          <div>
            {/* Stats Cards - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingBag className="w-8 h-8 text-bata-primary" />
                  <span className="text-xs font-semibold text-gray-500">TOTAL</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{products.length}</div>
                <div className="text-sm text-gray-600 font-medium">Products Listed</div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl border border-green-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <span className="text-xs font-semibold text-green-600">ACTIVE</span>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {products.filter(p => p.quantity > 0 && p.isActive).length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Active Products</div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <span className="text-xs font-semibold text-red-600">OUT OF STOCK</span>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {products.filter(p => p.quantity === 0).length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Needs Restocking</div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600">SALES</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {products.reduce((sum, p) => sum + (p._count?.orders || 0), 0)}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Orders</div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              {/* Filter Tabs - Enhanced */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                    filter === 'all'
                      ? 'bg-gradient-to-r from-bata-primary to-bata-dark text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  All Products ({products.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                    filter === 'active'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Active ({products.filter(p => p.quantity > 0 && p.isActive).length})
                </button>
                <button
                  onClick={() => setFilter('outofstock')}
                  className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                    filter === 'outofstock'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Out of Stock ({products.filter(p => p.quantity === 0).length})
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-bata-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-bata-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Products List - Enhanced with grid/list view */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-dashed border-gray-300 shadow-sm">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">No products found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm ? 'No products match your search. Try different keywords.' : 'Start your selling journey by listing your first product!'}
                </p>
                <Link
                  href="/sell"
                  className="inline-block bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  + List Your First Product
                </Link>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                      <img
                        src={product.images[0] || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        {product.quantity === 0 ? (
                          <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded-full shadow-lg">
                            OUT OF STOCK
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-bold rounded-full shadow-lg">
                            {product.quantity} LEFT
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.category}</p>
                        </div>
                        <span className="text-xl font-bold text-bata-primary">
                          {formatPrice(product.price)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Views</div>
                          <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {product.viewCount}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Orders</div>
                          <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                            <ShoppingBag className="w-4 h-4" />
                            {product._count?.orders || 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/product/${product.id}`)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => toggleActive(product.id, product.isActive)}
                          className={`px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                            product.isActive
                              ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-800'
                              : 'bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-800'
                          }`}
                        >
                          {product.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-800 rounded-lg font-semibold transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View (default)
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    <div className="flex flex-col md:flex-row gap-6 p-6">
                      {/* Product Image */}
                      <div className="w-full md:w-40 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={product.images[0] || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-4">
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                            <p className="text-gray-600">{product.category}</p>
                            <div className="flex flex-wrap gap-2">
                              {product.quantity === 0 ? (
                                <span className="px-3 py-1 bg-gradient-to-r from-red-100 to-red-200 text-red-800 text-sm font-bold rounded-full border border-red-200">
                                  OUT OF STOCK
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm font-bold rounded-full border border-green-200">
                                  {product.quantity} IN STOCK
                                </span>
                              )}
                              
                              {!product.isActive && (
                                <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-sm font-bold rounded-full border border-gray-200">
                                  INACTIVE
                                </span>
                              )}

                              <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm font-bold rounded-full border border-blue-200 flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {product.viewCount} views
                              </span>

                              <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm font-bold rounded-full border border-purple-200 flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" />
                                {product._count?.orders || 0} orders
                              </span>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-bata-primary">
                            {formatPrice(product.price)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          {/* Restock Button */}
                          {product.quantity === 0 || product.quantity < 5 ? (
                            restockingId === product.id ? (
                              <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
                                <input
                                  type="number"
                                  min="1"
                                  value={restockAmount}
                                  onChange={(e) => setRestockAmount(parseInt(e.target.value) || 1)}
                                  className="w-24 px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:border-bata-primary bg-white"
                                  placeholder="Quantity"
                                />
                                <button
                                  onClick={() => handleRestock(product.id)}
                                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-200"
                                >
                                  ✓ Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    setRestockingId(null)
                                    setRestockAmount(1)
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-700 rounded-lg font-semibold transition-all duration-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRestockingId(product.id)}
                                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                              >
                                <Package className="w-4 h-4" />
                                Restock
                              </button>
                            )
                          ) : null}

                          <button
                            onClick={() => toggleActive(product.id, product.isActive)}
                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                              product.isActive
                                ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-800'
                                : 'bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-800'
                            }`}
                          >
                            {product.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                          </button>

                          <Link
                            href={`/product/${product.id}`}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-800 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Live
                          </Link>

                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="px-5 py-2.5 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-800 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Floating Add Button - Enhanced */}
            <Link
              href="/sell"
              className="fixed bottom-8 right-8 bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white p-5 rounded-2xl shadow-2xl hover:scale-110 transition-all duration-300 z-50 flex items-center gap-2 group"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-bold">Add Product</span>
            </Link>
          </div>
        ) : (
          // Enhanced Buyer Dashboard
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Purchases</h2>
                  <p className="text-gray-600">
                    You are currently in <span className="font-semibold text-blue-600">Buyer Mode</span>. 
                    Switch to Seller Mode to manage your products.
                  </p>
                </div>
              </div>
              
              {/* Enhanced Placeholder */}
              <div className="text-center py-12">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">No purchases yet</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Start shopping in the marketplace to see your purchases here!</p>
                <Link
                  href="/marketplace"
                  className="inline-block bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Browse Marketplace
                </Link>
              </div>
            </div>

            {/* Enhanced Order History */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                  <p className="text-gray-600">View your past orders and track current deliveries</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <Award className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-3">Your order history will appear here</h3>
                <p className="text-gray-500 mb-6">Make purchases to build your order history</p>
                <div className="mt-6">
                  <Link
                    href="/orders"
                    className="inline-block bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                  >
                    View All Orders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}