import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const userIdFilter = searchParams.get('userId') || (user && user.role !== 'SUPER_ADMIN' ? user.userId : undefined);

    const whereClause: any = {};
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
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { userId, planId, startDate, endDate, status = 'ACTIVE' } = body;

    const effectiveUserId = userId || (user ? user.userId : null);

    if (!effectiveUserId || !planId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'All fields are required: userId, planId, startDate, endDate' },
        { status: 400 }
      );
    }

    //  BE-08: فحص جمهور الباقة (B2C vs B2B)
    const [userData, plan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: effectiveUserId },
        select: { id: true, companyId: true, role: true }
      }),
      prisma.membershipPlan.findUnique({
        where: { id: planId },
        select: { id: true, type: true, planName: true }
      })
    ]);

    if (!userData) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'الخطة غير موجودة' },
        { status: 404 }
      );
    }

    // B2C: للأفراد فقط (بدون شركة)
    if (plan.type === 'B2C' && userData.companyId) {
      return NextResponse.json(
        { error: 'هذه الباقة مخصصة للأفراد فقط. أنت مرتبط بشركة.' },
        { status: 400 }
      );
    }

    // B2B: للمؤسسات فقط (مرتبط بشركة)
    if (plan.type === 'B2B' && !userData.companyId) {
      return NextResponse.json(
        { error: 'هذه الباقة مخصصة للمؤسسات فقط. يجب أن تكون مرتبطاً بشركة.' },
        { status: 400 }
      );
    }

    // إنشاء الاشتراك
    const subscription = await prisma.subscription.create({
      data: {
        userId: effectiveUserId,
        planId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status === 'ACTIVE' || status === 'EXPIRED' || status === 'CANCELLED' ? status : 'ACTIVE',
        visitsUsed: 0,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        plan: true,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription.' },
      { status: 500 }
    );
  }
}