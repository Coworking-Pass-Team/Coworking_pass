import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const bookings = await prisma.directBooking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('❌ Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الحجوزات' },
      { status: 500 }
    )
  }
}


/**
 * @swagger
 * /api/direct-bookings:
 *   post:
 *     summary: إنشاء حجز مباشر
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, workspaceId, sectionId, durationType, bookingDate]
 *             properties:
 *               userId:
 *                 type: string
 *               workspaceId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *               durationType:
 *                 type: string
 *                 enum: [DAILY, MONTHLY, YEARLY]
 *               bookingDate:
 *                 type: string
 *                 example: "2026-09-05"
 *     responses:
 *       201:
 *         description: تم إنشاء الحجز (أو تسجيله بالطابور لو المساحة ممتلئة)
 */

export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const body = await request.json()
    const { userId, workspaceId, sectionId, durationType, bookingDate, status = 'CONFIRMED' } = body  

    if (!userId || !workspaceId || !sectionId || !durationType || !bookingDate) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const booking = await prisma.directBooking.create({
      data: {
        userId,         
        workspaceId, 
        sectionId,      
        durationType,   
        bookingDate: new Date(bookingDate),  
        status
      },
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating booking:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحجز' },
      { status: 500 }
    )
  }
}
