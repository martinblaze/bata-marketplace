// app/api/riders/accept-order/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Order already assigned or completed' 
      }, { status: 400 })
    }

    if (order.riderId) {
      return NextResponse.json({ 
        error: 'Order already has a rider' 
      }, { status: 400 })
    }

    // Rider fee (must match confirm-delivery)
    const riderShare = 560

    // Update order and create rider ESCROW in transaction
    await prisma.$transaction(async (tx) => {
      console.log('=== RIDER ACCEPTING ORDER ===')
      console.log('Order:', order.orderNumber)
      console.log('Rider:', user.name, user.id)

      // Assign rider to order
      await tx.order.update({
        where: { id: orderId },
        data: {
          riderId: user.id,
          status: 'RIDER_ASSIGNED',
          riderAssignedAt: new Date(),
        },
      })
      console.log('✓ Rider assigned to order')

      // Get rider's current pending balance
      const rider = await tx.user.findUnique({
        where: { id: user.id },
        select: { pendingBalance: true },
      })
      console.log('Rider balance BEFORE:', rider?.pendingBalance || 0)

      // Create ESCROW transaction for rider
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'ESCROW',
          amount: riderShare,
          description: `Escrow for delivery: ${order.product.name} (Order: ${order.orderNumber})`,
          reference: `${order.orderNumber}-RIDER-ESCROW`,
          balanceBefore: rider?.pendingBalance || 0,
          balanceAfter: (rider?.pendingBalance || 0) + riderShare,
        },
      })
      console.log('✓ Rider escrow transaction recorded')

      // Update rider's pending balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          pendingBalance: { increment: riderShare },
        },
      })
      console.log('✓ Rider balance updated')
    })

    console.log('=== RIDER ASSIGNMENT COMPLETE ===')

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully',
      riderFee: riderShare,
    })
  } catch (error) {
    console.error('Accept order error:', error)
    return NextResponse.json({ 
      error: 'Failed to accept order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}