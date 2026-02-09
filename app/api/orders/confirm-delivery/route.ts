import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: true,
        rider: true,
        product: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.buyerId !== user.id) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    if (order.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Payment already released' }, { status: 400 })
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Order not delivered yet' }, { status: 400 })
    }

    // ✅ CORRECTED CALCULATION - Must match what was stored in order.platformCommission
    // Seller gets: productPrice - platform fee (5% or 10% depending on category)
    // Rider gets: ₦560
    // Platform gets: platform fee + ₦240 from delivery (this is in order.platformCommission)
    
    const platformCommissionFromOrder = order.platformCommission || 0
    const sellerShare = order.productPrice - (platformCommissionFromOrder - 240) // Subtract only the product fee portion
    const riderShare = 560
    const platformShare = platformCommissionFromOrder // This already includes the ₦240

    console.log('=== PAYMENT RELEASE CALCULATION ===')
    console.log('Product Price:', order.productPrice)
    console.log('Platform Commission (stored):', platformCommissionFromOrder)
    console.log('Seller gets:', sellerShare)
    console.log('Rider gets:', riderShare)
    console.log('Platform gets:', platformShare)

    // EXECUTE IN TRANSACTION
    await prisma.$transaction(async (tx) => {
      // Get fresh balances
      const sellerFresh = await tx.user.findUnique({ 
        where: { id: order.sellerId },
        select: { availableBalance: true, pendingBalance: true, completedOrders: true }
      })
      
      const riderFresh = order.riderId ? await tx.user.findUnique({ 
        where: { id: order.riderId },
        select: { availableBalance: true, pendingBalance: true }
      }) : null

      // --- SELLER: Remove ESCROW, Add CREDIT ---
      
      // 1. Delete seller's ESCROW transaction
      await tx.transaction.deleteMany({
        where: {
          userId: order.sellerId,
          type: 'ESCROW',
          reference: {
            contains: order.orderNumber,
            endsWith: 'ESCROW'
          }
        },
      })

      // 2. Update seller: move from pending to available
      await tx.user.update({
        where: { id: order.sellerId },
        data: { 
          pendingBalance: { decrement: sellerShare },
          availableBalance: { increment: sellerShare },
          completedOrders: { increment: 1 },
        },
      })

      // 3. Create seller CREDIT transaction
      await tx.transaction.create({
        data: {
          userId: order.sellerId,
          type: 'CREDIT',
          amount: sellerShare,
          description: `Sale completed: ${order.product?.name || 'Product'} (Order: ${order.orderNumber})`,
          reference: `${order.orderNumber}-SELLER-CREDIT`,
          balanceBefore: sellerFresh?.availableBalance || 0,
          balanceAfter: (sellerFresh?.availableBalance || 0) + sellerShare,
        },
      })

      // --- RIDER: Remove ESCROW, Add CREDIT ---
      
      if (order.riderId && riderFresh) {
        // 1. Delete rider's ESCROW transaction
        await tx.transaction.deleteMany({
          where: {
            userId: order.riderId,
            type: 'ESCROW',
            reference: `${order.orderNumber}-RIDER-ESCROW`,
          },
        })

        // 2. Update rider: move from pending to available
        await tx.user.update({
          where: { id: order.riderId },
          data: { 
            pendingBalance: { decrement: riderShare },
            availableBalance: { increment: riderShare },
            completedOrders: { increment: 1 },
          },
        })

        // 3. Create rider CREDIT transaction
        await tx.transaction.create({
          data: {
            userId: order.riderId,
            type: 'CREDIT',
            amount: riderShare,
            description: `Delivery completed: ${order.product?.name || 'Product'} (Order: ${order.orderNumber})`,
            reference: `${order.orderNumber}-RIDER-CREDIT`,
            balanceBefore: riderFresh.availableBalance || 0,
            balanceAfter: (riderFresh.availableBalance || 0) + riderShare,
          },
        })
      }

      // 🔥 FIX: Mark order as completed AND set completedAt timestamp
      await tx.order.update({
        where: { id: orderId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          // 🔥 IMPORTANT: Set deliveredAt if not already set
          // This ensures disputes can be opened
          deliveredAt: order.deliveredAt || new Date(),
        },
      })

      // Update buyer's completed orders
      await tx.user.update({
        where: { id: order.buyerId },
        data: { completedOrders: { increment: 1 } },
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Payment released!',
      breakdown: {
        seller: sellerShare,
        rider: riderShare,
        platform: platformShare,
      }
    })
  } catch (error) {
    console.error('Confirm delivery error:', error)
    return NextResponse.json({ 
      error: 'Failed to confirm delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}