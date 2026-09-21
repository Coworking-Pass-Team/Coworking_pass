import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'




/**
 * @swagger
 * /api/mock-payment:
 *   post:
 *     summary: محاكاة استجابة بوابة دفع
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: استجابة عشوائية (SUCCESS أو FAILED)، بنسبة نجاح تقارب 95%
 */
// POST: محاكاة عملية دفع
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, method = 'VISA', paymentFor, referenceId } = body

    if (!userId || !amount || !paymentFor) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    // محاكاة تأخير الدفع (0.5 - 1.5 ثانية)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // 95% نجاح، 5% فشل (محاكاة واقعية)
    const isSuccess = Math.random() < 0.95

    if (!isSuccess) {
      return NextResponse.json(
        { 
          status: 'FAILED',
          message: 'Payment failed, please try again.'
        },
        { status: 402 }
      )
    }

    // تسجيل الدفع في قاعدة البيانات
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        method,
        paymentFor,
        referenceId,
        status: 'SUCCESS',
        gatewayTransactionId: `MOCK-${Date.now()}`
      }
    })

    return NextResponse.json({
      status: 'SUCCESS',
      message: 'Payment successful ✅',
      transactionId: payment.gatewayTransactionId,
      payment
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Mock Payment Error:', error)
    return NextResponse.json(
      { error: 'Failed to simulate payment.' },
      { status: 500 }
    )
  }
}