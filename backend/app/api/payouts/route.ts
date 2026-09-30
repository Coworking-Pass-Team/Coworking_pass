import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { getPartnerIdsForUser, forbiddenResponse } from "@/lib/ownership";

export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    // Super admins see every payout; a partner sees only their own; nobody else has payouts
    let where = {};
    if (user.role !== 'SUPER_ADMIN') {
      if (user.role !== 'PARTNER_ADMIN') return forbiddenResponse();
      where = { partnerId: { in: await getPartnerIdsForUser(user.userId) } };
    }
    const payouts = await prisma.payout.findMany({
      where,
      include: {
        partner: true
      },
      orderBy: { billingMonth: 'desc' }
    })
    return NextResponse.json(payouts)
  } catch (error) {
    console.error('❌ Error fetching partner payouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partner payouts.' },
      { status: 500 }
    )
  }
}
/**
 * @swagger
 * /api/payouts:
 *   post:
 *     summary: إنشاء تسوية مالية
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [partnerId, billingMonth, totalVisitsReceived, amountDue]
 *             properties:
 *               partnerId:
 *                 type: string
 *               billingMonth:
 *                 type: string
 *                 example: "2026-09"
 *               totalVisitsReceived:
 *                 type: integer
 *               amountDue:
 *                 type: number
 *     responses:
 *       201:
 *         description: تم إنشاء التسوية
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const body = await request.json()
    const { partnerId, billingMonth, totalVisitsReceived, amountDue } = body
    let status = body.status ?? 'PENDING'

    // Only super admins settle payouts freely; a partner may only file a pending record for themselves
    if (user.role !== 'SUPER_ADMIN') {
      if (user.role !== 'PARTNER_ADMIN') return forbiddenResponse();
      if (!(await getPartnerIdsForUser(user.userId)).includes(partnerId)) return forbiddenResponse('You can only create payouts for your own partner account.');
      status = 'PENDING';
    }

    if (!partnerId || !billingMonth || !totalVisitsReceived || !amountDue) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    const payout = await prisma.payout.create({
      data: {
        partnerId,
        billingMonth,
        totalVisitsReceived,
        amountDue,
        status
      },
      include: {
        partner: true
      }
    })

    return NextResponse.json(payout, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating partner payout:', error)
    return NextResponse.json(
      { error: 'Failed to create payout.' },
      { status: 500 }
    )
  }
}