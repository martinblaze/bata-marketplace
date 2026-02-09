// app/api/wallet/withdraw/route.ts
// Allows sellers and riders to withdraw their earnings

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, bankCode, accountNumber, accountName } = await request.json()

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid withdrawal amount' 
      }, { status: 400 })
    }

    if (!accountNumber || !bankCode || !accountName) {
      return NextResponse.json({ 
        error: 'Bank details required' 
      }, { status: 400 })
    }

    // Check minimum withdrawal (e.g., ₦1000)
    const minWithdrawal = 1000
    if (amount < minWithdrawal) {
      return NextResponse.json({ 
        error: `Minimum withdrawal is ₦${minWithdrawal}` 
      }, { status: 400 })
    }

    // Get fresh user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check balance
    if (currentUser.availableBalance < amount) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: ₦${currentUser.availableBalance}` 
      }, { status: 400 })
    }

    // For development: Mock withdrawal
    if (process.env.NODE_ENV === 'development') {
      await prisma.$transaction(async (tx) => {
        // Deduct from balance
        await tx.user.update({
          where: { id: user.id },
          data: {
            availableBalance: { decrement: amount },
          },
        })

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'WITHDRAWAL',
            amount: amount,
            description: `Withdrawal to ${accountName} (${accountNumber}) - DEV MODE`,
            reference: `WD-DEV-${Date.now()}`,
            balanceBefore: currentUser.availableBalance,
            balanceAfter: currentUser.availableBalance - amount,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Withdrawal successful (Dev Mode)',
        reference: `WD-DEV-${Date.now()}`,
      })
    }

    // Production: Use Paystack Transfer API
    
    // Step 1: Create transfer recipient
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    })

    const recipientData = await recipientResponse.json()

    if (!recipientData.status) {
      return NextResponse.json({ 
        error: recipientData.message || 'Failed to create recipient' 
      }, { status: 400 })
    }

    // Step 2: Initiate transfer
    const transferReference = `WD-${Date.now()}-${user.id.substr(0, 8)}`
    
    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amount * 100, // Paystack uses kobo
        recipient: recipientData.data.recipient_code,
        reason: `BATA withdrawal - ${accountName}`,
        reference: transferReference,
      }),
    })

    const transferData = await transferResponse.json()

    if (!transferData.status) {
      return NextResponse.json({ 
        error: transferData.message || 'Transfer failed' 
      }, { status: 400 })
    }

    // Step 3: Update database
    await prisma.$transaction(async (tx) => {
      // Deduct from balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          availableBalance: { decrement: amount },
        },
      })

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          amount: amount,
          description: `Withdrawal to ${accountName} (${accountNumber})`,
          reference: transferReference,
          balanceBefore: currentUser.availableBalance,
          balanceAfter: currentUser.availableBalance - amount,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      reference: transferReference,
      transferCode: transferData.data.transfer_code,
    })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ 
      error: 'Failed to process withdrawal' 
    }, { status: 500 })
  }
}