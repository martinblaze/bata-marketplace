// app/api/admin/disputes/[id]/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

async function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  
  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return await prisma.user.findUnique({ 
      where: { id: decoded.userId },
      select: { id: true, name: true, role: true }
    })
  } catch (error) {
    return null
  }
}

// POST: Admin resolves a dispute
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const { id: disputeId } = params
    const body = await req.json()
    const { 
      status, // RESOLVED_BUYER_FAVOR, RESOLVED_SELLER_FAVOR, RESOLVED_COMPROMISE, DISMISSED
      resolution, 
      refundAmount = 0,
      penalizeBuyer = false,
      penalizeSeller = false,
      penaltyReason = ''
    } = body

    if (!status || !resolution) {
      return NextResponse.json({ 
        error: 'Status and resolution are required' 
      }, { status: 400 })
    }

    // Get dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: true }
    })

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Use transaction for all updates
    const result = await prisma.$transaction(async (tx) => {
      // Update dispute
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status,
          resolution,
          refundAmount,
          resolvedAt: new Date(),
          resolvedBy: user.id
        }
      })

      // Handle refund if buyer favored
      if (status === 'RESOLVED_BUYER_FAVOR' && refundAmount > 0) {
        // Remove from seller's pending balance
        await tx.user.update({
          where: { id: dispute.sellerId },
          data: {
            pendingBalance: { decrement: refundAmount }
          }
        })

        // Add to buyer's available balance
        await tx.user.update({
          where: { id: dispute.buyerId },
          data: {
            availableBalance: { increment: refundAmount }
          }
        })

        // Create refund transaction
        await tx.transaction.create({
          data: {
            userId: dispute.buyerId,
            type: 'CREDIT',
            amount: refundAmount,
            description: `Refund from dispute resolution (Order: ${dispute.order.orderNumber})`,
            reference: `DISPUTE-REFUND-${disputeId}`,
            balanceBefore: 0,
            balanceAfter: refundAmount
          }
        })
      }

      // Penalize buyer if needed
      if (penalizeBuyer) {
        await tx.penalty.create({
          data: {
            userId: dispute.buyerId,
            action: 'WARNING',
            reason: penaltyReason || 'False dispute claim',
            pointsAdded: 2,
            disputeId: disputeId,
            issuedBy: user.id
          }
        })

        await tx.user.update({
          where: { id: dispute.buyerId },
          data: {
            penaltyPoints: { increment: 2 },
            warningCount: { increment: 1 },
            lastWarningAt: new Date()
          }
        })
      }

      // Penalize seller if needed
      if (penalizeSeller) {
        const penaltyPoints = status === 'RESOLVED_BUYER_FAVOR' ? 3 : 2

        await tx.penalty.create({
          data: {
            userId: dispute.sellerId,
            action: status === 'RESOLVED_BUYER_FAVOR' ? 'TEMP_BAN_1DAY' : 'WARNING',
            reason: penaltyReason || 'Dispute resolved against seller',
            pointsAdded: penaltyPoints,
            disputeId: disputeId,
            issuedBy: user.id,
            bannedUntil: status === 'RESOLVED_BUYER_FAVOR' 
              ? new Date(Date.now() + 24 * 60 * 60 * 1000) 
              : null
          }
        })

        await tx.user.update({
          where: { id: dispute.sellerId },
          data: {
            penaltyPoints: { increment: penaltyPoints },
            warningCount: { increment: 1 },
            lastWarningAt: new Date(),
            ...(status === 'RESOLVED_BUYER_FAVOR' && {
              isSuspended: true,
              suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day ban
            })
          }
        })
      }

      // Mark order as no longer disputed
      await tx.order.update({
        where: { id: dispute.orderId },
        data: { isDisputed: false }
      })

      return updatedDispute
    })

    return NextResponse.json({ 
      success: true,
      dispute: result,
      message: 'Dispute resolved successfully' 
    })
  } catch (error) {
    console.error('Error resolving dispute:', error)
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 })
  }
}