import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const payouts = await prisma.payout.findMany({
      include: {
        partner: true
      },
      orderBy: { billingMonth: 'desc' }
    })
    return NextResponse.json(payouts)
  } catch (error) {
    console.error('❌ Error fetching partner payouts:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب مستحقات الشركاء' },
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
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const body = await request.json()
    const { partnerId, billingMonth, totalVisitsReceived, amountDue, status = 'PENDING' } = body

    if (!partnerId || !billingMonth || !totalVisitsReceived || !amountDue) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
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
      { error: 'حدث خطأ في إنشاء المستحقات' },
      { status: 500 }
    )
  }
}