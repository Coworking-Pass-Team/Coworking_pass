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
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const { id } = await params
    const entry = await prisma.directBooking.findUnique({ where: { id }, select: { userId: true, status: true } })
    if (!entry) {
      return NextResponse.json({ error: 'Waitlist entry not found.' }, { status: 404 })
    }
    // Only the person on the waitlist (or a super admin) can remove an entry, and only a waitlist entry:
    // confirmed bookings are cancelled through the refund flow, never deleted here
    if (user.role !== 'SUPER_ADMIN') {
      if (entry.userId !== user.userId) {
        return NextResponse.json({ error: 'You can only remove your own waitlist entries.' }, { status: 403 })
      }
      if (entry.status !== 'WAITLISTED') {
        return NextResponse.json({ error: 'Only waitlist entries can be removed here.' }, { status: 400 })
      }
    }
    await prisma.directBooking.delete({
      where: { id }
    })
    return NextResponse.json(
      { message: 'Removed from waitlist successfully.' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove from waitlist.' },
      { status: 500 }
    )
  }
}