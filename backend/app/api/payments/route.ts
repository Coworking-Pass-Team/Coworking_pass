import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
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
/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: تسجيل دفعة
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount, method, paymentFor]
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [MADA, VISA, APPLE_PAY, SAMSUNG_PAY]
 *               paymentFor:
 *                 type: string
 *                 enum: [DIRECT_BOOKING, HOURLY_BOOKING, SUBSCRIPTION, POINTS_REDEMPTION]
 *               referenceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم تسجيل الدفعة
 */
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
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