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
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
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
      { error: 'حدث خطأ في جلب المحفظة' },
      { status: 500 }
    )
  }
}

// POST: إيداع/سحب/استرجاع من المحفظة
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { userId, amount, type, description, referenceId } = await request.json()

    if (!userId || !amount || !type) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
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

    // التحقق من الرصيد في حالة السحب
    if (!isCredit && wallet.balance < amount) {
      return NextResponse.json(
        { error: 'رصيد غير كافٍ' },
        { status: 400 }
      )
    }

    // تحديث الرصيد
    const newBalance = isCredit
      ? wallet.balance + amount
      : wallet.balance - amount

    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: { balance: newBalance }
    })

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
      { error: 'حدث خطأ في معاملة المحفظة' },
      { status: 500 }
    )
  }
}