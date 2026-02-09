import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, formatPhone } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, password, idDocument } = body

    // Check if rider already exists
    const existingUser = await prisma.user.findFirst({
      where: { phone: formatPhone(phone) },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create rider account
    const rider = await prisma.user.create({
      data: {
        name,
        phone: formatPhone(phone),
        email: email || undefined,
        password: hashedPassword,
        role: 'RIDER',
        riderIdDocument: idDocument,
        isRiderVerified: false, // Admin must verify
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Rider registration successful. Pending admin verification.',
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
      },
    })
  } catch (error) {
    console.error('Rider registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}