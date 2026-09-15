import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

// GET: جلب خطة معينة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  
) {
  try {
    const { id } = await params;

    const plan = await prisma.membershipPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'الخطة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('❌ Error fetching plan:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الخطة' },
      { status: 500 }
    );
  }
}


/**
 * @swagger
 * /api/membership-plans/{id}:
 *   put:
 *     summary: تعديل خطة
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
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم تعديل الخطة
 */

// PUT: تحديث خطة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }
    const { id } = await params;
    const body = await request.json();
    const { planName, type, totalVisitsAllowed, price } = body;

    const dataToUpdate: Record<string, any> = {};
    if (planName !== undefined) dataToUpdate.planName = planName.trim();
    if (type !== undefined) dataToUpdate.type = type === 'B2B' ? 'B2B' : 'B2C';
    if (totalVisitsAllowed !== undefined) dataToUpdate.totalVisitsAllowed = Number(totalVisitsAllowed);
    if (price !== undefined) dataToUpdate.price = Number(price);

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: dataToUpdate,
    });
    return NextResponse.json(plan);
  } catch (error) {
    console.error('❌ Error updating plan:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في التحديث أو الخطة غير موجودة' },
      { status: 500 }
    );
  }
}

// DELETE: حذف خطة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }
    const { id } = await params;

    await prisma.membershipPlan.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'تم الحذف بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting plan:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الحذف أو الخطة غير موجودة' },
      { status: 500 }
    );
  }
}