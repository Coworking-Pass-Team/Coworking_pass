import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token"
import { ensureDatabaseSchema } from "@/lib/db-schema-sync"

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
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    if (user.role !== 'HR_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Organization HR Admin permitted.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const amount = body.amount;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount is required and must be greater than zero.' },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found.' },
        { status: 404 }
      );
    }

    // An HR admin may only spend from their own company wallet
    if (user.role === 'HR_ADMIN' && company.hrAdminId !== user.userId) {
      return NextResponse.json(
        { error: 'You can only manage your own company wallet.' },
        { status: 403 }
      );
    }

    await ensureDatabaseSchema().catch(() => undefined);

    // Optional client-generated key: a repeated request with the same key never deducts twice
    const referenceId: string | null = typeof body.referenceId === 'string' && body.referenceId ? body.referenceId : null;
    const description: string = typeof body.description === 'string' && body.description ? body.description : 'Wallet withdrawal';

    const outcome = await prisma.$transaction(async (tx) => {
      if (referenceId) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'wd:' + id + ':' + referenceId}))`;
        const existing = await tx.companyWalletTransaction.findFirst({
          where: { companyId: id, type: 'WITHDRAW', referenceId },
        });
        if (existing) return { duplicate: true as const, balance: existing.balanceAfter };
      }

      // Atomic conditional decrement: the balance check and deduction happen in one statement,
      // so concurrent withdrawals cannot overdraw the wallet
      const deducted = await tx.company.updateMany({
        where: { id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (deducted.count === 0) return { insufficient: true as const };

      const updated = await tx.company.findUniqueOrThrow({ where: { id } });
      await tx.companyWalletTransaction.create({
        data: {
          companyId: id,
          userId: user.userId,
          amount,
          type: 'WITHDRAW',
          description,
          referenceId,
          balanceAfter: updated.balance,
        },
      });
      return { duplicate: false as const, balance: updated.balance };
    });

    if ('insufficient' in outcome) {
      return NextResponse.json(
        { error: 'Insufficient company wallet balance.' },
        { status: 400 }
      );
    }

    const updatedCompany = { ...company, balance: outcome.balance };

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
