import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: محاكاة عملية دفع
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, method = 'VISA', paymentFor, referenceId } = body

    if (!userId || !amount || !paymentFor) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
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
          message: 'فشلت عملية الدفع، يرجى المحاولة مرة أخرى'
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
      message: 'تم الدفع بنجاح ✅',
      transactionId: payment.gatewayTransactionId,
      payment
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Mock Payment Error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في محاكاة الدفع' },
      { status: 500 }
    )
  }
}