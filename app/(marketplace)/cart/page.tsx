'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { 
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  Package,
  Lock,
  Truck,
  Shield
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    // Store cart items in sessionStorage for checkout page
    sessionStorage.setItem('checkout_cart', JSON.stringify(items));
    
    // Navigate to checkout with cart items
    router.push('/checkout');
  };

  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Browse our marketplace and add items to your cart!
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/marketplace')}
            className="bg-bata-primary hover:bg-bata-dark"
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/marketplace')}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          <h1 className="text-3xl font-bold">Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Items Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg">Cart Items</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              {/* Items List */}
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link href={`/product/${item.productId}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg border hover:border-bata-primary transition-colors cursor-pointer"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1">
                        <Link 
                          href={`/product/${item.productId}`}
                          className="font-semibold text-lg hover:text-bata-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          Sold by: <Link href={`/seller/${item.sellerId}`} className="text-blue-600 hover:underline">{item.sellerName}</Link>
                        </p>
                        
                        {/* Price and Quantity Controls */}
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-bata-primary">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatPrice(item.price)} each
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="p-2 hover:bg-gray-50 transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-2 font-medium min-w-[50px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="p-2 hover:bg-gray-50 transition-colors"
                                disabled={item.quantity >= item.maxQuantity}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.productId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Stock Warning */}
                        {item.quantity >= item.maxQuantity && (
                          <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            Maximum quantity reached
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust & Safety Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Why Shop with BATA?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Secure Payments</h4>
                    <p className="text-xs text-gray-600">Your money is safe until delivery</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">On-Campus Delivery</h4>
                    <p className="text-xs text-gray-600">Fast delivery within campus</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Verified Sellers</h4>
                    <p className="text-xs text-gray-600">All sellers are verified students</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">{formatPrice(800)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-bata-primary">{formatPrice(getTotalPrice() + 800)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-bata-primary hover:bg-bata-dark text-white mb-3"
                onClick={handleCheckout}
              >
                <Lock className="w-5 h-5 mr-2" />
                Proceed to Checkout
              </Button>

              <p className="text-xs text-center text-gray-500">
                Payment is processed securely through our trusted payment partners
              </p>

              {/* Savings Info */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-sm mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-medium">{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unique Products:</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sellers:</span>
                    <span className="font-medium">
                      {new Set(items.map(item => item.sellerId)).size}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}