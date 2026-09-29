import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: عرض أو إدارة محفظة المستخدم
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: نجح
 */
// GET: جلب رصيد المحفظة
export async function GET(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      )
    }

    if (user.role !== 'SUPER_ADMIN' && user.userId !== userId) {
      return NextResponse.json({ error: 'You can only view your own wallet.' }, { status: 403 })
    }

    // جلب أو إنشاء محفظة للمستخدم
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0
        },
        include: {
          transactions: true
        }
      })
    }

    return NextResponse.json({
      userId,
      balance: wallet.balance,
      currency: 'SAR',
      transactions: wallet.transactions || []
    })

  } catch (error) {
    console.error('❌ Error fetching wallet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet.' },
      { status: 500 }
    )
  }
}

// POST: إيداع/سحب/استرجاع من المحفظة
export async function POST(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { userId, amount, type, description, referenceId } = await request.json()

    if (!userId || !amount || !type) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
    }

    if (user.role !== 'SUPER_ADMIN' && user.userId !== userId) {
      return NextResponse.json({ error: 'You can only modify your own wallet.' }, { status: 403 })
    }

    const typeUpper = (type || '').toString().toUpperCase();
    const isCredit = typeUpper === 'DEPOSIT' || typeUpper === 'REFUND';

    // جلب أو إنشاء محفظة
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 }
      })
    }

    // Atomic update: debits are conditional on sufficient balance so concurrent requests cannot overdraw
    if (!isCredit) {
      const debited = await prisma.wallet.updateMany({
        where: { userId, balance: { gte: amount } },
        data: { balance: { decrement: amount } }
      })
      if (debited.count === 0) {
        return NextResponse.json(
          { error: 'Insufficient balance.' },
          { status: 400 }
        )
      }
    } else {
      await prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } }
      })
    }

    const updatedWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } })
    const newBalance = updatedWallet.balance

    // تسجيل المعاملة
    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        amount,
        type: typeUpper,
        description: description || (typeUpper === 'DEPOSIT' ? 'Deposit' : typeUpper === 'REFUND' ? 'Refund' : 'Withdrawal'),
        referenceId: referenceId || null,
        balanceAfter: newBalance
      }
    })

    return NextResponse.json({
      message: isCredit ? 'Amount credited successfully' : 'Amount debited successfully',
      balance: updatedWallet.balance,
      transaction
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error processing wallet:', error)
    return NextResponse.json(
      { error: 'Failed to process wallet transaction.' },
      { status: 500 }
    )
  }
}