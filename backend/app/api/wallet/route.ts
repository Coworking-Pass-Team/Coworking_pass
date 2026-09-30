import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


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

    return NextResponse.json({
      userId,
      balance: wallet.balance,
      currency: 'SAR',
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

    const { userId, amount, type, description, referenceId } = await request.json()

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
    const isCredit = typeUpper === 'DEPOSIT' || typeUpper === 'REFUND';

    const safeReference: string | null = typeof referenceId === 'string' && referenceId ? referenceId.slice(0, 200) : null;

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

      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId, balance: 0 } });

      // Atomic update: debits are conditional on sufficient balance so concurrent requests cannot overdraw
      if (!isCredit) {
        const debited = await tx.wallet.updateMany({
          where: { userId, balance: { gte: amount } },
          data: { balance: { decrement: amount } },
        });
        if (debited.count === 0) return { insufficient: true as const };
      } else {
        await tx.wallet.update({ where: { userId }, data: { balance: { increment: amount } } });
      }

      const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          type: typeUpper,
          description: description || (typeUpper === 'DEPOSIT' ? 'Deposit' : typeUpper === 'REFUND' ? 'Refund' : 'Withdrawal'),
          referenceId: safeReference,
          balanceAfter: updatedWallet.balance,
        },
      });
      return { duplicate: false as const, balance: updatedWallet.balance, transaction };
    });

    if ('insufficient' in outcome) {
      return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
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