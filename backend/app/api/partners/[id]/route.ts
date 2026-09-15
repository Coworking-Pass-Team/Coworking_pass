import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";




/**
 * @swagger
 * /api/partners/{id}:
 *   put:
 *     summary: تعديل شريك
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
 *               revenueSharePercentage:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم تعديل الشريك
 */

export async function PUT(
  
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    const data = await request.json();

    const partner = await prisma.partner.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل الشريك بنجاح", partner });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشريك غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;

    await prisma.partner.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الشريك بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشريك غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}