import { Prisma } from "@prisma/client";
import { refundPersonalWallet } from "@/lib/company/credit";

export type WalletTx = Prisma.TransactionClient;

export interface WalletMovement {
  userId: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAW" | "REFUND";
  description?: string;
  referenceId?: string | null;
}

export interface WalletMovementResult {
  target: "COMPANY" | "PERSONAL";
  companyId: string | null;
  balance: number;
  /** Company money a former team member spent, sent back to that company instead of the member (refunds only) */
  returnedToCompany: number;
}

/**
 * Corporate accounts (HR admins that own a company) use the shared company wallet;
 * everyone else uses their personal wallet.
 */
export async function findCompanyForUser(tx: WalletTx, userId: string) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { role: true, hrAdminOf: { select: { id: true } } },
  });
  return user?.role === "HR_ADMIN" && user.hrAdminOf ? user.hrAdminOf.id : null;
}

/**
 * Credits the wallet that belongs to the user (company wallet for corporate accounts) and records a
 * ledger row. Must be called inside a prisma.$transaction so the balance and ledger stay consistent.
 */
export async function creditWallet(tx: WalletTx, move: WalletMovement): Promise<WalletMovementResult> {
  const companyId = await findCompanyForUser(tx, move.userId);

  if (companyId) {
    const company = await tx.company.update({
      where: { id: companyId },
      data: { balance: { increment: move.amount } },
    });
    await tx.companyWalletTransaction.create({
      data: {
        companyId,
        userId: move.userId,
        amount: move.amount,
        type: move.type,
        description: move.description ?? null,
        referenceId: move.referenceId ?? null,
        balanceAfter: company.balance,
      },
    });
    return { target: "COMPANY", companyId, balance: company.balance, returnedToCompany: 0 };
  }

  // A refund to a team member returns the company-funded part as company money (see lib/company/credit.ts)
  if (move.type === "REFUND") {
    const refunded = await refundPersonalWallet(tx, {
      userId: move.userId,
      amount: move.amount,
      description: move.description ?? "Refund",
      referenceId: move.referenceId ?? null,
    });
    return { target: "PERSONAL", companyId: null, balance: refunded.balance, returnedToCompany: refunded.returnedToCompany };
  }

  const wallet = await tx.wallet.upsert({
    where: { userId: move.userId },
    create: { userId: move.userId, balance: 0 },
    update: {},
  });
  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: move.amount } },
  });
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId: move.userId,
      amount: move.amount,
      type: move.type,
      description: move.description ?? null,
      referenceId: move.referenceId ?? null,
      balanceAfter: updated.balance,
    },
  });
  return { target: "PERSONAL", companyId: null, balance: updated.balance, returnedToCompany: 0 };
}
