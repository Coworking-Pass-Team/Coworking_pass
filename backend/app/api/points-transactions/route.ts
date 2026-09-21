import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const transactions = await prisma.pointsTransaction.findMany({
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
    const user = getTokenFromRequest(request);
    const body = await request.json()
    const { userId, type, points, description, referenceId } = body

    let effectiveUserId = userId || (user ? user.userId : null);

    if (effectiveUserId) {
      const existingUser = await prisma.user.findUnique({ where: { id: effectiveUserId } });
      if (!existingUser) {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) effectiveUserId = firstUser.id;
      }
    } else {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) effectiveUserId = firstUser.id;
    }

    if (!effectiveUserId || !type || !points) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    const numPoints = Number(points);

    // التأكد من وجود سجل رصيد نقاط للمستخدم
    let loyaltyPoints = await prisma.loyaltyPoint.findUnique({
      where: { userId: effectiveUserId }
    })

    if (!loyaltyPoints) {
      loyaltyPoints = await prisma.loyaltyPoint.create({
        data: {
          userId: effectiveUserId,
          totalEarned: 0,
          totalRedeemed: 0,
          availableBalance: 0
        }
      });
    }

    // منع الخصم إذا الرصيد غير كافٍ
    if (type === 'REDEEMED' && loyaltyPoints.availableBalance < numPoints) {
      return NextResponse.json(
        { error: 'Insufficient points balance.' },
        { status: 400 }
      )
    }

    const transaction = await prisma.pointsTransaction.create({
      data: {
        userId: effectiveUserId,
        type,
        points: numPoints,
        description,
        referenceId
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    // تحديث رصيد المستخدم
    const updateData = type === 'EARNED'
      ? { totalEarned: { increment: numPoints }, availableBalance: { increment: numPoints } }
      : { totalRedeemed: { increment: numPoints }, availableBalance: { decrement: numPoints } }

    await prisma.loyaltyPoint.update({
      where: { userId: effectiveUserId },
      data: updateData
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction.' },
      { status: 500 }
    )
  }
}