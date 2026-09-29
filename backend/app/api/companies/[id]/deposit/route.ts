import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token"

/**
 * @swagger
 * /api/companies/{id}/deposit:
 *   post:
 *     summary: إيداع مبلغ في محفظة الشركة
 *     tags: [Companies]
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
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000
 *     responses:
 *       200:
 *         description: تم الإيداع بنجاح
 *       400:
 *         description: المبلغ غير صحيح
 *       403:
 *         description: غير مصرح
 *       404:
 *         description: الشركة غير موجودة
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    if (user.role !== 'HR_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only HR Admin or Super Admin permitted.' },
        { status: 403 }
      );
    }

    const { id } = await params
    const { amount } = await request.json()

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount is required and must be greater than zero.' },
        { status: 400 }
      )
    }

    const company = await prisma.company.findUnique({
      where: { id }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found.' },
        { status: 404 }
      )
    }

    // An HR admin may only fund their own company wallet
    if (user.role === 'HR_ADMIN' && company.hrAdminId !== user.userId) {
      return NextResponse.json(
        { error: 'You can only manage your own company wallet.' },
        { status: 403 }
      )
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { balance: { increment: amount } }
    })

    return NextResponse.json({
      message: 'Deposit successful.',
      balance: updatedCompany.balance,
      company: {
        id: updatedCompany.id,
        companyName: updatedCompany.companyName,
        balance: updatedCompany.balance,
        newBalance: updatedCompany.balance
      }
    })

  } catch (error) {
    console.error('❌ Error depositing:', error)
    return NextResponse.json(
      { error: 'Failed to deposit into company wallet.' },
      { status: 500 }
    )
  }
}