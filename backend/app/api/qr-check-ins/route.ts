import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { getOwnedWorkspaceIds, canManageWorkspace } from '@/lib/ownership'
import { getKsaNow } from '@/lib/time-utils'
import { directBookingEnd } from '@/lib/capacity'

/** Arrival up to this long before an hourly session still counts as checking in for it. */
const EARLY_ARRIVAL_MS = 60 * 60 * 1000

/**
 * The booking that entitles a customer to enter this workspace right now, if any: a confirmed daily/monthly/yearly
 * booking whose period covers today, or an active hourly session in progress (session times are stored in KSA time).
 */
async function findCurrentBooking(userId: string, workspaceId: string) {
  const now = getKsaNow()
  // Daily plans cover the whole booked day, whatever time of day the booking date was stored with
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const direct = await prisma.directBooking.findMany({
    where: { OR: [{ userId }, { attendeeIds: { has: userId } }], workspaceId, status: 'CONFIRMED', bookingDate: { lt: endOfToday } },
    orderBy: { bookingDate: 'desc' },
    take: 20,
  })
  const coveringDirect = direct.find((b) => directBookingEnd(b) > now)
  if (coveringDirect) return { id: coveringDirect.id, kind: coveringDirect.durationType as string }
  const hourly = await prisma.hourlyBooking.findFirst({
    where: { OR: [{ userId }, { attendeeIds: { has: userId } }], workspaceId, status: 'ACTIVE', startDate: { lte: new Date(now.getTime() + EARLY_ARRIVAL_MS) }, endDate: { gt: now } },
  })
  return hourly ? { id: hourly.id, kind: 'HOURLY' } : null
}


function generateQRHash() {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * @swagger
 * /api/qr-check-ins:
 *   get:
 *     summary: عرض كل عمليات مسح QR
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة المسحات
 */
export async function GET(request: Request) {
  try {
    // Public crowd indicator: how many check-ins each workspace had today (KSA day). Counts only, no people.
    if (new URL(request.url).searchParams.get('summary') === 'today') {
      const ksaNow = new Date(Date.now() + 3 * 60 * 60 * 1000)
      const startUtc = new Date(Date.UTC(ksaNow.getUTCFullYear(), ksaNow.getUTCMonth(), ksaNow.getUTCDate()) - 3 * 60 * 60 * 1000)
      const grouped = await prisma.qrCheckIn.groupBy({
        by: ['workspaceId'],
        where: { scannedAt: { gte: startUtc } },
        _count: { _all: true },
      })
      const counts: Record<string, number> = {}
      for (const row of grouped) counts[row.workspaceId] = row._count._all
      return NextResponse.json({ date: startUtc.toISOString(), counts })
    }

    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);

    // Scope the listing: super admins see everything, partners their own venues (plus their own scans),
    // everyone else only their own check-ins
    let where: Record<string, unknown> = { userId: user.userId }
    if (user.role === 'SUPER_ADMIN') {
      where = {}
    } else if (user.role === 'PARTNER_ADMIN') {
      const owned = await getOwnedWorkspaceIds(user.userId)
      where = { OR: [{ workspaceId: { in: owned } }, { userId: user.userId }] }
    }

    const checkIns = await prisma.qrCheckIn.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      },
      orderBy: { scannedAt: 'desc' }
    })
    return NextResponse.json(checkIns)
  } catch (error) {
    console.error('❌ Error fetching QR check-ins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QR check-ins.' },
      { status: 500 }
    )
  }
}


/**
 * @swagger
 * /api/qr-check-ins:
 *   post:
 *     summary: تسجيل مسح QR (يمنح نقاط ولاء، ويخصم ساعات من الباقة الساعية النشطة)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, workspaceId, sectionId, qrCodeHash]
 *             properties:
 *               userId:
 *                 type: string
 *               workspaceId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *               qrCodeHash:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم تسجيل المسح
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const body = await request.json()
    const { workspaceId, sectionId } = body
    const status = 'VALID'
    if (!workspaceId || !sectionId) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    // A check-in belongs to the caller. Staff may record one for a customer: super admins anywhere, and
    // a venue partner only at a workspace they own (this is how the partner scanner works).
    let userId: string = user.userId
    if (body.userId && body.userId !== user.userId) {
      const mayRecordForOthers = user.role === 'SUPER_ADMIN' || (user.role === 'PARTNER_ADMIN' && await canManageWorkspace(user, workspaceId))
      if (!mayRecordForOthers) {
        return NextResponse.json({ error: 'You can only record your own check-in.' }, { status: 403 })
      }
      userId = body.userId
    }

    // Entry is only valid with a booking for this workspace right now (nothing is recorded otherwise)
    const currentBooking = await findCurrentBooking(userId, workspaceId)
    if (!currentBooking) {
      return NextResponse.json({ error: 'No active booking for this space right now.', code: 'NO_ACTIVE_BOOKING' }, { status: 403 })
    }

    // 1. إنشاء سجل QR Check-in
    const checkIn = await prisma.qrCheckIn.create({
      data: {
        userId,
        workspaceId,
        sectionId,
        qrCodeHash: generateQRHash(),
        status,
        scannedAt: new Date()
      },
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })

    // ✅ 2. منح نقاط ولاء عند مسح QR
    try {
      // البحث عن حجز نشط للمستخدم في هذا القسم
      const activeBooking = { id: currentBooking.id, durationType: currentBooking.kind }

      // Points are earned once per booking per day, so repeated scans cannot farm loyalty points
      const dayStart = new Date()
      dayStart.setUTCHours(0, 0, 0, 0)
      const alreadyEarned = activeBooking
        ? await prisma.pointsTransaction.findFirst({
            where: { userId, type: 'EARNED', referenceId: activeBooking.id, createdAt: { gte: dayStart } },
            select: { id: true },
          })
        : null

      // إذا كان هناك حجز نشط، نمنح نقاط
      if (activeBooking && !alreadyEarned) {
        const pointsToEarn = 10 // 10 نقاط لكل حجز

        await prisma.pointsTransaction.create({
          data: {
            userId: userId,
            type: 'EARNED',
            points: pointsToEarn,
            description: `Points earned from check-in at ${checkIn.workspace?.name || 'the workspace'}`,
            referenceId: activeBooking.id
          }
        })

        // تحديث رصيد النقاط
        const loyaltyPoints = await prisma.loyaltyPoint.findUnique({
          where: { userId }
        })

        if (loyaltyPoints) {
          await prisma.loyaltyPoint.update({
            where: { userId },
            data: {
              totalEarned: { increment: pointsToEarn },
              availableBalance: { increment: pointsToEarn }
            }
          })
        }
      }
    } catch (pointsError) {
      // نطبع الخطأ بس ما نوقف الـ API
      console.error('❌ Error earning loyalty points:', pointsError)
    }

    // ✅ 3. خصم الساعات عند مسح QR (لأصحاب الباقات الساعية)
    try {
      const activeHourlyBooking = await prisma.hourlyBooking.findFirst({
        where: {
          userId: userId,
          sectionId: sectionId,
          status: 'ACTIVE',
        },
        include: { package: true },
      })

      if (activeHourlyBooking) {
        const hoursPerVisit = 1
        const newHoursUsed = activeHourlyBooking.hoursUsed + hoursPerVisit

        await prisma.hourlyBooking.update({
          where: { id: activeHourlyBooking.id },
          data: {
            hoursUsed: newHoursUsed,
            status: newHoursUsed >= activeHourlyBooking.package.hoursAmount ? 'EXPIRED' : 'ACTIVE',
          },
        })
      }
    } catch (hoursError) {
      console.error('❌ Error deducting hours:', hoursError)
    }

    return NextResponse.json(checkIn, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating QR check-in:', error)
    return NextResponse.json(
      { error: 'Failed to create QR check-in.' },
      { status: 500 }
    )
  }
}