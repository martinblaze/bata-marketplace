// app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      type,
      reason,
      description,
      evidence = [],
      reportedUserId,
      reportedProductId,
      reportedOrderId
    } = body

    // Validation
    if (!type || !reason || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        type,
        reason,
        description,
        evidence,
        reporterId: user.id,
        reportedUserId: reportedUserId || null,
        reportedProductId: reportedProductId || null,
        reportedOrderId: reportedOrderId || null,
        status: 'PENDING'
      }
    })

    console.log('Report created:', report.id)

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully'
    })
  } catch (error) {
    console.error('Report submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch user's reports
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.report.findMany({
      where: { reporterId: user.id },
      include: {
        reportedUser: {
          select: { name: true, phone: true }
        },
        reportedProduct: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Fetch reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}