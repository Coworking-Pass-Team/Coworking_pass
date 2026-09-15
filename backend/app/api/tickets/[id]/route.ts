import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"];



/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: تعديل حالة تذكرة
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
 *                 enum: [OPEN, IN_PROGRESS, CLOSED]
 *     responses:
 *       200:
 *         description: تم تعديل حالة التذكرة
 */
// PUT /api/tickets/[id] — تعديل حالة التذكرة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    const data = await request.json();

    if (data.status && !VALID_STATUSES.includes(data.status)) {
      return NextResponse.json(
        { error: `status يجب أن يكون: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل التذكرة بنجاح", ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "التذكرة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}

// DELETE /api/tickets/[id] — حذف تذكرة
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    await prisma.ticket.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف التذكرة بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "التذكرة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}