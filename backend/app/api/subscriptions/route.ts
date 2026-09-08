import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: { select: { name: true, email: true } },
        plan: true
      }
    })
    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الاشتراكات' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: إنشاء اشتراك جديد
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, planId, startDate, endDate]
 *             properties:
 *               userId:
 *                 type: string
 *               planId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 example: "2026-09-01"
 *               endDate:
 *                 type: string
 *                 example: "2026-10-01"
 *     responses:
 *       201:
 *         description: تم تفعيل الاشتراك بنجاح
 */
export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const body = await request.json()
    const { userId, planId, startDate, endDate, status = 'ACTIVE' } = body  // ← تغيير

    if (!userId || !planId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,        // ← تغيير
        planId,        // ← تغيير
        startDate: new Date(startDate),   // ← تغيير
        endDate: new Date(endDate),       // ← تغيير
        status,
        visitsUsed: 0   // ← تغيير
      },
      include: {
        user: { select: { name: true, email: true } },
        plan: true
      }
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating subscription:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الاشتراك' },
      { status: 500 }
    )
  }
}