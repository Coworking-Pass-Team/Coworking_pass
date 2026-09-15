import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: إحصائيات الإدارة (الإيرادات، المستخدمين، الحجوزات)
 *     tags: [Stats]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: إحصائيات شاملة للمنصة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   example: 500
 *                 totalUsers:
 *                   type: integer
 *                   example: 10
 *                 activeBookings:
 *                   type: integer
 *                   example: 3
 *                 totalPartners:
 *                   type: integer
 *                   example: 2
 *                 totalWorkspaces:
 *                   type: integer
 *                   example: 5
 *                 activeSubscriptions:
 *                   type: integer
 *                   example: 4
 *                 generatedAt:
 *                   type: string
 *                   example: "2026-09-10T10:00:00.000Z"
 *       401:
 *         description: غير مصرح
 *       500:
 *         description: خطأ في السيرفر
 */
export async function GET(request: NextRequest) {
  try {
    //  1. التحقق من التوكن
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    // 2. إجمالي الإيرادات (من المدفوعات الناجحة)
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    })

    // 3. عدد المستخدمين
    const totalUsers = await prisma.user.count()

    // 4. عدد الحجوزات النشطة
    const activeBookings = await prisma.directBooking.count({
      where: { status: 'CONFIRMED' }
    })

    // 5. عدد الشركاء
    const totalPartners = await prisma.partner.count()

    // 6. عدد المساحات
    const totalWorkspaces = await prisma.workspace.count()

    // 7. عدد الاشتراكات النشطة
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    })

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.amount || 0,
      totalUsers,
      activeBookings,
      totalPartners,
      totalWorkspaces,
      activeSubscriptions,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error(' Error fetching stats:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات' },
      { status: 500 }
    )
  }
}