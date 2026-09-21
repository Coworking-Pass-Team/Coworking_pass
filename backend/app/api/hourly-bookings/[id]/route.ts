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
    const booking = await prisma.hourlyBooking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        section: true,
        package: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('❌ Error fetching booking:', error)
    return NextResponse.json(
      { error: 'An error occurred.' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/hourly-bookings/{id}:
 *   put:
 *     summary: تعديل حجز ساعي
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
 *                 enum: [ACTIVE, EXPIRED, CANCELLED]
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
    const booking = await prisma.hourlyBooking.update({
      where: { id },
      data: body,
      include: {
        user: { select: { name: true, email: true } },
        section: true,
        package: true
      }
    })
    return NextResponse.json(booking)
  } catch (error) {
    console.error('❌ Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();

    const { id } = await params

    // 1. جلب الحجز مع بيانات المستخدم
    const booking = await prisma.hourlyBooking.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 }
      )
    }

    // 2. التحقق من سياسة الإلغاء بناءً على دور المستخدم
    const now = new Date()
    const bookingTime = new Date(booking.startDate)  // ← الفرق: startDate
    const hoursDiff = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // 6 ساعات للأفراد، 24 ساعة للمؤسسات
    const requiredHours = booking.user.role === 'B2C' ? 6 : 24

    if (hoursDiff < requiredHours) {
      return NextResponse.json(
        { 
          error: `Cancellation not allowed. Must cancel at least ${requiredHours} hours before booking time.` 
        },
        { status: 400 }
      )
    }

    // 3. إلغاء الحجز
    await prisma.hourlyBooking.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Booking cancelled successfully.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel.' },
      { status: 500 }
    )
  }
}