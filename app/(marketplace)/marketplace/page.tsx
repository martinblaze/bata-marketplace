'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Star,
  Shield,
  Filter,
  Grid,
  List,
  ShoppingBag,
  Sparkles,
  Flame,
  AlertCircle
} from 'lucide-react'

const CATEGORIES = [
  { name: 'All', icon: '🛍️', color: 'from-purple-500 to-pink-500' },
  { name: 'Fashion & Clothing', icon: '👔', color: 'from-blue-500 to-cyan-500' },
  { name: 'Food Services', icon: '🍔', color: 'from-orange-500 to-red-500' },
  { name: 'Room Essentials', icon: '🏠', color: 'from-green-500 to-emerald-500' },
  { name: 'School Supplies', icon: '🎒', color: 'from-yellow-500 to-amber-500' },
  { name: 'Tech Gadgets', icon: '🎧', color: 'from-indigo-500 to-purple-500' },
  { name: 'Cosmetics', icon: '💄', color: 'from-pink-500 to-rose-500' },
  { name: 'Snacks', icon: '🍿', color: 'from-amber-500 to-yellow-500' },
  { name: 'Books', icon: '📚', color: 'from-gray-500 to-gray-700' },
]

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  category: string
  seller: {
    id: string
    name: string
    avgRating: number
    trustLevel: string
  }
  isTrending?: boolean
  isNew?: boolean
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'popular'>('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const url = selectedCategory === 'All'
        ? '/api/products'
        : `/api/products?category=${encodeURIComponent(selectedCategory)}`

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        const productsWithMeta = (data.products || []).map((product: Product) => ({
          ...product,
          isTrending: Math.random() > 0.7,
          isNew: Math.random() > 0.8
        }))
        setProducts(productsWithMeta)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'popular':
          return 0
        case 'recent':
        default:
          return 0
      }
    })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price)
  }

  const handleProductClick = (productId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
    } else {
      window.location.href = `/product/${productId}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-bata-primary via-bata-primary to-bata-dark text-white py-8 sm:py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 sm:mb-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">BATA Marketplace</h1>
              </div>
              <p className="text-lg sm:text-xl opacity-90 max-w-2xl">
                Discover amazing products from UNIZIK students. Shop local, support peers!
              </p>
            </div>
          </div>

          {/* Search and Actions Row */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
            {/* Search Bar */}
            <div className="w-full">
              <div className="relative group">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Main search input area */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products, categories, or sellers..."
                      className="w-full pl-10 sm:pl-14 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl sm:shadow-2xl bg-white/95 backdrop-blur-sm text-sm sm:text-base"
                    />
                  </div>
                  
                  {/* Search button - now separate on mobile, inline on larger screens */}
                  <div className="flex gap-2">
                    <button className="flex-1 sm:flex-none sm:absolute sm:right-3 sm:top-1/2 sm:-translate-y-1/2 px-4 sm:px-6 py-3 sm:py-2 bg-gradient-to-r from-bata-primary to-bata-dark text-white rounded-xl font-semibold transition-all hover:shadow-lg text-sm sm:text-base">
                      Search
                    </button>
                    
                    {/* Action Buttons - Show on mobile, hidden on larger screens (they're in the separate section on larger screens) */}
                    <div className="flex gap-2 sm:hidden">
                      <Link
                        href="/report"
                        className="px-3 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                        title="Report an Issue"
                      >
                        <AlertCircle className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/sell"
                        className="px-3 py-3 bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                        title="Sell Products"
                      >
                        <Sparkles className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Trending tags */}
                <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 text-xs sm:text-sm overflow-x-auto pb-1">
                  <span className="opacity-80 whitespace-nowrap">Trending:</span>
                  <div className="flex gap-1 sm:gap-2 flex-nowrap">
                    {['Phone', 'Sneakers', 'Laptop', 'Books', 'Food'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all whitespace-nowrap text-xs sm:text-sm"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Hidden on mobile, shown on larger screens */}
            <div className="hidden sm:flex gap-3">
              {/* Report Button */}
              <div className="relative group">
                <div className="absolute left-1/2 -translate-x-1/2 -top-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                    <div className="font-semibold mb-1">Report Issues</div>
                    <div className="text-xs text-gray-200">
                      Report sellers, riders, or<br />
                      problematic products
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-3 h-3 bg-gray-900 rotate-45"></div>
                </div>
                <Link
                  href="/report"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center w-12 h-12"
                  title="Report an Issue"
                >
                  <AlertCircle className="w-5 h-5" />
                </Link>
              </div>

              {/* Sell Button */}
              <div className="relative group">
                <div className="absolute left-1/2 -translate-x-1/2 -top-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                    <div className="font-semibold mb-1">Sell Products</div>
                    <div className="text-xs text-gray-200">
                      List your products and<br />
                      start earning
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-3 h-3 bg-gray-900 rotate-45"></div>
                </div>
                <Link
                  href="/sell"
                  className="bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white p-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center w-12 h-12"
                  title="Sell Products"
                >
                  <Sparkles className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Categories Section */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex overflow-x-auto gap-1 sm:gap-2 pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold whitespace-nowrap transition-all duration-300 relative group ${selectedCategory === cat.name
                      ? 'text-white shadow-lg'
                      : 'text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                    } ${selectedCategory === cat.name ? `bg-gradient-to-r ${cat.color}` : ''}`}
                >
                  <span className="text-sm sm:text-lg">{cat.icon}</span>
                  <span className="text-xs sm:text-base">{cat.name}</span>
                  {selectedCategory === cat.name && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Sort Controls */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:border-bata-primary font-semibold"
                >
                  <option value="recent">Recently Added</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                      ? 'bg-white text-bata-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list'
                      ? 'bg-white text-bata-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Products Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Sort Controls for Mobile */}
        <div className="lg:hidden flex items-center justify-end mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white border-2 border-gray-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-bata-primary text-xs sm:text-sm"
              >
                <option value="recent">Recently Added</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-white text-bata-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-white text-bata-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-bata-primary border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <ShoppingBag className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">No products found</h3>
            <p className="text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
              {searchQuery ? 'No products match your search. Try different keywords.' : 'Be the first to list a product in this category!'}
            </p>
            <Link
              href="/sell"
              className="inline-block bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              List Your Product
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          // Enhanced Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer relative"
              >
                {/* Product Badges */}
                {product.isTrending && (
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                      <Flame className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Trending</span>
                    </span>
                  </div>
                )}
                {product.isNew && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                      <Sparkles className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">New</span>
                    </span>
                  </div>
                )}

                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <img
                    src={product.images[0] || '/placeholder.png'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Product Info */}
                <div className="p-4 sm:p-6">
                  <div className="mb-3 sm:mb-4">
                    <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2 group-hover:text-bata-primary transition-colors duration-200 text-sm sm:text-base">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-lg sm:text-2xl font-bold text-bata-primary">
                        {formatPrice(product.price)}
                      </span>
                      <div className="flex items-center text-xs sm:text-sm">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400 mr-1" />
                        <span className="font-semibold">{product.seller.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${product.seller.trustLevel === 'GOLD' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200' :
                          product.seller.trustLevel === 'SILVER' ? 'bg-gradient-to-r from-gray-100 to-gray-200' :
                            'bg-gradient-to-r from-orange-100 to-orange-200'
                        }`}>
                        <Shield className={`w-3 h-3 sm:w-4 sm:h-4 ${product.seller.trustLevel === 'GOLD' ? 'text-yellow-600' :
                            product.seller.trustLevel === 'SILVER' ? 'text-gray-600' :
                              'text-orange-600'
                          }`} />
                      </div>
                      <div>
                        <Link
                          href={`/seller/${product.seller.id}`}
                          className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-bata-primary transition-colors duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.seller.name}
                        </Link>
                        <div className="text-xs text-gray-500">{product.category}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Enhanced List View
          <div className="space-y-3 sm:space-y-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
                  {/* Product Image */}
                  <div className="w-full sm:w-36 md:w-48 h-48 sm:h-36 md:h-48 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    <img
                      src={product.images[0] || '/placeholder.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                      {product.isTrending && (
                        <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                          <Flame className="w-2 h-2 sm:w-3 sm:h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <h3 className="text-base sm:text-xl font-bold text-gray-900 group-hover:text-bata-primary transition-colors duration-200">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-full">
                            {product.category}
                          </span>
                          <div className="flex items-center text-xs sm:text-sm">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400 mr-1" />
                            <span className="font-semibold">{product.seller.avgRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg sm:text-2xl font-bold text-bata-primary">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${product.seller.trustLevel === 'GOLD' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200' :
                          product.seller.trustLevel === 'SILVER' ? 'bg-gradient-to-r from-gray-100 to-gray-200' :
                            'bg-gradient-to-r from-orange-100 to-orange-200'
                        }`}>
                        <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${product.seller.trustLevel === 'GOLD' ? 'text-yellow-600' :
                            product.seller.trustLevel === 'SILVER' ? 'text-gray-600' :
                              'text-orange-600'
                          }`} />
                      </div>
                      <div>
                        <Link
                          href={`/seller/${product.seller.id}`}
                          className="text-sm sm:text-base font-semibold text-gray-700 hover:text-bata-primary transition-colors duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.seller.name}
                        </Link>
                        <div className="text-xs sm:text-sm text-gray-500">{product.seller.trustLevel} Seller</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}