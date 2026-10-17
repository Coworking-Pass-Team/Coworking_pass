import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";



/**
 * @swagger
 * /api/ticket-replies/{id}:
 *   delete:
 *     summary: حذف رد على تذكرة
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
 *         description: تم حذف الرد
 */
// DELETE /api/ticket-replies/[id] — حذف رد
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const { id } = await params;
    const reply = await prisma.ticketReply.findUnique({ where: { id }, select: { userId: true } });
    if (!reply) {
      return NextResponse.json({ error: "Reply not found." }, { status: 404 });
    }
    if (user.role !== "SUPER_ADMIN" && reply.userId !== user.userId) {
      return NextResponse.json({ error: "You can only delete your own replies." }, { status: 403 });
    }
    await prisma.ticketReply.delete({ where: { id } });
    return NextResponse.json({ message: "Reply deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Reply not found or an error occurred." },
      { status: 404 }
    );
  }
}