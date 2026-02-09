import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'

// Generate JWT token
export function generateToken(userId: string, phone: string): string {
  return jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: '30d' })
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; phone: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string }
  } catch (error) {
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Format phone number to international format
export function formatPhone(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format as Nigerian number
  if (digits.startsWith('234')) {
    return `+${digits}`
  } else if (digits.startsWith('0')) {
    return `+234${digits.slice(1)}`
  }
  return `+234${digits}`
}

// Generate OTP code
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create OTP in database
export async function createOTP(phone?: string, email?: string): Promise<string> {
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.oTP.create({
    data: {
      phone,
      email,
      code,
      expiresAt,
    },
  })

  return code
}

// Verify OTP
export async function verifyOTP(phone: string | undefined, email: string | undefined, code: string): Promise<boolean> {
  const otp = await prisma.oTP.findFirst({
    where: {
      OR: [
        { phone, code, isUsed: false },
        { email, code, isUsed: false },
      ],
      expiresAt: { gt: new Date() },
    },
  })

  if (!otp) return false

  // Mark as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { isUsed: true },
  })

  return true
}

// Send OTP via SMS (Twilio)
export async function sendSMSOTP(phone: string, code: string): Promise<boolean> {
  try {
    // In production, use Twilio
    if (process.env.TWILIO_ACCOUNT_SID) {
      const twilio = require('twilio')
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      
      await client.messages.create({
        body: `Your BATA verification code is: ${code}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      })
    } else {
      // Development: Log to console
      console.log(`📱 SMS OTP for ${phone}: ${code}`)
    }
    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return false
  }
}

// Send OTP via Email (Nodemailer)
export async function sendEmailOTP(email: string, code: string): Promise<boolean> {
  try {
    if (process.env.EMAIL_HOST) {
      const nodemailer = require('nodemailer')
      
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'BATA Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366F1;">BATA Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #6366F1; font-size: 32px; letter-spacing: 5px;">${code}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      })
    } else {
      // Development: Log to console
      console.log(`📧 Email OTP for ${email}: ${code}`)
    }
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

// Get user from token in request
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const decoded = verifyToken(token)
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      matricNumber: true,
      profilePhoto: true,
      role: true,
      hostelName: true,
      roomNumber: true,
      landmark: true,
      trustLevel: true,
      avgRating: true,        // Fixed: Changed from 'rating'
      totalReviews: true,     // Fixed: Changed from 'totalRatings'
      completedOrders: true,
      pendingBalance: true,
      availableBalance: true,
      penaltyPoints: true,
      isSuspended: true,
      suspendedUntil: true,
      isRiderVerified: true,
      isAvailable: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return user
}