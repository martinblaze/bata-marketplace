import Link from 'next/link'

export default function HomePage() {
  const categories = [
    { name: 'Fashion & Clothing', icon: '👔', count: '3.1K items', color: 'bg-purple-100 text-purple-600' },
    { name: 'Food Services', icon: '🍔', count: '1.2K items', color: 'bg-orange-100 text-orange-600' },
    { name: 'Room Essentials', icon: '🏠', count: '950 items', color: 'bg-green-100 text-green-600' },
    { name: 'School Supplies', icon: '🎒', count: '740 items', color: 'bg-blue-100 text-blue-600' },
    { name: 'Tech Gadgets', icon: '🎧', count: '680 items', color: 'bg-indigo-100 text-indigo-600' },
    { name: 'Cosmetics', icon: '💄', count: '520 items', color: 'bg-pink-100 text-pink-600' },
    { name: 'Snacks', icon: '🍿', count: '890 items', color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Books', icon: '📚', count: '650 items', color: 'bg-teal-100 text-teal-600' },
  ]

  const locations = ['Aroma', 'Tempsite', 'Express Gate', 'Ifite', 'Amansea', 'Bus Stand', 'School Hostel']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background">
      {/* Hero Section - Mobile Optimized */}
      <section className="bg-gradient-to-br from-bata-light via-white to-bata-light dark:from-dark-surface dark:to-dark-background px-4 py-8 md:py-16">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          {/* Main Heading */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-dark-surface px-4 py-2 rounded-full shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-bata-primary to-bata-secondary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h18v4H3V3zm0 6h18v12H3V9zm2 2v8h14v-8H5zm2 2h10v4H7v-4z"/>
                </svg>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-bata-primary to-bata-secondary bg-clip-text text-transparent">
                BATA
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white px-4">
              Not Sure Where to Start?
            </h1>
            
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Create a free account and explore the marketplace. You can switch between buying and selling anytime — no commitments, complete flexibility!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4 px-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto bg-bata-primary hover:bg-bata-dark text-white px-8 py-3.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              Join BATA
            </Link>
            <Link 
              href="/marketplace" 
              className="w-full sm:w-auto bg-white dark:bg-dark-surface border-2 border-bata-primary text-bata-primary hover:bg-bata-primary hover:text-white px-8 py-3.5 rounded-lg font-semibold transition-all"
            >
              Explore BATA
            </Link>
          </div>

          {/* Icons */}
          <div className="flex justify-center items-center gap-6 pt-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* How BATA Works */}
      <section className="py-12 md:py-16 bg-white dark:bg-dark-surface px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            How BATA Works
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Your trusted platform for student-to-student commerce
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-dark-background">
              <div className="w-16 h-16 bg-gradient-to-br from-bata-primary to-bata-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Browse & Buy</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Explore products from verified UNIZIK students across campus
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-dark-background">
              <div className="w-16 h-16 bg-gradient-to-br from-bata-primary to-bata-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Secure Payment</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Money held safely in escrow until delivery is confirmed
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-dark-background">
              <div className="w-16 h-16 bg-gradient-to-br from-bata-primary to-bata-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Fast Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get items delivered to your hostel within hours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Mobile Optimized Grid */}
      <section className="py-12 md:py-16 bg-gray-50 dark:bg-dark-background px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Shop by Category
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link 
                key={category.name}
                href={`/marketplace?category=${encodeURIComponent(category.name)}`}
                className="bg-white dark:bg-dark-surface rounded-xl p-6 text-center hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800 hover:scale-105"
              >
                <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl`}>
                  {category.icon}
                </div>
                <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{category.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* UNIZIK Locations */}
      <section className="py-12 md:py-16 bg-white dark:bg-dark-surface px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            We Deliver Across UNIZIK
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Fast delivery to all major locations
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {locations.map((location) => (
              <div 
                key={location}
                className="bg-bata-light dark:bg-bata-dark/20 text-bata-primary dark:text-bata-secondary px-4 py-2 rounded-full font-medium text-sm border border-bata-primary/20"
              >
                📍 {location}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-br from-bata-primary to-bata-secondary px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">2K+</div>
              <div className="text-sm md:text-base opacity-90">Active Users</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">5K+</div>
              <div className="text-sm md:text-base opacity-90">Products</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">98%</div>
              <div className="text-sm md:text-base opacity-90">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-white dark:bg-dark-surface px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Ready to Start Trading?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Join thousands of UNIZIK students using BATA for campus commerce
          </p>
          <Link 
            href="/signup" 
            className="inline-block bg-bata-primary hover:bg-bata-dark text-white px-8 py-4 rounded-lg font-bold text-lg hover:scale-105 transition-all shadow-xl"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Rider Signup Section - Added Here */}
      <div className="mt-16 text-center border-t pt-8">
        <Link href="/rider-signup" className="text-bata-primary hover:underline font-semibold">
          🚴 Become a Rider - Earn ₦560 per delivery!
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-dark-background border-t border-gray-200 dark:border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-bata-primary mb-3">BATA</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Student-to-student marketplace for UNIZIK
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/marketplace">Marketplace</Link></li>
                <li><Link href="/sell">Sell</Link></li>
                <li><Link href="/rider">Become a Rider</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-800">
            © 2026 BATA. Built for UNIZIK Students.
          </div>
        </div>
      </footer>
    </div>
  )
}