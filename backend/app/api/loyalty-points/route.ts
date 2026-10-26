import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Loyalty balances are private: super admins may query anyone, everyone else only themselves
    const whereClause: Prisma.LoyaltyPointWhereInput = {};
    if (user.role === 'SUPER_ADMIN') {
      if (userId) whereClause.userId = userId;
    } else {
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
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const payload = await request.json().catch(() => ({}))
    // Balances are only ever set by a super admin; customers get an empty balance for themselves
    const isAdmin = user.role === 'SUPER_ADMIN'
    const userId: string | undefined = isAdmin ? payload.userId : user.userId
    const totalEarned: number = isAdmin ? Number(payload.totalEarned ?? 0) : 0
    const totalRedeemed: number = isAdmin ? Number(payload.totalRedeemed ?? 0) : 0

    if (!userId || !Number.isFinite(totalEarned) || !Number.isFinite(totalRedeemed) || totalEarned < 0 || totalRedeemed < 0) {
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