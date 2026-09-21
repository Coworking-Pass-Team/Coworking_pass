import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    } else if (user && user.role !== 'SUPER_ADMIN') {
      whereClause.userId = user.userId;
    }

    const points = await prisma.loyaltyPoint.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } }
      }
    })
    return NextResponse.json(points)
  } catch (error) {
    console.error('❌ Error fetching loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty points.' },
      { status: 500 }
    )
  }
}


/**
 * @swagger
 * /api/loyalty-points:
 *   post:
 *     summary: إنشاء رصيد نقاط لمستخدم
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء الرصيد
 */
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { userId, totalEarned = 0, totalRedeemed = 0 } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      )
    }

    const points = await prisma.loyaltyPoint.create({
      data: {
        userId,
        totalEarned,
        totalRedeemed,
        availableBalance: totalEarned - totalRedeemed
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(points, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to create loyalty points.' },
      { status: 500 }
    )
  }
}