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
      where: { userId }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0
        }
      })
    }

    return NextResponse.json({
      userId,
      balance: wallet.balance,
      currency: 'SAR'
    })

  } catch (error) {
    console.error('❌ Error fetching wallet:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المحفظة' },
      { status: 500 }
    )
  }
}

// POST: إيداع/سحب من المحفظة
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
    if (type === 'WITHDRAW' && wallet.balance < amount) {
      return NextResponse.json(
        { error: 'رصيد غير كافٍ' },
        { status: 400 }
      )
    }

    // تحديث الرصيد
    const newBalance = type === 'DEPOSIT'
      ? wallet.balance + amount
      : wallet.balance - amount

    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: { balance: newBalance }
    })

    // تسجيل المعاملة
    await prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type,
        description: description || (type === 'DEPOSIT' ? 'إيداع' : 'سحب'),
        referenceId: referenceId || null,
        balanceAfter: newBalance
      }
    })

    return NextResponse.json({
      message: type === 'DEPOSIT' ? 'تم الإيداع بنجاح' : 'تم السحب بنجاح',
      balance: updatedWallet.balance
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error processing wallet:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في معاملة المحفظة' },
      { status: 500 }
    )
  }
}