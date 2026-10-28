import { prisma } from "@/lib/prisma";
import { creditCompanyFunds } from "@/lib/company/credit";

const MAX_RECIPIENTS = 500;
const MAX_AMOUNT = 1_000_000;

const cents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

export interface AllocationLine {
  userId: string;
  name: string;
  amount: number;
}

export type AllocationPlan =
  | { ok: true; lines: AllocationLine[]; total: number }
  | { ok: false; status: number; error: string };

/**
 * Works out who gets how much, before any money moves.
 * EQUAL splits `amount` among every team member in whole cents (the cents that do not divide evenly stay in the
 * company wallet); SPECIFIC pays each named member their own amount. Only active members of this company qualify.
 */
export async function planAllocation(
  companyId: string,
  input: { mode: unknown; amount: unknown; allocations: unknown }
): Promise<AllocationPlan> {
  const members = await prisma.user.findMany({
    where: { companyId, role: "B2C", isBanned: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const byId = new Map(members.map((m) => [m.id, m]));

  if (input.mode === "EQUAL") {
    const amount = typeof input.amount === "number" ? input.amount : Number.NaN;
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      return { ok: false, status: 400, error: "Enter an amount greater than zero." };
    }
    if (members.length === 0) return { ok: false, status: 400, error: "There are no team members to allocate funds to." };
    if (members.length > MAX_RECIPIENTS) return { ok: false, status: 400, error: `At most ${MAX_RECIPIENTS} members can be paid in one go.` };
    const share = Math.floor(cents(amount) / members.length);
    if (share < 1) return { ok: false, status: 400, error: "The amount is too small to share between all members." };
    const lines = members.map((m) => ({ userId: m.id, name: m.name, amount: fromCents(share) }));
    return { ok: true, lines, total: fromCents(share * members.length) };
  }

  if (input.mode === "SPECIFIC") {
    const raw = Array.isArray(input.allocations) ? input.allocations : [];
    if (raw.length === 0) return { ok: false, status: 400, error: "Choose at least one team member." };
    if (raw.length > MAX_RECIPIENTS) return { ok: false, status: 400, error: `At most ${MAX_RECIPIENTS} members can be paid in one go.` };
    const seen = new Set<string>();
    const lines: AllocationLine[] = [];
    let totalCents = 0;
    for (const row of raw) {
      const userId = typeof row?.userId === "string" ? row.userId : "";
      const amount = typeof row?.amount === "number" ? row.amount : Number.NaN;
      if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT || cents(amount) < 1) {
        return { ok: false, status: 400, error: "Every amount must be greater than zero." };
      }
      const member = byId.get(userId);
      if (!member) return { ok: false, status: 400, error: "You can only allocate funds to active members of your own team." };
      if (seen.has(userId)) return { ok: false, status: 400, error: "A member can only appear once in an allocation." };
      seen.add(userId);
      lines.push({ userId, name: member.name, amount: fromCents(cents(amount)) });
      totalCents += cents(amount);
    }
    return { ok: true, lines, total: fromCents(totalCents) };
  }

  return { ok: false, status: 400, error: "mode must be EQUAL or SPECIFIC." };
}

export type AllocationResult =
  | { ok: true; duplicate: boolean; balance: number; total: number; lines: AllocationLine[] }
  | { ok: false; status: number; code: string; error: string };

/**
 * Moves the money in one transaction: the company wallet is reduced (only if it holds enough), every recipient's
 * personal wallet is credited and each movement is written to both ledgers. The caller's `requestId` makes the
 * request safe to repeat: a second call with the same id changes nothing and reports the first outcome.
 */
export async function applyAllocation(params: {
  companyId: string;
  companyName: string;
  actorId: string;
  requestId: string;
  lines: AllocationLine[];
  total: number;
}): Promise<AllocationResult> {
  const { companyId, companyName, actorId, requestId, lines, total } = params;
  const batch = `alloc:${requestId}`;

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"alloc:" + companyId}))`;

      const earlier = await tx.companyWalletTransaction.findMany({
        where: { companyId, type: "ALLOCATION", referenceId: { startsWith: `${batch}:` } },
        orderBy: { createdAt: "asc" },
      });
      if (earlier.length > 0) {
        const company = await tx.company.findUniqueOrThrow({ where: { id: companyId }, select: { balance: true } });
        const done = earlier.map((row) => ({ userId: (row.referenceId ?? "").split(":")[2] ?? "", name: (row.description ?? "").replace(/^Allocated to /, ""), amount: row.amount }));
        return { ok: true as const, duplicate: true, balance: company.balance, total: done.reduce((s, l) => s + l.amount, 0), lines: done };
      }

      const deducted = await tx.company.updateMany({ where: { id: companyId, balance: { gte: total } }, data: { balance: { decrement: total } } });
      if (deducted.count === 0) {
        return { ok: false as const, status: 400, code: "INSUFFICIENT_BALANCE", error: "Insufficient company wallet balance." };
      }
      const after = await tx.company.findUniqueOrThrow({ where: { id: companyId }, select: { balance: true } });

      // The company ledger shows the balance after each payment, from the first recipient to the last
      let running = after.balance + total;
      for (const line of lines) {
        running = fromCents(cents(running) - cents(line.amount));

        // Kept apart as company money: spent first, returned to the company if the member leaves
        const credited = await creditCompanyFunds(tx, { userId: line.userId, companyId, amount: line.amount });
        await tx.walletTransaction.create({
          data: {
            walletId: credited.walletId,
            userId: line.userId,
            amount: line.amount,
            type: "DEPOSIT",
            description: `Allocated by ${companyName}`,
            referenceId: `${batch}:${line.userId}`,
            balanceAfter: credited.balance,
            companyAmount: line.amount,
          },
        });
        await tx.companyWalletTransaction.create({
          data: {
            companyId,
            userId: actorId,
            amount: line.amount,
            type: "ALLOCATION",
            description: `Allocated to ${line.name}`,
            referenceId: `${batch}:${line.userId}`,
            balanceAfter: running,
          },
        });
      }
      return { ok: true as const, duplicate: false, balance: after.balance, total, lines };
    },
    { timeout: 60_000, maxWait: 10_000 }
  );
}

/** Tells each recipient that money arrived (best effort; never undoes the allocation). */
export async function notifyRecipients(companyName: string, lines: AllocationLine[]) {
  try {
    await prisma.notification.createMany({
      data: lines.map((line) => ({
        userId: line.userId,
        type: "PAYMENT_SUCCESS" as const,
        title: "Funds added to your wallet",
        message: `${companyName} added SAR ${line.amount} to your wallet.`,
        channel: "IN_APP" as const,
        sentAt: new Date(),
      })),
    });
  } catch (err) {
    console.warn("Allocation notification failed:", err);
  }
}
