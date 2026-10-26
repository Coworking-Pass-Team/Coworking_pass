import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getKsaNow } from "@/lib/time-utils";

type Tx = Prisma.TransactionClient;

const KSA_OFFSET_MS = 3 * 3600_000;

/** Start of the current calendar month in Saudi Arabia, as a real (UTC) instant. */
export function ksaMonthStart(now: Date = getKsaNow()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - KSA_OFFSET_MS);
}

/** What a member has taken from the company wallet this month, net of what was returned (refunds). */
export async function memberSpentThisMonth(db: Tx | typeof prisma, companyId: string, userId: string): Promise<number> {
  const since = ksaMonthStart();
  const rows = await db.companyWalletTransaction.groupBy({
    by: ["type"],
    where: { companyId, userId, createdAt: { gte: since }, type: { in: ["WITHDRAW", "REFUND"] } },
    _sum: { amount: true },
  });
  const sum = (type: string) => rows.find((r) => r.type === type)?._sum.amount ?? 0;
  return Math.max(0, Math.round((sum("WITHDRAW") - sum("REFUND")) * 100) / 100);
}

export interface MemberAllowance {
  enabled: boolean;
  monthlyLimit: number | null;
  spentThisMonth: number;
  remaining: number;
}

/** The member's spending allowance under the company's policy (0 remaining while the policy is off). */
export async function memberAllowance(
  db: Tx | typeof prisma,
  company: { id: string; employeeSpendingEnabled: boolean; employeeMonthlyLimit: number | null },
  userId: string
): Promise<MemberAllowance> {
  const spent = await memberSpentThisMonth(db, company.id, userId);
  const limit = company.employeeMonthlyLimit;
  const enabled = company.employeeSpendingEnabled && limit !== null && limit > 0;
  return {
    enabled,
    monthlyLimit: limit,
    spentThisMonth: spent,
    remaining: enabled ? Math.max(0, Math.round(((limit as number) - spent) * 100) / 100) : 0,
  };
}

export type SpendOutcome =
  | { ok: true; balance: number; duplicate: boolean }
  | { ok: false; code: "COMPANY_NOT_FOUND" | "POLICY_DISABLED" | "LIMIT_EXCEEDED" | "INSUFFICIENT_BALANCE"; remaining?: number };

/**
 * Takes money out of the company wallet on behalf of a team member (a team booking paid by the member, or the
 * price difference of a reschedule). Enforces the company's policy: spending must be switched on and the member's
 * monthly limit must not be exceeded. Idempotent per referenceId. Must run inside a transaction.
 */
export async function spendFromCompanyWallet(
  tx: Tx,
  params: { companyId: string; userId: string; amount: number; referenceId: string | null; description: string }
): Promise<SpendOutcome> {
  const { companyId, userId, amount, referenceId, description } = params;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"spend:" + companyId + ":" + userId}))`;

  if (referenceId) {
    const existing = await tx.companyWalletTransaction.findFirst({ where: { companyId, userId, type: "WITHDRAW", referenceId } });
    if (existing) return { ok: true, balance: existing.balanceAfter, duplicate: true };
  }

  const company = await tx.company.findUnique({
    where: { id: companyId },
    select: { id: true, employeeSpendingEnabled: true, employeeMonthlyLimit: true },
  });
  if (!company) return { ok: false, code: "COMPANY_NOT_FOUND" };

  const allowance = await memberAllowance(tx, company, userId);
  if (!allowance.enabled) return { ok: false, code: "POLICY_DISABLED" };
  if (amount > allowance.remaining + 0.001) return { ok: false, code: "LIMIT_EXCEEDED", remaining: allowance.remaining };

  // Atomic conditional decrement: the balance check and the deduction are one statement
  const deducted = await tx.company.updateMany({ where: { id: companyId, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
  if (deducted.count === 0) return { ok: false, code: "INSUFFICIENT_BALANCE" };

  const updated = await tx.company.findUniqueOrThrow({ where: { id: companyId } });
  await tx.companyWalletTransaction.create({
    data: { companyId, userId, amount, type: "WITHDRAW", description, referenceId, balanceAfter: updated.balance },
  });
  return { ok: true, balance: updated.balance, duplicate: false };
}

/** Puts money back into the company wallet and records it against the member who spent it. */
export async function returnToCompanyWallet(
  tx: Tx,
  params: { companyId: string; userId: string | null; amount: number; referenceId: string | null; description: string }
): Promise<{ balance: number }> {
  const { companyId, userId, amount, referenceId, description } = params;
  const updated = await tx.company.update({ where: { id: companyId }, data: { balance: { increment: amount } } });
  await tx.companyWalletTransaction.create({
    data: { companyId, userId, amount, type: "REFUND", description, referenceId, balanceAfter: updated.balance },
  });
  return { balance: updated.balance };
}
