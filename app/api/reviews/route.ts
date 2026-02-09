import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { updateSellerStats } from '../sellers/update-stats/route';
import { ReviewType } from '@prisma/client';

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

const reviewSchema = z.object({
  orderId: z.string(),
  type: z.enum(['SELLER', 'RIDER']),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, type, rating, comment } = reviewSchema.parse(body);

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check permissions
    if (order.buyerId !== user.id) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 });
    }

    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only review delivered orders' },
        { status: 400 }
      );
    }

    // Determine reviewee based on type
    const revieweeId = type === 'SELLER' ? order.sellerId : order.riderId;

    if (!revieweeId) {
      return NextResponse.json({ error: 'Invalid review target' }, { status: 400 });
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        orderId,
        type: type as ReviewType,
        reviewerId: user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this ' + type.toLowerCase() },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        orderId,
        reviewerId: user.id,
        revieweeId,
        type: type as ReviewType,
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

    // Update seller/rider stats
    if (type === 'SELLER') {
      await updateSellerStats(revieweeId);
    } else if (type === 'RIDER') {
      // Update rider stats if needed
      // Similar to seller stats update
    }

    return NextResponse.json({
      success: true,
      review,
      message: `${type} review submitted successfully`
    });
  } catch (error) {
    console.error('Error creating review:', error);
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
        type: type.toUpperCase() as ReviewType,
      },
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
      take: 20,
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}