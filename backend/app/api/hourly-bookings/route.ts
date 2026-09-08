import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const bookings = await prisma.hourlyBooking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        section: true,
        package: true
      }
    })
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('❌ Error fetching hourly bookings:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الحجوزات الساعية' },
      { status: 500 }
    )
  }
}


/**
 * @swagger
 * /api/hourly-bookings:
 *   post:
 *     summary: إنشاء حجز ساعي
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, sectionId, packageId, startDate, endDate]
 *             properties:
 *               userId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *               packageId:
 *                 type: string
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء الحجز الساعي
 */

export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const body = await request.json()
    const { userId, sectionId, packageId, startDate, endDate, status = 'ACTIVE' } = body  

    if (!userId || !sectionId || !packageId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const booking = await prisma.hourlyBooking.create({
      data: {
        userId,        
        sectionId,     
        packageId,     
        startDate: new Date(startDate),  
        endDate: new Date(endDate),      
        status,
        hoursUsed: 0    
      },
      include: {
        user: { select: { name: true, email: true } },
        section: true,
        package: true
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating hourly booking:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحجز الساعي' },
      { status: 500 }
    )
  }
}