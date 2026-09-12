import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

/**
 * @swagger
 * /api/direct-bookings/{id}:
 *   get:
 *     summary: عرض تفاصيل حجز مباشر معيّن
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
 *         description: تفاصيل الحجز
 *       404:
 *         description: الحجز غير موجود
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params
    const booking = await prisma.directBooking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'الحجز غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('❌ Error fetching booking:', error)
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    )
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
if (!user) return unauthorizedResponse();
    const { id } = await params
    const body = await request.json()
    const booking = await prisma.directBooking.update({
      where: { id },
      data: body,
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })
    return NextResponse.json(booking)
  } catch (error) {
    console.error('❌ Error updating booking:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في التحديث' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/direct-bookings/{id}:
 *   delete:
 *     summary: إلغاء حجز مباشر (بسياسة زمنية + ترقية تلقائية للطابور + إشعارات)
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
 *         description: تم إلغاء الحجز بنجاح (وتُرقّى أول حالة WAITLISTED تلقائياً لنفس المساحة/القسم إن وُجدت)
 *       400:
 *         description: تجاوز مهلة الإلغاء (6 ساعات للأفراد، 24 للمؤسسات)
 *       404:
 *         description: الحجز غير موجود
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

    //  Seat Release — ترقية فورية لأول شخص بقائمة الانتظار
    const nextInWaitlist = await prisma.directBooking.findFirst({
      where: {
        workspaceId: booking.workspaceId,
        sectionId: booking.sectionId,
        status: 'WAITLISTED'
      },
      orderBy: { createdAt: 'asc' }
    });

    let promotedMessage = '';
    if (nextInWaitlist) {
      await prisma.directBooking.update({
        where: { id: nextInWaitlist.id },
        data: { status: 'CONFIRMED', bookingDate: new Date() }
      });

      await prisma.notification.create({
        data: {
          userId: nextInWaitlist.userId,
          type: 'WAITLIST_PROMOTED',
          title: 'تم تأكيد حجزك من قائمة الانتظار',
          message: 'توفر مكان وتم تأكيد حجزك تلقائياً',
          channel: 'IN_APP',
          sentAt: new Date()
        }
      });

      promotedMessage = ' وتم ترقية أول مستخدم من قائمة الانتظار تلقائياً';
    }

    return NextResponse.json(
      { message: `تم إلغاء الحجز بنجاح${promotedMessage}`, booking: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الإلغاء' },
      { status: 500 }
    )
  }
}