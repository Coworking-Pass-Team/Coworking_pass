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

    const { bookingId, subscriptionId, userId } = await request.json()

    if ((!bookingId && !subscriptionId) || !userId) {
      return NextResponse.json(
        { error: 'Either bookingId or subscriptionId, and userId are required.' },
        { status: 400 }
      )
    }

    // ============ 1. معالجة استرجاع الاشتراكات والباقات (Subscriptions) ============
    if (subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { user: true, plan: true }
      })

      if (!subscription) {
        return NextResponse.json(
          { error: 'Subscription not found.' },
          { status: 404 }
        )
      }

      if (subscription.status === 'CANCELLED') {
        return NextResponse.json(
          { error: 'This subscription has already been cancelled and refunded.' },
          { status: 400 }
        )
      }

      // شرط عدم الاستخدام
      if (subscription.visitsUsed > 0 && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Cannot refund subscription because visits have already been used.' },
          { status: 400 }
        )
      }

      // شرط فترة السماح (3 أيام / 72 ساعة)
      const now = new Date()
      const startDate = new Date(subscription.startDate)
      if (startDate <= now && user.role !== 'SUPER_ADMIN') {
        const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60)
        if (hoursSinceStart > 72) {
          return NextResponse.json(
            { error: 'Refund period expired. Subscriptions can only be refunded within 3 days (72 hours) of start date with zero visits used.' },
            { status: 400 }
          )
        }
      }

      const refundAmount = subscription.plan?.price || 100

      // تحديث حالة الاشتراك
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'CANCELLED' }
      })

      // تسجيل الدفعة كـ REFUND
      await prisma.payment.create({
        data: {
          userId: userId,
          amount: refundAmount,
          method: 'REFUND',
          paymentFor: 'REFUND',
          referenceId: subscriptionId,
          status: 'SUCCESS',
          gatewayTransactionId: `REF-SUB-${Date.now()}`
        }
      })

      // إيداع المبلغ في المحفظة
      let wallet = await prisma.wallet.findUnique({ where: { userId } })
      if (!wallet) {
        wallet = await prisma.wallet.create({ data: { userId, balance: 0 } })
      }

      const newBalance = wallet.balance + refundAmount
      await prisma.wallet.update({
        where: { userId },
        data: { balance: newBalance }
      })

      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: userId,
          amount: refundAmount,
          type: 'REFUND',
          description: `Refund for cancelled subscription (${subscription.plan?.planName || 'Universal Pass'})`,
          referenceId: subscriptionId,
          balanceAfter: newBalance
        }
      })

      await prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_SUCCESS',
          title: 'Subscription Refunded',
          message: `Refund of SAR ${refundAmount} for your subscription has been credited to your wallet.`,
          channel: 'IN_APP',
          sentAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Subscription refunded successfully',
        subscription: updatedSubscription,
        refundAmount,
        walletBalance: newBalance
      }, { status: 200 })
    }

    // ============ 2. معالجة استرجاع الحجوزات المباشرة (Direct Bookings) ============
    // 1. جلب الحجز مع بياناته
    const booking = await prisma.directBooking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 }
      )
    }

    // 2. التحقق من أن الحجز قابل للاسترجاع
    if (booking.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'This booking has already been refunded.' },
        { status: 400 }
      )
    }

    // فحص مهلة الإلغاء للحجز المباشر (6 ساعات للأفراد، 24 للمؤسسات)
    if (user.role !== 'SUPER_ADMIN') {
      const now = new Date()
      const bookingDate = new Date(booking.bookingDate)
      const hoursDiff = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      const requiredHours = booking.user?.role === 'B2C' ? 6 : 24
      if (hoursDiff < requiredHours && bookingDate > now) {
        return NextResponse.json(
          { error: `Cancellation not allowed. Must cancel at least ${requiredHours} hours before booking time.` },
          { status: 400 }
        )
      }
    }

    // 3. حساب المبلغ (افتراضي أو من الحجز)
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
        description: `Refund for booking ${bookingId}`,
        referenceId: bookingId,
        balanceAfter: newBalance
      }
    })

    //  8. إرسال إشعار للمستخدم 
    await prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Amount Refunded',
        message: `Refund of SAR ${refundAmount} has been credited to your wallet.`,
        channel: 'IN_APP',
        sentAt: new Date()
      }
    })

    // 9. الرد النهائي
    return NextResponse.json({
      message: 'Booking refunded successfully',
      booking: updatedBooking,
      refundAmount,
      walletBalance: newBalance
    }, { status: 200 })

  } catch (error) {
    console.error(' Error processing refund:', error)
    return NextResponse.json(
      { error: 'Failed to process refund.' },
      { status: 500 }
    )
  }
}