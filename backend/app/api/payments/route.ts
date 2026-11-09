import { idempotent } from "@/lib/security/idempotency";
import { InputError } from "@/lib/security/input";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse, suspendedResponse } from '@/lib/auth/verify-token';
import { getKsaNow } from '@/lib/time-utils';
import { getOwnedWorkspaceIds } from '@/lib/ownership';
import type { Prisma, PaymentMethod, PaymentFor, PaymentStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const paymentFor = searchParams.get('paymentFor');
    const method = searchParams.get('method');

    const whereClause: Prisma.PaymentWhereInput = {};
    const canViewOthers = user.role === 'SUPER_ADMIN' || user.role === 'PARTNER_ADMIN';
    if (userId && (canViewOthers || userId === user.userId)) {
      whereClause.userId = userId;
    } else if (!canViewOthers) {
      whereClause.userId = user.userId;
    }
    // Partners only see payments made at their own workspaces (other payments carry other customers' details)
    if (user.role === 'PARTNER_ADMIN') {
      const owned = await getOwnedWorkspaceIds(user.userId);
      whereClause.workspaceId = { in: owned };
    }

    if (status) whereClause.status = status as PaymentStatus;
    if (paymentFor) whereClause.paymentFor = paymentFor as PaymentFor;
    if (method) whereClause.method = method as PaymentMethod;

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        workspace: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error(' Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: تسجيل دفعة
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount, method, paymentFor]
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [MADA, VISA, APPLE_PAY, SAMSUNG_PAY]
 *               paymentFor:
 *                 type: string
 *                 enum: [DIRECT_BOOKING, HOURLY_BOOKING, SUBSCRIPTION, POINTS_REDEMPTION]
 *               referenceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم تسجيل الدفعة
 */
export const POST = idempotent("payments", async (request, db) => {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse(request);
  const body = await request.json();
  if (typeof body.referenceId !== "string") throw new InputError("A checkout reference is required.");
  const payment = await db.payment.findFirst({ where: { userId: user.userId, referenceId: body.referenceId, status: "SUCCESS" } });
  if (!payment) throw new InputError("No verified settlement exists. Complete wallet checkout first.", 409);
  return NextResponse.json(payment);
});
