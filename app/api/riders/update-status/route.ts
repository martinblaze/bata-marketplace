import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, status } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (order?.riderId !== user.id) {
      return NextResponse.json({ error: 'Not your delivery' }, { status: 403 })
    }

    // 🔥 FIX: Prepare update data with deliveredAt timestamp
    const updateData: any = { status }
    
    // When rider marks as DELIVERED, set the deliveredAt timestamp
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    })

    // Rider marks as delivered, but payment NOT released until buyer confirms
    if (status === 'DELIVERED') {
      await prisma.user.update({
        where: { id: user.id },
        data: { completedOrders: { increment: 1 } },
      })
    }

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json({ 
      error: 'Failed to update status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}