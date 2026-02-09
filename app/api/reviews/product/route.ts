import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { updateSellerStats } from '@/lib/utils/seller-stats';

// Helper function to get user from JWT token
async function getUserFromToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

const productReviewSchema = z.object({
  orderId: z.string(),
  productId: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  type: z.literal('PRODUCT').optional(),
});

// POST - Create a product review
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, productId, rating, comment } = productReviewSchema.parse(body);

    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        seller: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.buyerId !== user.id) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 });
    }

    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only review delivered orders' },
        { status: 400 }
      );
    }

    // Use productId from order if not provided
    const actualProductId = productId || order.productId;

    if (order.productId !== actualProductId) {
      return NextResponse.json(
        { error: 'Product does not match order' },
        { status: 400 }
      );
    }

    // Check if review already exists for this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        orderId,
        productId: actualProductId,
        reviewerId: user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Create product review
    const review = await prisma.productReview.create({
      data: {
        rating,
        comment: comment || '',
        orderId,
        productId: actualProductId,
        reviewerId: user.id,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Update product's average rating
    await updateProductRatingStats(actualProductId);

    // Update seller stats after product review
    if (order.sellerId) {
      await updateSellerStats(order.sellerId);
    }

    return NextResponse.json({ 
      success: true, 
      review,
      message: 'Product review submitted successfully' 
    });
  } catch (error) {
    console.error('Error creating product review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch product reviews
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const whereClause = {
      productId,
    };

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: whereClause,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
          order: {
            select: {
              id: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productReview.count({
        where: whereClause,
      }),
    ]);

    // Get rating distribution
    const ratingDistribution = await prisma.productReview.groupBy({
      by: ['rating'],
      where: whereClause,
      _count: true,
    });

    const distribution = Array.from({ length: 5 }, (_, i) => ({
      rating: i + 1,
      count: ratingDistribution.find(r => r.rating === i + 1)?._count || 0,
    }));

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      distribution,
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update product rating stats
async function updateProductRatingStats(productId: string) {
  try {
    const reviews = await prisma.productReview.findMany({
      where: { productId },
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    console.error('Error updating product rating stats:', error);
  }
}