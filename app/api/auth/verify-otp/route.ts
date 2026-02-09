import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP, generateToken, formatPhone } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, email, code, name } = body

    if (!code) {
      return NextResponse.json({ error: 'OTP code is required' }, { status: 400 })
    }

    // Verify OTP
    const isValid = await verifyOTP(
      phone ? formatPhone(phone) : undefined,
      email,
      code
    )

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: phone ? { phone: formatPhone(phone) } : { email },
    })

    if (!user && name) {
      // Create new user (signup)
      user = await prisma.user.create({
        data: {
          phone: phone ? formatPhone(phone) : undefined,
          email: email || undefined,
          name,
          password: '', // FIXED: Added empty password for OTP-based auth
        },
      })
    } else if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate token
    const token = generateToken(user.id, user.phone)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        hostelName: user.hostelName,
      },
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}