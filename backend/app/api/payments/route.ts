import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { id: 'desc' }  
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error('❌ Error fetching payments:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المدفوعات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, method, paymentFor, referenceId, status = 'SUCCESS' } = body  

    if (!userId || !amount || !method || !paymentFor) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        userId,           
        amount,
        method,
        paymentFor,       
        referenceId,      
        status,
        gatewayTransactionId: `TX-${Date.now()}`  
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating payment:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الدفع' },
      { status: 500 }
    )
  }
}