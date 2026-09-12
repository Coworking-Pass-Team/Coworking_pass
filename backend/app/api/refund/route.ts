import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

/**
 * @swagger
 * /api/refund:
 *   post:
 *     summary: تنفيذ استرجاع مالي (يحدّث الحجز إلى REFUNDED ويضيف المبلغ لمحفظة العميل)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, userId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               userId:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: تم الاسترجاع بنجاح
 *       400:
 *         description: خطأ في الطلب
 *       401:
 *         description: غير مصرح
 *       404:
 *         description: الحجز غير موجود
 *       500:
 *         description: خطأ في السيرفر
 */
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { bookingId, userId } = await request.json()

    if (!bookingId || !userId) {
      return NextResponse.json(
        { error: 'معرف الحجز والمستخدم مطلوبان' },
        { status: 400 }
      )
    }

    // 1. جلب الحجز مع بياناته
    const booking = await prisma.directBooking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'الحجز غير موجود' },
        { status: 404 }
      )
    }

    // 2. التحقق من أن الحجز قابل للاسترجاع
    if (booking.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'تم استرجاع هذا الحجز مسبقاً' },
        { status: 400 }
      )
    }

    // 3. حساب المبلغ (افتراضي)
    const refundAmount = 100

    // 4. تحديث حالة الحجز إلى REFUNDED
    const updatedBooking = await prisma.directBooking.update({
      where: { id: bookingId },
      data: { status: 'REFUNDED' }
    })

    // 5. تسجيل معاملة الاسترجاع
    await prisma.payment.create({
      data: {
        userId: userId,
        amount: refundAmount,
        method: 'REFUND',
        paymentFor: 'REFUND',
        referenceId: bookingId,
        status: 'SUCCESS',
        gatewayTransactionId: `REF-${Date.now()}`
      }
    })

    // 6. إضافة المبلغ إلى محفظة العميل
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

    const newBalance = wallet.balance + refundAmount

    await prisma.wallet.update({
      where: { userId },
      data: {
        balance: newBalance
      }
    })

    // 7. تسجيل معاملة المحفظة
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: userId,
        amount: refundAmount,
        type: 'REFUND',
        description: `استرجاع حجز ${bookingId}`,
        referenceId: bookingId,
        balanceAfter: newBalance
      }
    })

    //  8. إرسال إشعار للمستخدم 
    await prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT_SUCCESS',
        title: 'تم استرجاع المبلغ',
        message: `تم استرجاع مبلغ ${refundAmount} ريال إلى محفظتك بنجاح`,
        channel: 'IN_APP',
        sentAt: new Date()
      }
    })

    // 9. الرد النهائي
    return NextResponse.json({
      message: 'تم استرجاع الحجز بنجاح',
      booking: updatedBooking,
      refundAmount,
      walletBalance: newBalance
    }, { status: 200 })

  } catch (error) {
    console.error(' Error processing refund:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في عملية الاسترجاع' },
      { status: 500 }
    )
  }
}