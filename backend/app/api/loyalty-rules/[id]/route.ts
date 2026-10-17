import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/ownership';
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";



/**
 * @swagger
 * /api/loyalty-rules/{id}:
 *   put:
 *     summary: الموافقة أو رفض قاعدة
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
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: تم تحديث حالة القاعدة
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const roleDenied = requireRoles(user, ['SUPER_ADMIN']);
    if (roleDenied) return roleDenied;
    const { id } = await params
    const body = await request.json()
    const { status, approvedBy, isActive } = body

    const rule = await prisma.loyaltyRule.update({
      where: { id },
      data: {
        status,
        approvedBy,
        isActive: status === 'APPROVED'
      },
      include: {
        proposer: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('❌ Error updating rule:', error)
    return NextResponse.json(
      { error: 'Failed to update loyalty rule.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const { id } = await params
    const existingRule = await prisma.loyaltyRule.findUnique({ where: { id }, select: { proposedBy: true } })
    if (!existingRule) {
      return NextResponse.json({ error: 'Loyalty rule not found.' }, { status: 404 })
    }
    if (user.role !== 'SUPER_ADMIN' && existingRule.proposedBy !== user.userId) {
      return NextResponse.json({ error: 'You can only delete rules you proposed.' }, { status: 403 })
    }
    await prisma.loyaltyRule.delete({
      where: { id }
    })
    return NextResponse.json(
      { message: 'Loyalty rule deleted successfully.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error deleting rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete loyalty rule.' },
      { status: 500 }
    )
  }
}