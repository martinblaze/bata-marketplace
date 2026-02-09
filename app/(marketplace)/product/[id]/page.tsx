'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import RatingBadge from '@/components/reviews/RatingBadge';
import ReviewList from '@/components/reviews/ReviewList';
import { useCartStore } from '@/lib/cart-store';
import { 
  ShoppingCart,
  Star, 
  Share2, 
  ChevronLeft,
  User,
  Package,
  CheckCircle,
  Check,
  Shield,
  TrendingUp,
  Award,
  MessageSquare
} from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  useEffect(() => {
    if (product?.sellerId) {
      fetchSellerReviews();
    }
    if (product?.id) {
      fetchProductReviews();
    }
  }, [product?.sellerId, product?.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?userId=${product.sellerId}&type=SELLER`);
      if (response.ok) {
        const data = await response.json();
        setSellerReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchProductReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/product?productId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProductReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching product reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      maxQuantity: product.quantity,
      image: product.images?.[0] || '/placeholder.png',
      sellerId: product.sellerId,
      sellerName: product.seller?.name || 'Seller',
    });
    
    // Show success message
    setShowAddedToCart(true);
    setTimeout(() => setShowAddedToCart(false), 3000);
    
    // Reset quantity
    setQuantity(1);
  };

  const handleShare = async () => {
    const productLink = `${window.location.origin}/product/${product?.id}`;
    
    try {
      await navigator.clipboard.writeText(productLink);
      setShowLinkCopied(true);
      setTimeout(() => setShowLinkCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = productLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowLinkCopied(true);
      setTimeout(() => setShowLinkCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/marketplace')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back button */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/marketplace')}
          className="group transition-all duration-200 hover:bg-gray-50 hover:pl-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Marketplace
        </Button>
      </div>

      {/* Success notification */}
      {showAddedToCart && (
        <div className="fixed top-24 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <Check className="w-5 h-5" />
          <span className="font-medium">Added to cart!</span>
        </div>
      )}

      {/* Link copied notification */}
      {showLinkCopied && (
        <div className="fixed top-24 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <Check className="w-5 h-5" />
          <span className="font-medium">Product link copied!</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images - Enhanced */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <img
              src={product.images?.[0] || '/placeholder.png'}
              alt={product.name}
              className="w-full h-[500px] object-contain p-4 bg-gradient-to-br from-gray-50 to-white"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images?.map((img: string, index: number) => (
              <div 
                key={index}
                className="flex-shrink-0 group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-xl border-2 border-gray-200 overflow-hidden group-hover:border-bata-primary transition-all duration-200">
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Info - Enhanced */}
        <div className="space-y-8">
          {/* Product Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-4 py-2 bg-bata-primary/10 text-bata-primary rounded-full font-bold text-lg">
                    {formatPrice(product.price)}
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                    product.quantity > 10 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : product.quantity > 0 
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
          </div>

          {/* Category & Tags - Enhanced */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-gradient-to-r from-bata-primary/10 to-blue-100 text-bata-primary rounded-xl text-sm font-semibold border border-bata-primary/20">
                {product.category}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.tags?.map((tag: string) => (
                <span 
                  key={tag} 
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:border-blue-300 transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quantity Selector - Enhanced */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-sm font-semibold mb-4 text-gray-700">Select Quantity</label>
            <div className="flex items-center gap-6">
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                >
                  <span className="text-xl font-bold">−</span>
                </button>
                <span className="px-6 py-3 font-bold text-lg min-w-[80px] text-center bg-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-bata-primary">{product.quantity}</span> units available
              </div>
            </div>
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-bata-primary to-bata-dark hover:from-bata-dark hover:to-bata-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                onClick={addToCart}
                disabled={product.quantity === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-3" />
                <span className="font-bold">Add to Cart</span>
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                className="rounded-xl border-2 hover:border-bata-primary hover:bg-bata-primary/5 transition-all duration-200"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Quick Actions - Enhanced */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/cart')}
                className="rounded-xl border-gray-200 hover:border-bata-primary hover:bg-bata-primary/5 transition-all duration-200"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/marketplace')}
                className="rounded-xl border-gray-200 hover:border-bata-primary hover:bg-bata-primary/5 transition-all duration-200"
              >
                Continue Shopping
              </Button>
            </div>
          </div>

          {/* Seller Information - Enhanced */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {product.seller?.profilePhoto ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                      src={product.seller.profilePhoto}
                      alt={product.seller.name || 'Seller'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-lg border-4 border-white">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Sold by</p>
                <h3 className="font-bold text-xl">
                  <Link 
                    href={`/seller/${product.sellerId}`}
                    className="text-gray-900 hover:text-bata-primary transition-colors duration-200"
                  >
                    {product.seller?.name || 'Seller'}
                  </Link>
                </h3>
              </div>
            </div>

            {/* Seller Stats - Enhanced */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-bata-primary" />
                  <div className="text-2xl font-bold text-bata-primary">
                    {product.seller?.completedOrders || 0}
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">Orders</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <div className="text-2xl font-bold text-green-600">
                    {product.seller?.avgRating?.toFixed(1) || '0.0'}
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">Rating</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">
                    {product.seller?.trustLevel || 'Bronze'}
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">Trust Level</div>
              </div>
            </div>

            {/* Seller Reviews Preview - Enhanced */}
            {sellerReviews.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Seller Reviews
                  </h4>
                  <span className="text-sm text-gray-600">
                    {sellerReviews.length} total reviews
                  </span>
                </div>
                <div className="space-y-4">
                  <ReviewList reviews={sellerReviews.slice(0, 2)} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4 rounded-xl hover:bg-gray-100 transition-all duration-200"
                  onClick={() => router.push(`/seller/${product.sellerId}`)}
                >
                  View All Seller Reviews
                </Button>
              </div>
            )}
          </div>

          {/* Product Details - Enhanced */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-bata-primary" />
              <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Category</p>
                <p className="font-bold text-lg text-gray-900">{product.category}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Delivery</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="font-bold text-lg text-gray-900">Available on campus</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      {!reviewsLoading && (
        <div className="mt-12 bg-white rounded-2xl border p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Product Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.floor(product.avgRating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-2xl font-bold ml-2">{product.avgRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-600 ml-1">({product.totalReviews || 0} reviews)</span>
                </div>
              </div>
            </div>
            {product.totalReviews > 0 && (
              <Link href={`/product/${params.id}/reviews`}>
                <Button variant="outline" className="rounded-xl">
                  View All Reviews
                </Button>
              </Link>
            )}
          </div>

          {productReviews.length > 0 ? (
            <div className="space-y-8">
              {productReviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b pb-8 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {review.reviewer?.profilePhoto ? (
                        <img
                          src={review.reviewer.profilePhoto}
                          alt={review.reviewer.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{review.reviewer?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Verified Purchase ✓
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Be the first to share your experience with this product. 
                Your review will help others make informed decisions.
              </p>
            </div>
          )}

          {productReviews.length > 5 && (
            <div className="text-center mt-8 pt-8 border-t">
              <Link href={`/product/${params.id}/reviews`}>
                <Button size="lg" className="rounded-xl px-8">
                  Load More Reviews ({productReviews.length - 5} more)
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}