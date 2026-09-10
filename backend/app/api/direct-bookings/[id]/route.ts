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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await prisma.directBooking.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'الحجز غير موجود' },
        { status: 404 }
      )
    }

    // سياسة الإلغاء
    const now = new Date()
    const bookingTime = new Date(booking.bookingDate)
    const hoursDiff = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const requiredHours = booking.user.role === 'B2C' ? 6 : 24

    if (hoursDiff < requiredHours) {
      return NextResponse.json(
        { error: `لا يمكن الإلغاء. يجب الإلغاء قبل ${requiredHours} ساعة على الأقل` },
        { status: 400 }
      )
    }

    await prisma.directBooking.delete({ where: { id } })

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
    })

    return NextResponse.json(
      { message: 'تم إلغاء الحجز بنجاح' },
      { status: 200 }
    )
  } catch (error) {
    console.error(' Error deleting booking:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الإلغاء' },
      { status: 500 }
    )
  }
}