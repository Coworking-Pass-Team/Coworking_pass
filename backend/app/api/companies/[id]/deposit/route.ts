import { financialBody, money, inputResponse } from "@/lib/security/input";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token"
import { ensureDatabaseSchema } from "@/lib/db/schema-sync"

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
    if (!user) return unauthorizedResponse(request);
    if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Funding requires verified payment settlement." }, { status: 403 });

    const { id } = await params
    const body = await financialBody(request)
    const amount = money(body.amount)

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

    await ensureDatabaseSchema().catch(() => undefined)

    // Optional client-generated key: a repeated request (e.g. a retried refund) credits the wallet only once
    const referenceId: string | null = typeof body.referenceId === 'string' && body.referenceId ? body.referenceId.slice(0, 200) : null;

    const updatedCompany = await prisma.$transaction(async (tx) => {
      if (referenceId) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'dp:' + id + ':' + referenceId}))`;
        const existing = await tx.companyWalletTransaction.findFirst({ where: { companyId: id, type: 'DEPOSIT', referenceId } });
        if (existing) return { ...company, balance: existing.balanceAfter };
      }
      const updated = await tx.company.update({
        where: { id },
        data: { balance: { increment: amount } }
      })
      await tx.companyWalletTransaction.create({
        data: {
          companyId: id,
          userId: user.userId,
          amount,
          type: 'DEPOSIT',
          description: typeof body.description === 'string' && body.description ? body.description : 'Wallet top-up',
          referenceId,
          balanceAfter: updated.balance,
        }
      })
      return updated
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
    const invalid = inputResponse(error);
    if (invalid) return invalid;
    console.error('❌ Error depositing:', error)
    return NextResponse.json(
      { error: 'Failed to deposit into company wallet.' },
      { status: 500 }
    )
  }
}