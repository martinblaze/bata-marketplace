'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  'Fashion & Clothing',
  'Food Services',
  'Room Essentials',
  'School Supplies',
  'Tech Gadgets',
  'Cosmetics',
  'Snacks',
  'Deodorants',
  'Books',
  'Furniture',
]

const HOSTELS = [
  'Aroma',
  'Tempsite',
  'Express Gate',
  'Ifite',
  'Amansea',
  'Bus Stand (Inside School)',
  'School Hostel (Inside School)',
]

export default function SellPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '1',
    description: '',
    category: '',
    hostelName: '',
    roomNumber: '',
    landmark: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    } else {
      setCheckingAuth(false)
    }
  }, [router])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-bata-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (images.length < 1) {
      setError('Please add at least 1 product image')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          images,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/marketplace')
      } else {
        setError(data.error || 'Failed to create product')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-bata-primary hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Sell Your Product</h1>
          <p className="text-gray-600 mt-2">List your item on BATA marketplace</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                placeholder="e.g., iPhone 13 Pro"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                placeholder="e.g., 50000"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity Available <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                placeholder="e.g., 10"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many units do you have in stock?
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                placeholder="Describe your product in detail..."
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Images <span className="text-red-500">*</span>
              </label>
              <div className="space-y-4">
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 5 && (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-bata-primary transition-colors">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-gray-600 font-medium">Click to upload images</p>
                      <p className="text-sm text-gray-500 mt-1">{images.length}/5 images uploaded</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Pickup Location */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pickup Location</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hostel/Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.hostelName}
                    onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                  >
                    <option value="">Select hostel</option>
                    {HOSTELS.map((hostel) => (
                      <option key={hostel} value={hostel}>{hostel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                    placeholder="e.g., Room 12, Block A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-bata-primary focus:outline-none transition-colors"
                    placeholder="e.g., Near the water dispenser"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bata-primary hover:bg-bata-dark text-white py-3.5 rounded-lg font-bold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Listing Product...' : 'List Product'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}