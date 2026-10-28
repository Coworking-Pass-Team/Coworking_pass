import type { Prisma, WalletTransaction } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Company money inside a member's personal wallet.
 *
 * - Allocations from the HR admin add to the wallet balance and to `companyCredit`, the part that is company money.
 * - Payments spend company money first, within the member's optional monthly limit (`User.companySpendLimit`);
 *   the rest comes from the member's own money. Cash withdrawals use the member's own money only.
 * - Refunds return company money first, up to the company-funded spending not yet returned. If the member has
 *   left the company by then, that part goes straight back to the company wallet.
 * - When a member leaves (or their account is deleted), the unspent company money returns to the company wallet.
 *
 * Every movement records `companyAmount` on the member's ledger row; a return also writes a company ledger row.
 */

const cents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/** First moment of the current month in Saudi time (UTC+3), as a real UTC instant. Limits reset on the 1st. */
export function ksaMonthStart(now = new Date()): Date {
  const ksa = new Date(now.getTime() + 3 * 3_600_000);
  return new Date(Date.UTC(ksa.getUTCFullYear(), ksa.getUTCMonth(), 1) - 3 * 3_600_000);
}

/** Serializes every balance change of one wallet inside the current transaction. */
async function lockWallet(tx: Tx, userId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"wallet-funds:" + userId}))`;
  return tx.wallet.upsert({ where: { userId }, create: { userId, balance: 0 }, update: {} });
}

/** Company money the member spent this month, net of what was refunded back this month. */
export async function companySpentThisMonth(tx: Tx, walletId: string): Promise<number> {
  const rows = await tx.walletTransaction.groupBy({
    by: ["type"],
    where: { walletId, type: { in: ["WITHDRAW", "REFUND"] }, createdAt: { gte: ksaMonthStart() } },
    _sum: { companyAmount: true },
  });
  const sum = (type: string) => cents(rows.find((r) => r.type === type)?._sum.companyAmount ?? 0);
  return fromCents(Math.max(0, sum("WITHDRAW") - sum("REFUND")));
}

/** Company-funded spending that no refund has returned yet (all time). */
async function companySpendOutstanding(tx: Tx, walletId: string): Promise<number> {
  const rows = await tx.walletTransaction.groupBy({
    by: ["type"],
    where: { walletId, type: { in: ["WITHDRAW", "REFUND"] } },
    _sum: { companyAmount: true },
  });
  const sum = (type: string) => cents(rows.find((r) => r.type === type)?._sum.companyAmount ?? 0);
  return fromCents(Math.max(0, sum("WITHDRAW") - sum("REFUND")));
}

/** Allocation: credits company money to a member's wallet. Returns the wallet and the new balance. */
export async function creditCompanyFunds(tx: Tx, params: { userId: string; companyId: string; amount: number }) {
  const wallet = await lockWallet(tx, params.userId);
  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: params.amount },
      companyCredit: fromCents(cents(wallet.companyCreditCompanyId === params.companyId ? wallet.companyCredit : 0) + cents(params.amount)),
      companyCreditCompanyId: params.companyId,
    },
  });
  return { walletId: wallet.id, balance: updated.balance };
}

export type DebitResult =
  | { ok: true; balance: number; companyAmount: number; transaction: WalletTransaction }
  | { ok: false; status: 400; code: "INSUFFICIENT_BALANCE" | "COMPANY_SPEND_LIMIT"; error: string };

/**
 * Takes money out of a member's personal wallet. A payment spends company money first, up to what is left of the
 * monthly limit; a cash withdrawal uses the member's own money only. Refused as a whole if the money is not there.
 */
export async function debitPersonalWallet(
  tx: Tx,
  params: { userId: string; amount: number; purpose: "PAYMENT" | "CASH_OUT"; description: string; referenceId: string | null }
): Promise<DebitResult> {
  const { userId, amount, purpose, description, referenceId } = params;
  const wallet = await lockWallet(tx, userId);
  const owner = await tx.user.findUnique({ where: { id: userId }, select: { companyId: true, companySpendLimit: true } });

  const companyCredit = cents(wallet.companyCredit);
  const own = Math.max(0, cents(wallet.balance) - companyCredit);
  const memberOfFunder = !!owner?.companyId && owner.companyId === wallet.companyCreditCompanyId;

  let usable = purpose === "PAYMENT" && memberOfFunder ? companyCredit : 0;
  let limitLeft: number | null = null;
  if (usable > 0 && owner?.companySpendLimit != null) {
    limitLeft = Math.max(0, cents(owner.companySpendLimit) - cents(await companySpentThisMonth(tx, wallet.id)));
    usable = Math.min(usable, limitLeft);
  }

  const wanted = cents(amount);
  const fromCompany = Math.min(wanted, usable);
  if (wanted - fromCompany > own) {
    if (limitLeft !== null && limitLeft < Math.min(wanted, companyCredit)) {
      return {
        ok: false,
        status: 400,
        code: "COMPANY_SPEND_LIMIT",
        error: `Your company's monthly spending limit is reached: SAR ${fromCents(limitLeft)} of company funds is left this month. Top up your own wallet to pay the rest.`,
      };
    }
    return { ok: false, status: 400, code: "INSUFFICIENT_BALANCE", error: "Insufficient balance." };
  }

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: fromCents(cents(wallet.balance) - wanted), companyCredit: fromCents(companyCredit - fromCompany) },
  });
  const transaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId,
      amount,
      type: "WITHDRAW",
      description,
      referenceId,
      balanceAfter: updated.balance,
      companyAmount: fromCents(fromCompany),
    },
  });
  return { ok: true, balance: updated.balance, companyAmount: fromCents(fromCompany), transaction };
}

export interface RefundResult {
  balance: number;
  transaction: WalletTransaction;
  /** Part of the refund that went straight back to the company wallet because the member has left it */
  returnedToCompany: number;
}

/**
 * Pays a refund into a member's personal wallet. The company-funded part (at most `companyShareCap` when the
 * original charge is known, and never more than the company spending not yet returned) becomes company money
 * again, or goes back to the company wallet when the member no longer belongs to that company.
 */
export async function refundPersonalWallet(
  tx: Tx,
  params: { userId: string; amount: number; description: string; referenceId: string | null; companyShareCap?: number }
): Promise<RefundResult> {
  const { userId, amount, description, referenceId, companyShareCap } = params;
  const wallet = await lockWallet(tx, userId);

  let share = Math.min(cents(amount), cents(await companySpendOutstanding(tx, wallet.id)));
  if (companyShareCap !== undefined) share = Math.min(share, cents(companyShareCap));
  const funderId = wallet.companyCreditCompanyId;
  const funder = share > 0 && funderId ? await tx.company.findUnique({ where: { id: funderId }, select: { id: true } }) : null;
  if (!funder) share = 0;

  const owner = share > 0 ? await tx.user.findUnique({ where: { id: userId }, select: { companyId: true, name: true } }) : null;
  const stillMember = !!owner && owner.companyId === funderId;
  const returnedToCompany = share > 0 && !stillMember ? share : 0;

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: fromCents(cents(wallet.balance) + cents(amount) - returnedToCompany),
      companyCredit: fromCents(cents(wallet.companyCredit) + (stillMember ? share : 0)),
    },
  });
  const transaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId,
      amount: fromCents(cents(amount) - returnedToCompany),
      type: "REFUND",
      description,
      referenceId,
      balanceAfter: updated.balance,
      companyAmount: fromCents(share),
    },
  });

  if (returnedToCompany > 0 && funderId) {
    const company = await tx.company.update({ where: { id: funderId }, data: { balance: { increment: fromCents(returnedToCompany) } } });
    await tx.companyWalletTransaction.create({
      data: {
        companyId: funderId,
        userId,
        amount: fromCents(returnedToCompany),
        type: "REFUND",
        description: `Refund of company funds spent by ${owner?.name ?? "a former member"}`,
        referenceId: referenceId ? `member-refund:${referenceId}` : null,
        balanceAfter: company.balance,
      },
    });
  }
  return { balance: updated.balance, transaction, returnedToCompany: fromCents(returnedToCompany) };
}

/**
 * Returns the member's unspent company money to the company wallet (member removed from the team or account
 * deleted). Writes a RECLAIM row on both ledgers. Returns the amount moved (0 when there was none).
 */
export async function reclaimCompanyCredit(tx: Tx, params: { userId: string; companyId: string; memberName: string }): Promise<number> {
  const { userId, companyId, memberName } = params;
  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.companyCreditCompanyId !== companyId || wallet.companyCredit <= 0) return 0;
  // Same order as an allocation (company first, then the wallet), so the two can never deadlock
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"alloc:" + companyId}))`;
  const locked = await lockWallet(tx, userId);

  const amount = Math.min(cents(locked.companyCredit), cents(locked.balance));
  if (amount <= 0) return 0;
  const updated = await tx.wallet.update({
    where: { id: locked.id },
    data: { balance: fromCents(cents(locked.balance) - amount), companyCredit: 0 },
  });
  await tx.walletTransaction.create({
    data: {
      walletId: locked.id,
      userId,
      amount: fromCents(amount),
      type: "RECLAIM",
      description: "Unspent company funds returned to the company",
      referenceId: `reclaim:${companyId}`,
      balanceAfter: updated.balance,
      companyAmount: fromCents(amount),
    },
  });
  const company = await tx.company.update({ where: { id: companyId }, data: { balance: { increment: fromCents(amount) } } });
  await tx.companyWalletTransaction.create({
    data: {
      companyId,
      userId,
      amount: fromCents(amount),
      type: "RECLAIM",
      description: `Unspent funds returned by ${memberName}`,
      referenceId: `reclaim:${userId}`,
      balanceAfter: company.balance,
    },
  });
  return fromCents(amount);
}
