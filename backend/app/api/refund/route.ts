import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { ensureDatabaseSchema } from "@/lib/db-schema-sync";
import { creditWallet } from "@/lib/wallet";

/**
 * @swagger
 * /api/refund:
 *   post:
 *     summary: Refund a cancelled booking or subscription into the owner's wallet (atomic)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *               subscriptionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund credited
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    const { bookingId, subscriptionId } = await request.json()
    if (!bookingId && !subscriptionId) {
      return NextResponse.json({ error: 'Either bookingId or subscriptionId is required.' }, { status: 400 })
    }

    // Make sure the ledger table exists before the first refund after a deploy
    await ensureDatabaseSchema().catch(() => undefined)

    const isAdmin = user.role === 'SUPER_ADMIN'

    // ============ Subscription / pass refund ============
    if (subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true },
      })
      if (!subscription) {
        return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 })
      }
      if (!isAdmin && subscription.userId !== user.userId) {
        return NextResponse.json({ error: 'You are not allowed to refund this subscription.' }, { status: 403 })
      }
      if (subscription.status === 'CANCELLED') {
        return NextResponse.json({ error: 'This subscription has already been cancelled and refunded.' }, { status: 400 })
      }
      if (subscription.visitsUsed > 0 && !isAdmin) {
        return NextResponse.json({ error: 'Cannot refund subscription because visits have already been used.' }, { status: 400 })
      }
      const hoursSinceStart = (Date.now() - new Date(subscription.startDate).getTime()) / 3_600_000
      if (!isAdmin && hoursSinceStart > 72) {
        return NextResponse.json(
          { error: 'Refund period expired. Subscriptions can only be refunded within 3 days (72 hours) of start date with zero visits used.' },
          { status: 400 }
        )
      }

      const originalPayment = await prisma.payment.findFirst({
        where: { referenceId: subscriptionId, status: 'SUCCESS', NOT: { paymentFor: 'REFUND' } },
        orderBy: { createdAt: 'desc' },
      })
      const refundAmount = originalPayment?.amount ?? subscription.plan?.price ?? 0
      const planName = subscription.plan?.planName || 'Pass'

      const result = await prisma.$transaction(async (tx) => {
        // Conditional update: only the first request can flip the status, so a refund can never be credited twice
        const cancelled = await tx.subscription.updateMany({
          where: { id: subscriptionId, NOT: { status: 'CANCELLED' } },
          data: { status: 'CANCELLED' },
        })
        if (cancelled.count === 0) return null

        const credit = await creditWallet(tx, {
          userId: subscription.userId,
          amount: refundAmount,
          type: 'REFUND',
          description: `Refund for cancelled subscription (${planName})`,
          referenceId: subscriptionId,
        })
        await tx.payment.create({
          data: {
            userId: subscription.userId,
            amount: refundAmount,
            method: 'REFUND',
            paymentFor: 'REFUND',
            referenceId: subscriptionId,
            status: 'SUCCESS',
            gatewayTransactionId: `REF-SUB-${Date.now()}`,
          },
        })
        await tx.notification.create({
          data: {
            userId: subscription.userId,
            type: 'PAYMENT_SUCCESS',
            title: 'Subscription Refunded',
            message: `Refund of SAR ${refundAmount} for your subscription has been credited to your wallet.`,
            channel: 'IN_APP',
            sentAt: new Date(),
          },
        })
        return credit
      })

      if (!result) {
        return NextResponse.json({ error: 'This subscription has already been cancelled and refunded.' }, { status: 400 })
      }
      return NextResponse.json({
        message: 'Subscription refunded successfully',
        refundAmount,
        walletTarget: result.target,
        companyId: result.companyId,
        walletBalance: result.balance,
      }, { status: 200 })
    }

    // ============ Booking refund (direct or hourly) ============
    const direct = await prisma.directBooking.findUnique({ where: { id: bookingId }, include: { user: true } })
    const hourly = direct ? null : await prisma.hourlyBooking.findUnique({ where: { id: bookingId }, include: { user: true } })
    const booking = direct || hourly
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }
    if (!isAdmin && booking.userId !== user.userId) {
      return NextResponse.json({ error: 'You are not allowed to refund this booking.' }, { status: 403 })
    }
    if (direct?.status === 'REFUNDED') {
      return NextResponse.json({ error: 'This booking has already been refunded.' }, { status: 400 })
    }

    // Cancellation window: 6 hours for individuals, 24 hours for organizations
    if (!isAdmin) {
      const start = direct ? new Date(direct.bookingDate) : new Date(hourly!.startDate)
      const hoursDiff = (start.getTime() - Date.now()) / 3_600_000
      const requiredHours = booking.user?.role === 'B2C' ? 6 : 24
      if (hoursDiff < requiredHours && start > new Date()) {
        return NextResponse.json(
          { error: `Cancellation not allowed. Must cancel at least ${requiredHours} hours before booking time.` },
          { status: 400 }
        )
      }
    }

    // Refund exactly what was paid for this booking
    const originalPayment = await prisma.payment.findFirst({
      where: { referenceId: bookingId, status: 'SUCCESS', NOT: { paymentFor: 'REFUND' } },
      orderBy: { createdAt: 'desc' },
    })
    if (!originalPayment) {
      return NextResponse.json({ error: 'No payment found for this booking, nothing to refund.' }, { status: 404 })
    }
    const refundAmount = originalPayment.amount

    const result = await prisma.$transaction(async (tx) => {
      // Serialize concurrent refunds of the same booking, then make sure none has been issued yet
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bookingId}))`
      const alreadyRefunded = await tx.payment.findFirst({
        where: { referenceId: bookingId, paymentFor: 'REFUND', status: 'SUCCESS' },
      })
      if (alreadyRefunded) return null

      if (direct) {
        await tx.directBooking.update({ where: { id: bookingId }, data: { status: 'REFUNDED' } })
      } else {
        await tx.hourlyBooking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
      }

      const credit = await creditWallet(tx, {
        userId: booking.userId,
        amount: refundAmount,
        type: 'REFUND',
        description: `Refund for booking ${bookingId}`,
        referenceId: bookingId,
      })
      await tx.payment.create({
        data: {
          userId: booking.userId,
          workspaceId: originalPayment.workspaceId,
          amount: refundAmount,
          method: 'REFUND',
          paymentFor: 'REFUND',
          referenceId: bookingId,
          status: 'SUCCESS',
          gatewayTransactionId: `REF-${Date.now()}`,
        },
      })
      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: 'PAYMENT_SUCCESS',
          title: 'Amount Refunded',
          message: `Refund of SAR ${refundAmount} has been credited to your wallet.`,
          channel: 'IN_APP',
          sentAt: new Date(),
        },
      })
      return credit
    })

    if (!result) {
      return NextResponse.json({ error: 'This booking has already been refunded.' }, { status: 400 })
    }
    return NextResponse.json({
      message: 'Booking refunded successfully',
      refundAmount,
      walletTarget: result.target,
      companyId: result.companyId,
      walletBalance: result.balance,
    }, { status: 200 })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json({ error: 'Failed to process refund.' }, { status: 500 })
  }
}
