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
      { error: 'حدث خطأ في جلب الاشتراكات' },
      { status: 500 }
    );
  }
}

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
        { error: 'جميع الحقول مطلوبة: userId, planId, startDate, endDate' },
        { status: 400 }
      );
    }

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
      { error: 'حدث خطأ في إنشاء الاشتراك' },
      { status: 500 }
    );
  }
}