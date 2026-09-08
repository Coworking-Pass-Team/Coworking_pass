import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: تعديل شركة
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
 *               totalPassesAllocated:
 *                 type: integer
 *     responses:
 *       200:
 *         description: تم تعديل الشركة
 */
// PUT /api/companies/[id] — تعديل شركة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    const data = await request.json();

    const company = await prisma.company.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل الشركة بنجاح", company });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشركة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}

// DELETE /api/companies/[id] — حذف شركة
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الشركة بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشركة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}