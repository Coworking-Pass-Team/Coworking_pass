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
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.ticket.findUnique({ where: { id }, select: { userId: true } });
    if (!existing) {
      return NextResponse.json({ error: "Support ticket not found." }, { status: 404 });
    }
    if (user.role !== "SUPER_ADMIN" && existing.userId !== user.userId) {
      return NextResponse.json({ error: "You are not allowed to modify this ticket." }, { status: 403 });
    }

    // Only the status can be changed after creation
    const data: { status?: string } = {};
    if (body.status !== undefined) data.status = body.status;

    if (data.status && !VALID_STATUSES.includes(data.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: data as any,
    });

    return NextResponse.json({ message: "Support ticket updated successfully.", ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Support ticket not found or an error occurred." },
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
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only administrators can delete tickets." }, { status: 403 });
    }
    const { id } = await params;
    await prisma.ticketReply.deleteMany({ where: { ticketId: id } });
    await prisma.ticket.delete({ where: { id } });
    return NextResponse.json({ message: "Support ticket deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Support ticket not found or an error occurred." },
      { status: 404 }
    );
  }
}