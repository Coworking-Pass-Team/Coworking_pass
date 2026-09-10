import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse } from '@/lib/auth/verify-token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }
    const { id } = await params;
    const booking = await prisma.directBooking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        workspace: true,
        section: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'الحجز غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error(' Error fetching direct booking:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب تفاصيل الحجز' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/direct-bookings/{id}:
 *   put:
 *     summary: تعديل حجز مباشر
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
 *                 enum: [CONFIRMED, WAITLISTED, CANCELLED]
 *     responses:
 *       200:
 *         description: تم تعديل الحجز
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

    const updateData: any = {};
    if (body.durationType) updateData.durationType = body.durationType.toUpperCase();
    if (body.bookingDate) updateData.bookingDate = new Date(body.bookingDate);
    if (body.status) updateData.status = body.status;
    if (body.workspaceId) updateData.workspaceId = body.workspaceId;
    if (body.sectionId) updateData.sectionId = body.sectionId;

    const booking = await prisma.directBooking.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        workspace: true,
        section: true,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error(' Error updating direct booking:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الحجز' },
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

    const booking = await prisma.directBooking.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'الحجز غير موجود' },
        { status: 404 }
      );
    }

    //  سياسة الإلغاء (مع bypass للمدير)
    if (!user || user.role !== 'SUPER_ADMIN') {
      const now = new Date();
      const bookingTime = new Date(booking.bookingDate);
      const hoursDiff = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const requiredHours = booking.user?.role === 'B2C' ? 6 : 24;

      if (hoursDiff < requiredHours) {
        return NextResponse.json(
          {
            error: `لا يمكن الإلغاء. يجب الإلغاء قبل ${requiredHours} ساعة على الأقل من موعد الحجز`,
          },
          { status: 400 }
        );
      }
    }

    
    const updated = await prisma.directBooking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        workspace: true,
        section: true,
      },
    });

    //  إرسال إشعار 
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING_CANCELLED',
        title: 'تم إلغاء حجزك',
        message: `تم إلغاء حجزك رقم ${booking.id.slice(0, 8)} بنجاح`,
        channel: 'IN_APP',
        sentAt: new Date()
      }
    });

    return NextResponse.json(
      { message: 'تم إلغاء الحجز بنجاح', booking: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error(' Error cancelling direct booking:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الإلغاء' },
      { status: 500 }
    );
  }
}