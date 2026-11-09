import { settleCheckout } from "@/lib/security/checkout";
import { idempotent } from "@/lib/security/idempotency";
import { money, positiveInteger, inputResponse, InputError } from "@/lib/security/input";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return unauthorizedResponse(request);
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    // Subscriptions carry customer names and emails: only super admins may list other users' passes
    const canViewOthers = user.role === 'SUPER_ADMIN';
    const userIdFilter = (requestedUserId && (canViewOthers || requestedUserId === user.userId))
      ? requestedUserId
      : (canViewOthers ? undefined : user.userId);

    const whereClause: Prisma.SubscriptionWhereInput = {};
    if (userIdFilter) {
      whereClause.userId = userIdFilter;
    }

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        plan: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: إنشاء اشتراك جديد
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, planId, startDate, endDate]
 *             properties:
 *               userId:
 *                 type: string
 *               planId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 example: "2026-09-01"
 *               endDate:
 *                 type: string
 *                 example: "2026-10-01"
 *     responses:
 *       201:
 *         description: تم تفعيل الاشتراك بنجاح
 *       400:
 *         description: بيانات غير صحيحة أو عدم توافق نوع الباقة
 *       404:
 *         description: المستخدم أو الخطة غير موجودة
 */
export const POST = idempotent("subscriptions", async (request, db) => {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) {
      return unauthorizedResponse(request);
    }

    const body = await request.json();
    const { userId, planId } = body;

    const effectiveUserId = (user && user.role === 'SUPER_ADMIN' && userId) ? userId : (user ? user.userId : null);

    if (!effectiveUserId || !planId) {
      return NextResponse.json(
        { error: 'A planId is required.' },
        { status: 400 }
      );
    }

    //  BE-08: فحص جمهور الباقة (B2C vs B2B)
    const [userData, plan] = await Promise.all([
      db.user.findUnique({
        where: { id: effectiveUserId },
        select: { id: true, companyId: true, role: true }
      }),
      db.membershipPlan.findUnique({
        where: { id: planId },
        select: { id: true, type: true, planName: true, price: true, durationDays: true }
      })
    ]);

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found.' },
        { status: 404 }
      );
    }

    // B2C: للأفراد فقط (بدون شركة)
    if (plan.type === 'B2C' && userData.companyId) {
      return NextResponse.json(
        { error: 'This plan is for individual members only. Your account belongs to a company team, so passes are arranged by your company.' },
        { status: 400 }
      );
    }

    // B2B: للمؤسسات فقط (مرتبط بشركة)
    if (plan.type === 'B2B' && !userData.companyId) {
      return NextResponse.json(
        { error: 'This plan is for companies only. Your account must belong to a company.' },
        { status: 400 }
      );
    }

    // إنشاء الاشتراك
    // Validity comes from the purchased catalog plan.
    const starts = new Date();
    const ends = new Date(starts);
    ends.setUTCDate(ends.getUTCDate() + positiveInteger(plan.durationDays, 30, 366));
    const subscription = await db.subscription.create({
      data: {
        userId: effectiveUserId,
        planId,
        payableAmount: money(plan.price),
        startDate: starts,
        endDate: ends,
        status: 'ACTIVE',
        visitsUsed: 0,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        plan: true,
      },
    });

    await settleCheckout(db, effectiveUserId, subscription.id, "SUBSCRIPTION", money(plan.price));
    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    const invalid = inputResponse(error);
    if (invalid) return invalid;
    console.error('❌ Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription.' },
      { status: 500 }
    );
  }
});
