// app/api/admin/reports/[id]/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import { ReportStatus } from '@prisma/client'

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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, actionNotes, penalizeReported, penaltyReason } = await req.json()

    const report = await prisma.report.findUnique({
      where: { id: params.id }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // Update report
      await tx.report.update({
        where: { id: params.id },
        data: {
          status: 'RESOLVED' as ReportStatus,
          adminNotes: `Action: ${action}\n${actionNotes || ''}`,
          resolvedAt: new Date(),
          resolvedBy: admin.userId
        }
      })

      // Apply penalties if needed
      if (penalizeReported && report.reportedUserId) {
        const penaltyPoints = action === 'BAN' ? 10 : action === 'SUSPEND' ? 5 : 2
        const penaltyAction = action === 'BAN' ? 'PERMANENT_BAN' : action === 'SUSPEND' ? 'TEMP_BAN_7DAYS' : 'WARNING'
        
        await tx.penalty.create({
          data: {
            userId: report.reportedUserId,
            action: penaltyAction,
            reason: penaltyReason || actionNotes || `Report resolution: ${action}`,
            pointsAdded: penaltyPoints,
            reportId: params.id,
            issuedBy: admin.userId
          }
        })

        await tx.user.update({
          where: { id: report.reportedUserId },
          data: {
            penaltyPoints: { increment: penaltyPoints },
            ...(action === 'BAN' && { isSuspended: true }),
            ...(action === 'SUSPEND' && {
              isSuspended: true,
              suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            })
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resolve report error:', error)
    return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 })
  }
}