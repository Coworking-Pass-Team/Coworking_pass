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
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
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
    console.error('❌ Error fetching waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist.' },
      { status: 500 }
    )
  }
}

// POST: إضافة مستخدم لقائمة الانتظار
export async function POST(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const body = await request.json()
    const { workspaceId, sectionId, durationType, bookingDate } = body
    // The waitlist entry always belongs to the caller; only super admins may add someone else
    const userId: string = user.role === 'SUPER_ADMIN' && body.userId ? body.userId : user.userId

    if (!userId || !workspaceId || !sectionId || !durationType || !bookingDate) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    if (!['DAILY', 'MONTHLY', 'YEARLY'].includes(String(durationType))) {
      return NextResponse.json({ error: 'durationType must be DAILY, MONTHLY or YEARLY.' }, { status: 400 })
    }
    const requestedDate = new Date(bookingDate)
    if (Number.isNaN(requestedDate.getTime())) {
      return NextResponse.json({ error: 'bookingDate is not a valid date.' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, sections: { select: { id: true, type: true } } },
    })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })
    }
    // Clients may not know the section id (it is optional in the UI): fall back to the workspace's desk area
    const resolvedSectionId: string | undefined =
      workspace.sections.find((s) => s.id === sectionId)?.id ??
      workspace.sections.find((s) => s.type === 'DESK')?.id ??
      workspace.sections[0]?.id
    if (!resolvedSectionId) {
      return NextResponse.json({ error: 'This workspace has no bookable area yet.' }, { status: 400 })
    }

    // التحقق من وجود حجز نشط لهذا المستخدم في نفس المساحة
    const existingBooking = await prisma.directBooking.findFirst({
      where: {
        userId,
        workspaceId,
        sectionId: resolvedSectionId,
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
        sectionId: resolvedSectionId,
        durationType,
        bookingDate: requestedDate,
        status: 'WAITLISTED'
      },
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })

    // Confirmation for the person who joined (stored, so it also shows on their other devices)
    await prisma.notification.create({
      data: {
        userId,
        type: 'WAITLIST_JOINED',
        title: 'Joined Waitlist',
        message: `You joined the waitlist for ${workspace.name}. We'll notify you as soon as a spot opens.`,
        channel: 'IN_APP',
        sentAt: new Date(),
      },
    }).catch((err) => console.error('❌ Waitlist notification failed:', err))

    return NextResponse.json(waitlist, { status: 201 })
  } catch (error) {
    console.error('❌ Error joining waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist.' },
      { status: 500 }
    )
  }
}