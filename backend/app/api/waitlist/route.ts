import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";



/**
 * @swagger
 * /api/waitlist:
 *   get:
 *     summary: عرض كل قائمة الانتظار
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: نجح
 */
// GET: جلب جميع طلبات الانتظار
export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const waitlist = await prisma.directBooking.findMany({
      where: { status: 'WAITLISTED' },
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(waitlist)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch waitlist.' },
      { status: 500 }
    )
  }
}

// POST: إضافة مستخدم لقائمة الانتظار
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const body = await request.json()
    const { userId, workspaceId, sectionId, durationType, bookingDate } = body

    if (!userId || !workspaceId || !sectionId || !durationType || !bookingDate) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    // التحقق من وجود حجز نشط لهذا المستخدم في نفس المساحة
    const existingBooking = await prisma.directBooking.findFirst({
      where: {
        userId,
        workspaceId,
        sectionId,
        status: { in: ['CONFIRMED', 'WAITLISTED'] }
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You already have an active or pending reservation for this workspace.' },
        { status: 409 }
      )
    }

    const waitlist = await prisma.directBooking.create({
      data: {
        userId,
        workspaceId,
        sectionId,
        durationType,
        bookingDate: new Date(bookingDate),
        status: 'WAITLISTED'
      },
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })

    return NextResponse.json(waitlist, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to join waitlist.' },
      { status: 500 }
    )
  }
}