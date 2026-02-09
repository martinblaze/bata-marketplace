// app/api/payments/initialize/route.ts - UPDATED WITH CATEGORY-BASED FEES
// 5% default platform fee, 10% for SNACKS and FOOD categories

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'

// Helper function to calculate platform fee based on product category
function calculatePlatformFee(category: string, amount: number) {
  // Categories with 10% platform fee (case-insensitive)
  const highFeeCategories = ['SNACKS', 'FOOD', 'BEVERAGES'];

  // Check if product is in high-fee category (10%), otherwise use 5%
  const normalizedCategory = category.toUpperCase();
  const platformFeeRate = highFeeCategories.includes(normalizedCategory) ? 0.10 : 0.05;
  const platformFee = amount * platformFeeRate;

  return { platformFee, platformFeeRate };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, cartItems, deliveryFee = 800 } = body

    // Handle both single product and cart items
    let items = []

    if (cartItems && Array.isArray(cartItems)) {
      // Cart checkout - need to fetch product details including category
      const itemsWithDetails = []
      for (const item of cartItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { seller: true }
        })

        if (!product) {
          return NextResponse.json({
            error: `Product not found: ${item.name}`
          }, { status: 404 })
        }

        if (!product.isActive || product.quantity < item.quantity) {
          return NextResponse.json({
            error: `Product unavailable: ${item.name}`
          }, { status: 400 })
        }

        itemsWithDetails.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          category: product.category,
          sellerId: product.sellerId,
          sellerName: product.seller.name
        })
      }
      items = itemsWithDetails
    } else if (productId) {
      // Single product checkout (old flow)
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { seller: true }
      })

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      if (!product.isActive || product.quantity < 1) {
        return NextResponse.json({ error: 'Product unavailable' }, { status: 400 })
      }

      items = [{
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
        sellerId: product.sellerId,
        sellerName: product.seller.name
      }]
    } else {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 })
    }

    // Calculate total amounts with category-based platform fees
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Calculate platform commission based on product categories
    let totalPlatformCommission = 0;
    const itemFees = items.map(item => {
      const itemTotal = item.price * item.quantity;
      const { platformFee, platformFeeRate } = calculatePlatformFee(item.category, itemTotal);
      totalPlatformCommission += platformFee;
      return {
        productId: item.productId,
        name: item.name,
        category: item.category,
        itemTotal,
        platformFee,
        platformFeeRate: platformFeeRate * 100 // Convert to percentage for logging
      };
    });

    const totalAmount = subtotal + deliveryFee

    // Calculate escrow amounts
    // Seller gets: product price - platform commission
    // Rider gets: ₦560 from delivery fee
    // Platform gets: platform commission + ₦240 from delivery
    const sellerEscrowAmount = subtotal - totalPlatformCommission
    const riderEscrowAmount = 560  // ₦560 from delivery fee
    const platformCommission = totalPlatformCommission + 240  // Platform fee + ₦240 from delivery

    console.log('=== PAYMENT INITIALIZATION (CATEGORY-BASED FEES) ===')
    console.log('Items:', items)
    console.log('Item Fees Breakdown:')
    itemFees.forEach(fee => {
      console.log(`  - ${fee.name} (${fee.category}): ₦${fee.itemTotal} × ${fee.platformFeeRate}% = ₦${fee.platformFee}`)
    })
    console.log('Amounts:', {
      subtotal,
      deliveryFee,
      totalAmount,
      sellerEscrow: sellerEscrowAmount,
      riderEscrow: riderEscrowAmount,
      platformCommission,
    })

    // For development: Skip Paystack, create orders directly
    if (process.env.NODE_ENV === 'development') {
      try {
        // Group items by seller
        const sellerGroups = items.reduce((acc: any, item) => {
          if (!acc[item.sellerId]) {
            acc[item.sellerId] = []
          }
          acc[item.sellerId].push(item)
          return acc
        }, {})

        const createdOrders = []

        // Create separate orders for each seller
        for (const [sellerId, sellerItems] of Object.entries(sellerGroups) as [string, any][]) {
          const orderNumber = `BATA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

          const orderSubtotal = sellerItems.reduce((sum: number, item: any) =>
            sum + (item.price * item.quantity), 0
          )

          // Calculate order-specific platform commission based on categories
          let orderPlatformCommission = 0;
          sellerItems.forEach((item: any) => {
            const itemTotal = item.price * item.quantity;
            const { platformFee } = calculatePlatformFee(item.category, itemTotal);
            orderPlatformCommission += platformFee;
          });

          const orderTotal = orderSubtotal + deliveryFee
          const orderSellerEscrow = orderSubtotal - orderPlatformCommission
          const orderPlatformTotal = orderPlatformCommission + 240  // Commission + ₦240 from delivery

          const result = await prisma.$transaction(async (tx) => {
            console.log(`\n=== CREATING ORDER FOR SELLER: ${sellerId} ===`)

            // Get seller's current balance BEFORE updates
            const sellerBefore = await tx.user.findUnique({
              where: { id: sellerId },
              select: {
                id: true,
                name: true,
                pendingBalance: true,
                availableBalance: true
              },
            })
            console.log('Seller BEFORE:', sellerBefore)

            // Create order with multiple items
            const order = await tx.order.create({
              data: {
                orderNumber,
                buyerId: user.id,
                sellerId: sellerId,
                productId: sellerItems[0].productId, // Primary product
                totalAmount: orderTotal,
                deliveryFee,
                productPrice: orderSubtotal,
                platformCommission: orderPlatformTotal,  // Platform fee + ₦240 from delivery
                deliveryHostel: user.hostelName || '',
                deliveryRoom: user.roomNumber || '',
                deliveryPhone: user.phone || '',
                deliveryLandmark: user.landmark || '',
                isPaid: true,
                paymentId: `dev_${Date.now()}`,
                status: 'PENDING',
              },
            })
            console.log('✓ Order created:', order.orderNumber)
            console.log(`  Platform commission: ₦${orderPlatformCommission} + ₦240 = ₦${orderPlatformTotal}`)

            // Reduce stock for all items
            for (const item of sellerItems) {
              await tx.product.update({
                where: { id: item.productId },
                data: { quantity: { decrement: item.quantity } },
              })
              console.log(`✓ Stock reduced for: ${item.name} (-${item.quantity})`)
            }

            // UPDATE SELLER BALANCE - Put money in escrow
            const updatedSeller = await tx.user.update({
              where: { id: sellerId },
              data: {
                pendingBalance: { increment: orderSellerEscrow },
              },
              select: {
                id: true,
                name: true,
                pendingBalance: true,
                availableBalance: true,
              }
            })
            console.log('✓ Seller balance updated:', updatedSeller)

            // Record buyer transaction (payment made)
            const itemsList = sellerItems.map((item: any) =>
              `${item.name} (x${item.quantity})`
            ).join(', ')

            await tx.transaction.create({
              data: {
                userId: user.id,
                type: 'DEBIT',
                amount: orderTotal,
                description: `Payment for ${itemsList} (Order: ${orderNumber})`,
                reference: `${orderNumber}-BUYER-PAYMENT`,
                balanceBefore: 0,
                balanceAfter: 0,
              }
            })
            console.log('✓ Buyer transaction recorded')

            // Record seller ESCROW transaction
            await tx.transaction.create({
              data: {
                userId: sellerId,
                type: 'ESCROW',
                amount: orderSellerEscrow,
                description: `Escrow for ${itemsList} (Order: ${orderNumber})`,
                reference: `${orderNumber}-${sellerId.slice(-8).toUpperCase()}-ESCROW`,
                balanceBefore: sellerBefore?.pendingBalance || 0,
                balanceAfter: updatedSeller.pendingBalance,
              },
            })
            console.log('✓ Seller escrow transaction recorded')

            return order
          })

          createdOrders.push(result)
        }

        console.log('\n=== ALL ORDERS CREATED SUCCESSFULLY ===')
        console.log('Order Numbers:', createdOrders.map(o => o.orderNumber))

        return NextResponse.json({
          success: true,
          message: 'Orders placed successfully (Dev Mode)',
          orders: createdOrders.map(o => ({
            orderNumber: o.orderNumber,
            orderId: o.id
          })),
          orderId: createdOrders[0].id, // For backward compatibility
          breakdown: {
            total: totalAmount,
            subtotal,
            deliveryFee,
            sellerEscrow: sellerEscrowAmount,
            riderEscrow: riderEscrowAmount,
            platformCommission,
            itemFees, // Include category-based fee breakdown
          }
        })
      } catch (transactionError) {
        console.error('\n=== TRANSACTION FAILED ===')
        console.error('Error:', transactionError)
        throw transactionError
      }
    }

    // ====================================
    // PRODUCTION MODE: Use Paystack
    // ====================================
    const reference = `BATA-${Date.now()}-${user.id.substr(0, 8)}`

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email || `${user.phone}@bata.app`,
        amount: totalAmount * 100, // Paystack uses kobo
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`,
        metadata: {
          userId: user.id,
          cartItems: items,
          subtotal,
          deliveryFee,
          totalAmount,
          sellerEscrowAmount,
          riderEscrowAmount,
          platformCommission,
          itemFees, // Include category-based fees in metadata
        },
      }),
    })

    const data = await paystackResponse.json()

    if (data.status) {
      return NextResponse.json({
        success: true,
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
      })
    } else {
      return NextResponse.json({
        error: data.message || 'Payment initialization failed'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('\n=== PAYMENT INITIALIZATION ERROR ===')
    console.error('Error:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json({
      error: 'Failed to initialize payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}