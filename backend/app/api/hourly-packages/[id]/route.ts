import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";



/**
 * @swagger
 * /api/hourly-packages/{id}:
 *   put:
 *     summary: تعديل باقة
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
 *         description: تم تعديل الباقة
 */
// PUT /api/hourly-packages/[id] — تعديل باقة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    const data = await request.json();

    const hourlyPackage = await prisma.hourlyPackage.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل الباقة بنجاح", hourlyPackage });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الباقة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}

// DELETE /api/hourly-packages/[id] — حذف باقة
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    await prisma.hourlyPackage.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف الباقة بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الباقة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}