import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";



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
 *     responses:
 *       201:
 *         description: تم إنشاء الحجز (أو تسجيله بالطابور لو المساحة ممتلئة). لو المستخدم مرتبط بشركة، يُخصم تلقائياً من رصيد محفظة الشركة.
 *       400:
 *         description: رصيد الشركة غير كافٍ لهذا الحجز
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

    // 2. إنشاء الحجز
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
        user: { select: { name: true, email: true, companyId: true } },
        workspace: true,
        section: true
      }
    })

    //  3. المحفظة المشتركة للشركات
    const bookingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })

    if (bookingUser?.companyId) {
      // احسب التكلفة (مثال: حسب نوع الحجز)
      const bookingCost = 100 // يمكن تعديلها حسب durationType

      const company = await prisma.company.findUnique({
        where: { id: bookingUser.companyId }
      })

      if (!company || company.balance < bookingCost) {
        return NextResponse.json(
          { error: 'رصيد الشركة غير كافٍ لهذا الحجز' },
          { status: 400 }
        )
      }

      await prisma.company.update({
        where: { id: bookingUser.companyId },
        data: { balance: { decrement: bookingCost } }
      })
    }

    return NextResponse.json(booking, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating booking:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحجز' },
      { status: 500 }
    )
  }
}