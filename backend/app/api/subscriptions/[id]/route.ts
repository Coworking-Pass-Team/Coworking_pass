import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { id } = await params
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        plan: true
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('❌ Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'An error occurred.' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   put:
 *     summary: تعديل اشتراك
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, CANCELLED, EXPIRED]
 *     responses:
 *       200:
 *         description: تم تعديل الاشتراك
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();
    const { planId, startDate, endDate, visitsUsed, status } = body;

    const dataToUpdate: Record<string, any> = {};
    if (planId !== undefined) dataToUpdate.planId = planId;
    if (startDate !== undefined) dataToUpdate.startDate = new Date(startDate);
    if (endDate !== undefined) dataToUpdate.endDate = new Date(endDate);
    if (visitsUsed !== undefined) dataToUpdate.visitsUsed = Number(visitsUsed);
    if (status !== undefined) dataToUpdate.status = status;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        plan: true,
      },
    });
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription or not found.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   delete:
 *     summary: إلغاء اشتراك واسترجاعه (فترة سماح 3 أيام بشرط عدم استخدام أي زيارة)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم إلغاء الاشتراك واسترجاع مبلغه لمحفظة العميل
 *       400:
 *         description: تجاوز مهلة الاسترجاع (3 أيام) أو تم استهلاك زيارات بالفعل
 *       404:
 *         description: الاشتراك غير موجود
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // 1. Fetch subscription with user data and plan
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { 
        user: true,
        plan: true
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found.' },
        { status: 404 }
      );
    }

    // 2. Cancellation check (Super Admin can bypass)
    const isAdmin = user && user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      // Check 1: Ensure no visits have been consumed
      if (subscription.visitsUsed > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot cancel or refund subscription because visits have already been used.' 
          },
          { status: 400 }
        );
      }

      // Check 2: Cooling-off period: must be within 3 days (72 hours) of startDate
      const now = new Date();
      const startDate = new Date(subscription.startDate);
      if (startDate <= now) {
        const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceStart > 72) {
          return NextResponse.json(
            { 
              error: 'Refund period expired. Subscriptions can only be cancelled and refunded within 3 days (72 hours) of start date with zero visits used.' 
            },
            { status: 400 }
          );
        }
      }
    }

    const refundAmount = subscription.plan?.price || 0;
    const targetUserId = subscription.userId;

    // 3. Delete / Cancel subscription
    await prisma.subscription.delete({
      where: { id }
    });

    // 4. Automatic refund to user's wallet if plan has a monetary value
    let newBalance = 0;
    if (refundAmount > 0) {
      // Record payment transaction as REFUND
      await prisma.payment.create({
        data: {
          userId: targetUserId,
          amount: refundAmount,
          method: 'REFUND',
          paymentFor: 'REFUND',
          referenceId: id,
          status: 'SUCCESS',
          gatewayTransactionId: `REF-SUB-${Date.now()}`
        }
      });

      // Credit wallet
      let wallet = await prisma.wallet.findUnique({
        where: { userId: targetUserId }
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId: targetUserId,
            balance: 0
          }
        });
      }

      newBalance = wallet.balance + refundAmount;
      await prisma.wallet.update({
        where: { userId: targetUserId },
        data: { balance: newBalance }
      });

      // Record wallet ledger transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: targetUserId,
          amount: refundAmount,
          type: 'REFUND',
          description: `Refund for cancelled subscription (${subscription.plan?.planName || 'Universal Pass'})`,
          referenceId: id,
          balanceAfter: newBalance
        }
      });

      // In-app notification
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'PAYMENT_SUCCESS',
          title: 'Subscription Refunded',
          message: `Your subscription (${subscription.plan?.planName || 'Universal Pass'}) has been cancelled and refunded. SAR ${refundAmount} has been credited to your wallet.`,
          channel: 'IN_APP',
          sentAt: new Date()
        }
      });
    }

    return NextResponse.json(
      { 
        message: 'Subscription cancelled and refunded successfully.',
        refundAmount,
        walletBalance: newBalance
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription or not found.' },
      { status: 500 }
    );
  }
}