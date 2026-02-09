import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOTP, sendSMSOTP, sendEmailOTP, formatPhone } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, email, name, isLogin } = body

    // Validate input
    if (!phone && !email) {
      return NextResponse.json(
        { error: 'Phone or email is required' },
        { status: 400 }
      )
    }

    // Check if user exists (for login)
    if (isLogin) {
      const user = await prisma.user.findFirst({
        where: phone ? { phone: formatPhone(phone) } : { email },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Account not found. Please sign up first.' },
          { status: 404 }
        )
      }
    } else {
      // Check if user already exists (for signup)
      const existingUser = await prisma.user.findFirst({
        where: phone ? { phone: formatPhone(phone) } : { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Account already exists. Please login instead.' },
          { status: 400 }
        )
      }
    }

    // Generate and save OTP
    const otpCode = await createOTP(phone ? formatPhone(phone) : undefined, email)

    // Send OTP
    if (phone) {
      await sendSMSOTP(formatPhone(phone), otpCode)
    } else if (email) {
      await sendEmailOTP(email, otpCode)
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}
