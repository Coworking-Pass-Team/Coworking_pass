import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: جلب جميع طلبات الانتظار
export async function GET() {
  try {
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
      { error: 'حدث خطأ في جلب طابور الانتظار' },
      { status: 500 }
    )
  }
}

// POST: إضافة مستخدم لقائمة الانتظار
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, workspaceId, sectionId, durationType, bookingDate } = body

    if (!userId || !workspaceId || !sectionId || !durationType || !bookingDate) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
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
        { error: 'لديك حجز نشط أو قيد الانتظار في هذه المساحة' },
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
      { error: 'حدث خطأ في إضافة طلب الانتظار' },
      { status: 500 }
    )
  }
}