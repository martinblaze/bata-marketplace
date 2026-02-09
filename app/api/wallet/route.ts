// app/api/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get fresh user data with balances and completed orders
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        availableBalance: true,
        pendingBalance: true,
        completedOrders: true,
        role: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      wallet: {
        availableBalance: Math.max(0, userData.availableBalance),
        pendingBalance: Math.max(0, userData.pendingBalance),
        completedOrders: userData.completedOrders,
        role: userData.role,
      },
    })
  } catch (error) {
    console.error('Fetch wallet error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    )
  }
}