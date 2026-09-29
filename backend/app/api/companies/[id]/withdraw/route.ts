import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token"

/**
 * @swagger
 * /api/companies/{id}/withdraw:
 *   post:
 *     summary: خصم مبلغ من محفظة الشركة المشتركة
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
 *                 example: 250
 *     responses:
 *       200:
 *         description: تم الخصم بنجاح
 *       400:
 *         description: الرصيد غير كافٍ أو المبلغ غير صحيح
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
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    // Role check: HR_ADMIN, SUPER_ADMIN, organization, or admin
    if (user && user.role !== 'HR_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'organization' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Organization HR Admin permitted.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount is required and must be greater than zero.' },
        { status: 400 }
      );
    }

    // Check company existence
    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found.' },
        { status: 404 }
      );
    }

    if (company.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient company wallet balance.' },
        { status: 400 }
      );
    }

    // Deduct amount
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { balance: { decrement: amount } }
    });

    return NextResponse.json({
      message: 'Withdrawal successful.',
      balance: updatedCompany.balance,
      company: {
        id: updatedCompany.id,
        companyName: updatedCompany.companyName,
        balance: updatedCompany.balance,
        newBalance: updatedCompany.balance
      }
    });

  } catch (error) {
    console.error('Error withdrawing from company wallet:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw from company wallet.' },
      { status: 500 }
    );
  }
}
