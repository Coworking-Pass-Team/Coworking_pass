import type { ApprovalStatus } from "@prisma/client"
import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/ownership';
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

import { seedLoyaltyRules } from '@/lib/db/seed-data';

export async function GET() {
  try {
    let rules = await prisma.loyaltyRule.findMany({
      include: {
        proposer: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (rules.length === 0) {
      rules = await seedLoyaltyRules();
    }

    return NextResponse.json(rules);
  } catch (error) {
    console.error('❌ Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty rules.' },
      { status: 500 }
    );
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
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const roleDenied = requireRoles(user, ['SUPER_ADMIN', 'PARTNER_ADMIN']);
    if (roleDenied) return roleDenied;

    const body = await request.json()
    const { ruleName, ruleType, pointsValue, monetaryValue, description } = body
    // A partner always proposes as themselves and can never self-approve; only super admins pick these
    const isAdmin = user.role === 'SUPER_ADMIN'
    const proposedBy: string | undefined = isAdmin ? (body.proposedBy || user.userId) : user.userId
    const status = (isAdmin ? (body.status || "PENDING_APPROVAL") : "PENDING_APPROVAL") as ApprovalStatus

    if (!ruleName || !ruleType || !pointsValue || !monetaryValue || !proposedBy) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }
    if (ruleType !== 'EARNING' && ruleType !== 'REDEMPTION') {
      return NextResponse.json({ error: "ruleType must be 'EARNING' or 'REDEMPTION'." }, { status: 400 })
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
      { error: 'Failed to create loyalty rule.' },
      { status: 500 }
    )
  }
}