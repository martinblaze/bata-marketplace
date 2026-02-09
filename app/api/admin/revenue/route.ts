// app/api/admin/revenue/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null

    try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        if (decoded.role !== 'ADMIN') return null
        return decoded
    } catch {
        return null
    }
}

export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req)
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const [totalRevenue, monthRevenue, topSellers, totalPlatformFees] = await Promise.all([
            prisma.order.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { totalAmount: true }
            }),
            prisma.order.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: thisMonth }
                },
                _sum: { totalAmount: true }
            }),
            prisma.order.groupBy({
                by: ['sellerId'],
                where: { status: 'COMPLETED' },
                _sum: { totalAmount: true },
                _count: true,
                orderBy: { _sum: { totalAmount: 'desc' } },
                take: 10
            }),
            // ✅ CORRECTED: Sum the actual platformCommission field from completed orders
            prisma.order.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { platformCommission: true }
            })
        ])

        const sellersWithDetails = await Promise.all(
            topSellers.map(async (s) => {
                const seller = await prisma.user.findUnique({
                    where: { id: s.sellerId },
                    select: { name: true, phone: true }
                })
                return {
                    name: seller?.phone || seller?.name || 'Unknown',
                    totalRevenue: s._sum.totalAmount || 0,
                    totalOrders: s._count
                }
            })
        )

        const total = totalRevenue._sum.totalAmount || 0
        const platformFee = totalPlatformFees._sum.platformCommission || 0 // ✅ Use actual stored commission

        return NextResponse.json({
            revenue: {
                total,
                thisMonth: monthRevenue._sum.totalAmount || 0,
                platformFee, // This now correctly includes 5%/10% + ₦240 per order
                topSellers: sellersWithDetails
            }
        })
    } catch (error) {
        console.error('Revenue fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 })
    }
}