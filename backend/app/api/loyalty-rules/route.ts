import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const rules = await prisma.loyaltyRule.findMany({
      include: {
        proposer: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(rules)
  } catch (error) {
    console.error('❌ Error fetching rules:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب قواعد الولاء' },
      { status: 500 }
    )
  }
}
/**
 * @swagger
 * /api/loyalty-rules:
 *   post:
 *     summary: اقتراح قاعدة نقاط
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ruleName, ruleType, pointsValue, monetaryValue, proposedBy]
 *             properties:
 *               ruleName:
 *                 type: string
 *               ruleType:
 *                 type: string
 *                 enum: [EARNING, REDEMPTION]
 *               pointsValue:
 *                 type: integer
 *               monetaryValue:
 *                 type: number
 *               proposedBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم اقتراح القاعدة
 */

export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const body = await request.json()
    const { ruleName, ruleType, pointsValue, monetaryValue, description, proposedBy, status = 'PENDING_APPROVAL' } = body

    if (!ruleName || !ruleType || !pointsValue || !monetaryValue || !proposedBy) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const rule = await prisma.loyaltyRule.create({
      data: {
        ruleName,
        ruleType,
        pointsValue,
        monetaryValue,
        description,
        proposedBy,
        status,
        isActive: false
      },
      include: {
        proposer: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating rule:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء القاعدة' },
      { status: 500 }
    )
  }
}