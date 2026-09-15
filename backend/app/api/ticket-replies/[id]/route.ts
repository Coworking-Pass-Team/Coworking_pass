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
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    await prisma.ticketReply.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف الرد بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الرد غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}