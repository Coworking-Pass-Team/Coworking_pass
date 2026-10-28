import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { companySpentThisMonth, debitPersonalWallet, refundPersonalWallet } from '@/lib/company/credit';


/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: عرض أو إدارة محفظة المستخدم
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: نجح
 */
// GET: جلب رصيد المحفظة
export async function GET(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      )
    }

    if (user.role !== 'SUPER_ADMIN' && user.userId !== userId) {
      return NextResponse.json({ error: 'You can only view your own wallet.' }, { status: 403 })
    }

    // جلب أو إنشاء محفظة للمستخدم
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0
        },
        include: {
          transactions: true
        }
      })
    }

    // Company money held in this wallet and the member's monthly limit on spending it
    const owner = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true, companySpendLimit: true } })
    const companyCredit = owner?.companyId && owner.companyId === wallet.companyCreditCompanyId ? wallet.companyCredit : 0

    return NextResponse.json({
      userId,
      balance: wallet.balance,
      currency: 'SAR',
      companyCredit,
      companySpendLimit: owner?.companyId ? owner.companySpendLimit : null,
      companySpentThisMonth: companyCredit > 0 || owner?.companySpendLimit != null ? await companySpentThisMonth(prisma, wallet.id) : 0,
      transactions: wallet.transactions || []
    })

  } catch (error) {
    console.error('❌ Error fetching wallet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet.' },
      { status: 500 }
    )
  }
}

// POST: إيداع/سحب/استرجاع من المحفظة
export async function POST(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }
    const { userId, amount, type, description, referenceId } = payload

    if (!userId || !amount || !type) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
    }

    if (user.role !== 'SUPER_ADMIN' && user.userId !== userId) {
      return NextResponse.json({ error: 'You can only modify your own wallet.' }, { status: 403 })
    }

    const typeUpper = (type || '').toString().toUpperCase();
    if (!['DEPOSIT', 'WITHDRAW', 'REFUND'].includes(typeUpper)) {
      return NextResponse.json({ error: 'type must be DEPOSIT, WITHDRAW or REFUND.' }, { status: 400 })
    }
    const isCredit = typeUpper === 'DEPOSIT' || typeUpper === 'REFUND';

    const safeReference: string | null = typeof referenceId === 'string' && referenceId ? referenceId.slice(0, 200) : null;

    // A customer can only be refunded for one of their own wallet charges: the reference is "<charge reference>:<detail>",
    // the amount cannot exceed that charge, and each charge is refunded at most once.
    // Cancellation and subscription refunds are calculated by the server in /api/refund.
    const chargeReference = typeUpper === 'REFUND' && safeReference ? safeReference.split(':')[0] : '';
    const charge = chargeReference
      ? await prisma.walletTransaction.findFirst({ where: { userId, type: 'WITHDRAW', referenceId: chargeReference } })
      : null;
    if (typeUpper === 'REFUND' && user.role !== 'SUPER_ADMIN') {
      if (!charge) {
        return NextResponse.json({ error: 'A refund must refer to one of your wallet payments.' }, { status: 403 });
      }
      if (amount > charge.amount) {
        return NextResponse.json({ error: 'A refund cannot exceed the original payment.' }, { status: 400 });
      }
      const alreadyRefunded = await prisma.walletTransaction.findFirst({
        where: { userId, type: 'REFUND', referenceId: { startsWith: `${chargeReference}:` }, NOT: { referenceId: safeReference } },
        select: { id: true },
      });
      if (alreadyRefunded) {
        return NextResponse.json({ error: 'This payment was already refunded.' }, { status: 409 });
      }
    }

    // One transaction per request; a repeated referenceId for the same wallet and type is applied only once,
    // so a double click or a retried request can never debit (or refund) twice.
    const outcome = await prisma.$transaction(async (tx) => {
      if (safeReference) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'wallet:' + userId + ':' + typeUpper + ':' + safeReference}))`;
        const existing = await tx.walletTransaction.findFirst({
          where: { userId, type: typeUpper, referenceId: safeReference },
        });
        if (existing) return { duplicate: true as const, balance: existing.balanceAfter, transaction: existing };
      }

      // A payment spends company money first (within the member's monthly limit); a cash withdrawal (no reference)
      // uses the member's own money only. Debits never overdraw: they are refused as a whole.
      if (typeUpper === 'WITHDRAW') {
        const debited = await debitPersonalWallet(tx, {
          userId,
          amount,
          purpose: safeReference ? 'PAYMENT' : 'CASH_OUT',
          description: description || 'Withdrawal',
          referenceId: safeReference,
        });
        if (!debited.ok) return { refused: debited };
        return { duplicate: false as const, balance: debited.balance, transaction: debited.transaction };
      }
      // A refund of a company-funded charge returns that part as company money
      if (typeUpper === 'REFUND') {
        const refunded = await refundPersonalWallet(tx, {
          userId,
          amount,
          description: description || 'Refund',
          referenceId: safeReference,
          companyShareCap: charge ? charge.companyAmount : undefined,
        });
        return { duplicate: false as const, balance: refunded.balance, transaction: refunded.transaction };
      }

      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId, balance: 0 } });
      await tx.wallet.update({ where: { userId }, data: { balance: { increment: amount } } });

      const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          type: typeUpper,
          description: description || 'Deposit',
          referenceId: safeReference,
          balanceAfter: updatedWallet.balance,
        },
      });
      return { duplicate: false as const, balance: updatedWallet.balance, transaction };
    });

    if ('refused' in outcome && outcome.refused) {
      return NextResponse.json({ error: outcome.refused.error, code: outcome.refused.code }, { status: outcome.refused.status });
    }

    const updatedWallet = { balance: outcome.balance };
    const transaction = outcome.transaction;

    return NextResponse.json({
      message: isCredit ? 'Amount credited successfully' : 'Amount debited successfully',
      balance: updatedWallet.balance,
      transaction,
      duplicate: outcome.duplicate,
    }, { status: outcome.duplicate ? 200 : 201 })

  } catch (error) {
    console.error('❌ Error processing wallet:', error)
    return NextResponse.json(
      { error: 'Failed to process wallet transaction.' },
      { status: 500 }
    )
  }
}