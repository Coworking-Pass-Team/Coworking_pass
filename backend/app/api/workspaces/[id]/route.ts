import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";




/**
 * @swagger
 * /api/workspaces/{id}:
 *   put:
 *     summary: تعديل مساحة عمل
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
 *               dailyRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم تعديل المساحة
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

    const workspace = await prisma.workspace.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل المساحة بنجاح", workspace });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "المساحة غير موجودة أو حدث خطأ" },
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

    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف المساحة بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "المساحة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}