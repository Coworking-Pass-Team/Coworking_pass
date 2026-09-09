import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";




/**
 * @swagger
 * /api/payment-gateway/refund:
 *   post:
 *     summary: محاكاة استرجاع مالي عبر بوابة الدفع (يستغرق 3-5 أيام عمل)
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
 *         description: تم بدء عملية الاسترجاع (حالة PENDING)
 */
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();

    const { transactionId, amount, userId } = await request.json()

    if (!transactionId || !amount || !userId) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // ⏳ محاكاة معالجة الاسترجاع من بوابة الدفع
    // في الواقع، هنا سيتم الاتصال بـ Mada / Visa / إلخ

    // محاكاة التأخير (3-5 أيام عمل)
    const processingDays = Math.floor(Math.random() * 3) + 3

    return NextResponse.json({
      success: true,
      message: `تم قبول طلب الاسترجاع. سيتم المعالجة خلال ${processingDays} أيام عمل`,
      transactionId,
      status: 'PENDING',
      estimatedCompletion: new Date(Date.now() + processingDays * 24 * 60 * 60 * 1000)
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error processing gateway refund:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في التواصل مع بوابة الدفع' },
      { status: 500 }
    )
  }
}