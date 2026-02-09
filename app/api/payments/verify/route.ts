import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.redirect(
        new URL('/marketplace?error=no_reference', request.url)
      )
    }

    // Production: Verify with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.redirect(
        new URL('/marketplace?error=payment_failed', request.url)
      )
    }

    // Extract metadata
    const { productId, userId, productPrice, deliveryFee, totalAmount } = 
      verifyData.data.metadata

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    })

    if (!product) {
      return NextResponse.redirect(
        new URL('/marketplace?error=product_not_found', request.url)
      )
    }

    // Check stock
    if (product.quantity < 1) {
      return NextResponse.redirect(
        new URL('/marketplace?error=out_of_stock', request.url)
      )
    }

    // Get buyer details
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!buyer) {
      return NextResponse.redirect(
        new URL('/marketplace?error=user_not_found', request.url)
      )
    }

    const orderNumber = `BATA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Calculate shares (MUST match confirm-delivery exactly)
    const sellerShare = Number(productPrice) * 0.9 + 240
    const riderShare = 560

    // Create order with payment held in escrow
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId: userId,
          sellerId: product.sellerId,
          productId: product.id,
          totalAmount: Number(totalAmount),
          deliveryFee: Number(deliveryFee),
          productPrice: Number(productPrice),
          platformCommission: Number(productPrice) * 0.10,
          deliveryHostel: buyer.hostelName || '',
          deliveryRoom: buyer.roomNumber || '',
          deliveryPhone: buyer.phone || '',
          deliveryLandmark: buyer.landmark || '',
          isPaid: true,
          paymentId: reference,
          status: 'PENDING',
        },
      })

      // Reduce stock
      await tx.product.update({
        where: { id: product.id },
        data: { quantity: { decrement: 1 } },
      })

      // Record buyer's payment (DEBIT)
      await tx.transaction.create({
        data: {
          userId: userId,
          type: 'DEBIT',
          amount: Number(totalAmount),
          description: `Payment for ${product.name} (Order: ${orderNumber})`,
          reference: reference,
          balanceBefore: 0,
          balanceAfter: 0,
        },
      })

      // Get seller's current pending balance
      const seller = await tx.user.findUnique({
        where: { id: product.sellerId },
        select: { pendingBalance: true },
      })

      // Create ESCROW transaction for seller
      await tx.transaction.create({
        data: {
          userId: product.sellerId,
          type: 'ESCROW',
          amount: sellerShare,
          description: `Escrow for: ${product.name} (Order: ${orderNumber})`,
          reference: `${orderNumber}-SELLER-ESCROW`,
          balanceBefore: seller?.pendingBalance || 0,
          balanceAfter: (seller?.pendingBalance || 0) + sellerShare,
        },
      })

      // Update seller's pending balance
      await tx.user.update({
        where: { id: product.sellerId },
        data: {
          pendingBalance: { increment: sellerShare },
        },
      })

      return newOrder
    })

    return NextResponse.redirect(
      new URL(`/orders?success=true&orderId=${order.id}`, request.url)
    )
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.redirect(
      new URL('/marketplace?error=verification_failed', request.url)
    )
  }
}