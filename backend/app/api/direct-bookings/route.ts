import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse } from '@/lib/auth/verify-token';

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');
    const sectionId = searchParams.get('sectionId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    } else if (user && user.role !== 'SUPER_ADMIN') {
      whereClause.userId = user.userId;
    }

    if (workspaceId) whereClause.workspaceId = workspaceId;
    if (sectionId) whereClause.sectionId = sectionId;
    if (status) whereClause.status = status;

    const bookings = await prisma.directBooking.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        workspace: true,
        section: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching direct bookings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الحجوزات المباشرة' },
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
    const { userId, workspaceId, sectionId, durationType, bookingDate, status = 'CONFIRMED' } = body;

    const effectiveUserId = userId || (user ? user.userId : null);

    if (!effectiveUserId || !workspaceId || !sectionId || !durationType || !bookingDate) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة: userId (أو token), workspaceId, sectionId, durationType, bookingDate' },
        { status: 400 }
      );
    }

    const validDurations = ['DAILY', 'MONTHLY', 'YEARLY'];
    const normalizedDuration = (durationType || '').toUpperCase();
    if (!validDurations.includes(normalizedDuration)) {
      return NextResponse.json(
        { error: 'durationType يجب أن يكون DAILY أو MONTHLY أو YEARLY' },
        { status: 400 }
      );
    }

    const booking = await prisma.directBooking.create({
      data: {
        userId: effectiveUserId,
        workspaceId,
        sectionId,
        durationType: normalizedDuration as any,
        bookingDate: new Date(bookingDate),
        status: (status as any) || 'CONFIRMED',
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        workspace: true,
        section: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating direct booking:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحجز المباشر' },
      { status: 500 }
    );
  }
}
