import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP, generateToken, formatPhone, hashPassword } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, email, name, password, otpCode, role } = body

    if (!otpCode || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify OTP
    const isValid = await verifyOTP(
      phone ? formatPhone(phone) : undefined,
      email,
      otpCode
    )

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: phone ? { phone: formatPhone(phone) } : { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with role
    const user = await prisma.user.create({
      data: {
        ...(phone && { phone: formatPhone(phone) }),
        ...(email && { email }),
        name,
        password: hashedPassword,
        role: role || 'BUYER',
      },
    })

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
        role: user.role,
        hostelName: user.hostelName,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}