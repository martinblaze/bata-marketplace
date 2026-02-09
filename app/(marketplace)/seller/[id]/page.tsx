import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import RatingBadge from '@/components/reviews/RatingBadge';
import ReviewList from '@/components/reviews/ReviewList';
import { 
  User, 
  Package, 
  Star, 
  ShoppingBag, 
  Calendar,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { Product } from '@prisma/client';

// Helper function to update seller stats
async function refreshSellerStats(sellerId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: sellerId,
        type: 'SELLER',
      },
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;
    const totalReviews = reviews.length;

    // Calculate trust level (matching API logic)
    let trustLevel = 'BRONZE';
    
    if (totalReviews >= 3) {
      if (avgRating >= 4.5 && totalReviews >= 10) {
        trustLevel = 'VERIFIED';
      } else if (avgRating >= 4.0 && totalReviews >= 5) {
        trustLevel = 'GOLD';
      } else if (avgRating >= 3.5) {
        trustLevel = 'SILVER';
      }
    }

    await prisma.user.update({
      where: { id: sellerId },
      data: {
        avgRating,
        totalReviews,
        trustLevel: trustLevel as any,
      },
    });
  } catch (error) {
    console.error('Error updating seller stats:', error);
  }
}

export default async function SellerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  // Update seller stats first
  await refreshSellerStats(params.id);

  const seller = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      products: {
        where: { isActive: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
      },
      reviewsReceived: {
        where: { type: 'SELLER' },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
          order: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!seller) {
    notFound();
  }

  const totalProducts = await prisma.product.count({
    where: { sellerId: params.id, isActive: true },
  });

  const totalSales = await prisma.order.count({
    where: {
      product: { sellerId: params.id },
      status: {
        in: ['DELIVERED', 'COMPLETED']
      }
    },
  });

  const joinDate = new Date(seller.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  // Calculate satisfaction rate based on ratings
  const satisfactionRate = seller.avgRating 
    ? Math.round((seller.avgRating / 5) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Seller Header */}
      <div className="bg-white rounded-xl border p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {seller.profilePhoto ? (
                <img
                  src={seller.profilePhoto}
                  alt={seller.name || 'Seller'}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-white shadow-lg flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-500" />
                </div>
              )}
              {seller.trustLevel === 'VERIFIED' && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg">
                  <Shield className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold">{seller.name}</h1>
              <RatingBadge
                rating={seller.avgRating || 0}
                reviewCount={seller.totalReviews || 0}
                trustLevel={seller.trustLevel || 'BRONZE'}
                size="lg"
              />
            </div>
            
            {seller.bio && (
              <p className="text-gray-600 mb-6 max-w-2xl">{seller.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-bold text-lg">{totalSales}</span>
                  <span className="text-gray-600 ml-2">Sales</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-bold text-lg">{totalProducts}</span>
                  <span className="text-gray-600 ml-2">Products</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="font-medium">Joined {joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Products for Sale</h2>
              {totalProducts > 8 && (
                <Link 
                  href={`/seller/${params.id}/products`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All Products →
                </Link>
              )}
            </div>
            
            {seller.products.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {seller.products.map((product: Product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group border rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-lg mb-3 group-hover:scale-[1.02] transition-transform"
                      />
                    )}
                    <h3 className="font-semibold group-hover:text-blue-600">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-lg">₦{product.price.toLocaleString()}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        product.quantity > 10 
                          ? 'bg-green-100 text-green-800' 
                          : product.quantity > 0 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Products Yet</h3>
                <p className="text-gray-500">This seller hasn't listed any products.</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="bg-white rounded-xl border p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Customer Reviews</h2>
              <div className="text-right">
                <div className="text-3xl font-bold">{seller.avgRating?.toFixed(1) || '0.0'}</div>
                <div className="flex items-center justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.floor(seller.avgRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {seller.totalReviews || 0} reviews
                </p>
              </div>
            </div>
            
            <ReviewList
              reviews={seller.reviewsReceived.filter((review) => review.comment !== null) as any}
              emptyMessage={
                <div className="text-center py-8">
                  <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="font-medium mb-1">No Reviews Yet</h3>
                  <p className="text-gray-500 text-sm">
                    Be the first to review this seller!
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <div className="text-3xl font-bold text-blue-700 mb-2">
            {Math.round((seller.avgRating || 0) * 100) / 100}
          </div>
          <div className="text-blue-600 font-medium">Average Rating</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
          <div className="text-3xl font-bold text-green-700 mb-2">
            {seller.totalReviews || 0}
          </div>
          <div className="text-green-600 font-medium">Total Reviews</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
          <div className="text-3xl font-bold text-purple-700 mb-2">
            {totalSales}
          </div>
          <div className="text-purple-600 font-medium">Items Sold</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl">
          <div className="text-3xl font-bold text-amber-700 mb-2">
            {satisfactionRate}%
          </div>
          <div className="text-amber-600 font-medium">Satisfaction Rate</div>
        </div>
      </div>
    </div>
  );
}