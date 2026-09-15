import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


/**
 * @swagger
 * /api/workspace-sections/{id}:
 *   put:
 *     summary: تعديل قسم
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
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: تم تعديل القسم
 */
// PUT /api/workspace-sections/[id] — تعديل قسم
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    const data = await request.json();

    const section = await prisma.workspaceSection.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل القسم بنجاح", section });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "القسم غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}

// DELETE /api/workspace-sections/[id] — حذف قسم
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    await prisma.workspaceSection.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف القسم بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "القسم غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}