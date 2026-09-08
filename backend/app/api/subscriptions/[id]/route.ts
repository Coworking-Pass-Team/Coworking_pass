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
        { error: 'الاشتراك غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('❌ Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    )
  }
}

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
      { error: 'حدث خطأ في التحديث أو الاشتراك غير موجود' },
      { status: 500 }
    );
  }
}

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

    // 1. Fetch subscription with user data
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'الاشتراك غير موجود' },
        { status: 404 }
      );
    }

    // 2. Cancellation check (allow admin or respect policy)
    const isAdmin = user && user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const now = new Date();
      const startTime = new Date(subscription.startDate);
      const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const requiredHours = subscription.user.role === 'B2C' ? 6 : 24;

      if (hoursDiff < requiredHours && startTime > now) {
        return NextResponse.json(
          { 
            error: `لا يمكن الإلغاء. يجب الإلغاء قبل ${requiredHours} ساعة على الأقل من بداية الاشتراك` 
          },
          { status: 400 }
        );
      }
    }

    // 3. Delete / Cancel subscription
    await prisma.subscription.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'تم إلغاء الاشتراك بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الإلغاء أو الاشتراك غير موجود' },
      { status: 500 }
    );
  }
}