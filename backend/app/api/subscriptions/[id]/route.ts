import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { id } = await params
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        plan: true
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'الاشتراك غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('❌ Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   put:
 *     summary: تعديل اشتراك
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, CANCELLED, EXPIRED]
 *     responses:
 *       200:
 *         description: تم تعديل الاشتراك
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { id } = await params
    const body = await request.json()
    const subscription = await prisma.subscription.update({
      where: { id },
      data: body,
      include: {
        user: { select: { name: true, email: true } },
        plan: true
      }
    })
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('❌ Error updating subscription:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في التحديث' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   delete:
 *     summary: إلغاء اشتراك (بسياسة زمنية)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم إلغاء الاشتراك
 *       400:
 *         description: تجاوز مهلة الإلغاء (6 ساعات للأفراد، 24 للمؤسسات)
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { id } = await params

    // 1. جلب الاشتراك مع بيانات المستخدم
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'الاشتراك غير موجود' },
        { status: 404 }
      )
    }

    // 2. التحقق من سياسة الإلغاء بناءً على دور المستخدم
    const now = new Date()
    const startTime = new Date(subscription.startDate)
    const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    const requiredHours = subscription.user.role === 'B2C' ? 6 : 24

    if (hoursDiff < requiredHours) {
      return NextResponse.json(
        { 
          error: `لا يمكن الإلغاء. يجب الإلغاء قبل ${requiredHours} ساعة على الأقل من بداية الاشتراك` 
        },
        { status: 400 }
      )
    }

    // 3. إلغاء الاشتراك
    await prisma.subscription.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'تم إلغاء الاشتراك بنجاح' },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الإلغاء' },
      { status: 500 }
    )
  }
}