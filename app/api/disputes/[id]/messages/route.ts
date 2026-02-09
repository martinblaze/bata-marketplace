// app/api/disputes/[id]/messages/route.ts
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

// GET: Fetch all messages for a dispute (THIS WAS MISSING!)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: disputeId } = params

    // Get dispute to verify user access
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true
      }
    })

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Check user is involved in dispute or is admin
    const isInvolved = 
      user.id === dispute.buyerId || 
      user.id === dispute.sellerId ||
      user.role === 'ADMIN'

    if (!isInvolved) {
      return NextResponse.json({ error: 'Not authorized to view these messages' }, { status: 403 })
    }

    // Fetch all messages for this dispute
    const messages = await prisma.disputeMessage.findMany({
      where: { disputeId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ 
      success: true,
      messages,
      count: messages.length
    })
  } catch (error) {
    console.error('Error fetching dispute messages:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST: Add message to dispute
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: disputeId } = params
    const body = await req.json()
    const { message, attachments = [], sellerEvidence = [] } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: true }
    })

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Check user is involved in dispute
    const isInvolved = 
      user.id === dispute.buyerId || 
      user.id === dispute.sellerId ||
      user.role === 'ADMIN'

    if (!isInvolved) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Determine sender type
    let senderType = 'BUYER'
    if (user.id === dispute.sellerId) {
      senderType = 'SELLER'
    } else if (user.role === 'ADMIN') {
      senderType = 'ADMIN'
    }

    // Create message
    const disputeMessage = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: user.id,
        senderType,
        message,
        attachments
      }
    })

    // If seller is responding for the first time, update dispute status and save evidence
    if (senderType === 'SELLER') {
      const updateData: any = {}
      
      // Add seller evidence if provided
      if (sellerEvidence.length > 0) {
        updateData.sellerEvidence = sellerEvidence
      }
      
      // Update status to UNDER_REVIEW if still OPEN
      if (dispute.status === 'OPEN') {
        updateData.status = 'UNDER_REVIEW'
      }
      
      // Only update if there's data to update
      if (Object.keys(updateData).length > 0) {
        await prisma.dispute.update({
          where: { id: disputeId },
          data: updateData
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: disputeMessage 
    })
  } catch (error) {
    console.error('Error adding dispute message:', error)
    return NextResponse.json({ 
      error: 'Failed to add message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}