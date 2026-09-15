import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";




/**
 * @swagger
 * /api/waitlist/{id}:
 *   delete:
 *     summary: إزالة من قائمة الانتظار
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
 *         description: تم إزالتك من قائمة الانتظار
 */
// DELETE: إزالة من قائمة الانتظار
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params
    await prisma.directBooking.delete({
      where: { id }
    })
    return NextResponse.json(
      { message: 'تم إزالتك من قائمة الانتظار' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ في الإزالة' },
      { status: 500 }
    )
  }
}