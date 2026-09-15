import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: عرض بيانات مستخدم (الملف الشخصي)
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
 *         description: بيانات المستخدم
 *       404:
 *         description: المستخدم غير موجود
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: تعديل الملف الشخصي أو حظر/رفع حظر مستخدم (Super Admin)
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
 *               name:
 *                 type: string
 *               isBanned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم التعديل بنجاح
 *       403:
 *         description: غير مصرح بتغيير isBanned (Super Admin فقط)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const data = await request.json();

    // حظر/رفع حظر — صلاحية SUPER_ADMIN فقط
    if (data.isBanned !== undefined && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "هذا الإجراء يتطلب صلاحية مدير النظام" },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    return NextResponse.json({ message: "تم تعديل البيانات بنجاح", user: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "المستخدم غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: حذف حساب المستخدم وبياناته (حق الحذف - PDPL)
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
 *         description: تم حذف الحساب بنجاح
 *       404:
 *         description: المستخدم غير موجود
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الحساب وكل بياناته بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "المستخدم غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}