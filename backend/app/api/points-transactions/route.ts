import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

/** Largest number of points one request may move; real bookings earn/redeem far less. */
const MAX_POINTS_PER_TRANSACTION = 100_000

export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    // Points history is private: super admins see everything, everyone else only their own
    const transactions = await prisma.pointsTransaction.findMany({
      where: user.role === 'SUPER_ADMIN' ? {} : { userId: user.userId },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('❌ Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points transactions.' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/points-transactions:
 *   post:
 *     summary: تسجيل حركة نقاط
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, points]
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [EARNED, REDEEMED]
 *               points:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم تسجيل الحركة (ويحدّث الرصيد تلقائياً)
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }
    const { userId, type, points, description, referenceId } = body

    // A transaction always belongs to the caller; only super admins may adjust another user's points
    const isAdmin = user.role === 'SUPER_ADMIN'
    const effectiveUserId: string = isAdmin && userId ? userId : user.userId

    if (type !== 'EARNED' && type !== 'REDEEMED') {
      return NextResponse.json({ error: "type must be 'EARNED' or 'REDEEMED'." }, { status: 400 })
    }
    const numPoints = Number(points)
    if (!Number.isInteger(numPoints) || numPoints <= 0 || numPoints > MAX_POINTS_PER_TRANSACTION) {
      return NextResponse.json({ error: 'points must be a positive whole number.' }, { status: 400 })
    }
    const safeReference: string | null = typeof referenceId === 'string' && referenceId ? referenceId.slice(0, 200) : null

    const owner = await prisma.user.findUnique({ where: { id: effectiveUserId }, select: { id: true } })
    if (!owner) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    // Customers can only earn points for a booking of their own, and only once per booking
    if (type === 'EARNED' && !isAdmin) {
      if (!safeReference) {
        return NextResponse.json({ error: 'Earning points requires the booking it was earned for.' }, { status: 400 })
      }
      const [direct, hourly] = await Promise.all([
        prisma.directBooking.findFirst({ where: { id: safeReference, userId: effectiveUserId }, select: { id: true } }),
        prisma.hourlyBooking.findFirst({ where: { id: safeReference, userId: effectiveUserId }, select: { id: true } }),
      ])
      if (!direct && !hourly) {
        return NextResponse.json({ error: 'Points can only be earned for your own bookings.' }, { status: 403 })
      }
    }

    const outcome = await prisma.$transaction(async (tx) => {
      // Serialize point movements per user so balance checks and updates cannot interleave
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'points:' + effectiveUserId}))`

      if (type === 'EARNED' && !isAdmin && safeReference) {
        const already = await tx.pointsTransaction.findFirst({
          where: { userId: effectiveUserId, type: 'EARNED', referenceId: safeReference },
          select: { id: true },
        })
        if (already) return { duplicate: true as const }
      }

      // التأكد من وجود سجل رصيد نقاط للمستخدم
      const loyaltyPoints = await tx.loyaltyPoint.upsert({
        where: { userId: effectiveUserId },
        create: { userId: effectiveUserId, totalEarned: 0, totalRedeemed: 0, availableBalance: 0 },
        update: {},
      })

      // منع الخصم إذا الرصيد غير كافٍ
      if (type === 'REDEEMED' && loyaltyPoints.availableBalance < numPoints) {
        return { insufficient: true as const }
      }

      const transaction = await tx.pointsTransaction.create({
        data: {
          userId: effectiveUserId,
          type,
          points: numPoints,
          description: typeof description === 'string' ? description.slice(0, 500) : undefined,
          referenceId: safeReference ?? undefined,
        },
        include: {
          user: { select: { name: true, email: true } }
        }
      })

      // تحديث رصيد المستخدم
      const updateData = type === 'EARNED'
        ? { totalEarned: { increment: numPoints }, availableBalance: { increment: numPoints } }
        : { totalRedeemed: { increment: numPoints }, availableBalance: { decrement: numPoints } }
      await tx.loyaltyPoint.update({ where: { userId: effectiveUserId }, data: updateData })

      return { transaction }
    })

    if ('insufficient' in outcome) {
      return NextResponse.json({ error: 'Insufficient points balance.' }, { status: 400 })
    }
    if ('duplicate' in outcome) {
      return NextResponse.json({ error: 'Points for this booking were already credited.' }, { status: 409 })
    }
    return NextResponse.json(outcome.transaction, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction.' },
      { status: 500 }
    )
  }
}
