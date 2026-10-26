import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/wallet";
import { returnToCompanyWallet, spendFromCompanyWallet } from "@/lib/company-spending";

type Tx = Prisma.TransactionClient;

/** One free reschedule per booking. */
export const FREE_RESCHEDULES = 1;
/** The new slot may be at most this many days after the original date. */
export const MAX_RESCHEDULE_AHEAD_DAYS = 30;

/**
 * Notice needed before the original start, the same as the cancellation window: 6 hours for an individual's own
 * booking, 24 hours for HR admins and for anything paid from the company wallet.
 */
export function rescheduleNoticeHours(ownerRole: string, companyFunded: boolean): number {
  return ownerRole === "B2C" && !companyFunded ? 6 : 24;
}

interface Rates {
  hourlyRate?: number | null;
  dailyRate?: number | null;
  monthlyRate?: number | null;
  yearlyRate?: number | null;
}

/** Price of an hourly session in a room (the hourly rate, or a quarter of the daily rate when none is set). */
export function hourlyQuote(section: Rates, workspace: Rates, hours: number): number {
  const perHour = section.hourlyRate ?? Math.round((section.dailyRate ?? workspace.dailyRate ?? 0) / 4);
  return Math.max(0, perHour) * Math.max(1, hours);
}

/** Rate of a direct booking's plan in a room (falls back to the venue's rate). */
export function directRate(section: Rates, workspace: Rates, durationType: string): number {
  const pick =
    durationType === "YEARLY"
      ? section.yearlyRate ?? workspace.yearlyRate
      : durationType === "MONTHLY"
        ? section.monthlyRate ?? workspace.monthlyRate
        : section.dailyRate ?? workspace.dailyRate;
  return Math.max(0, pick ?? 0);
}

/**
 * What the moved booking should cost, keeping whatever discount, VAT or points were applied the first time:
 * the amount paid scaled by the new room's price over the old room's price. Same room means the same amount.
 */
export function repricedAmount(paid: number, oldQuote: number, newQuote: number): number {
  if (paid <= 0 || oldQuote <= 0 || newQuote === oldQuote) return paid;
  return Math.round(paid * (newQuote / oldQuote) * 100) / 100;
}

export type SettleOutcome =
  | { ok: true; delta: number; target: "COMPANY" | "PERSONAL" | "NONE" }
  | { ok: false; status: number; code: string; error: string };

/**
 * Settles the price difference of a rescheduled booking on the wallet that paid for it: the company wallet when
 * the payment was funded by the company (or the owner is the company's HR admin), otherwise the owner's wallet.
 * A positive delta charges, a negative one refunds. Runs inside the reschedule transaction.
 */
export async function settlePriceDifference(
  tx: Tx,
  params: {
    ownerId: string;
    ownerRole: string;
    payment: { id: string; companyId: string | null } | null;
    delta: number;
    reference: string;
    label: string;
  }
): Promise<SettleOutcome> {
  const { ownerId, ownerRole, payment, delta, reference, label } = params;
  if (!payment || Math.abs(delta) < 0.005) return { ok: true, delta: 0, target: "NONE" };

  const referenceId = `reschedule:${reference}`;
  const hrCompany = ownerRole === "HR_ADMIN" ? await tx.company.findUnique({ where: { hrAdminId: ownerId }, select: { id: true } }) : null;
  const companyId = payment.companyId ?? hrCompany?.id ?? null;

  if (delta < 0) {
    const amount = Math.abs(delta);
    if (companyId) {
      await returnToCompanyWallet(tx, { companyId, userId: ownerId, amount, referenceId, description: `Price difference refunded: ${label}` });
    } else {
      await creditWallet(tx, { userId: ownerId, amount, type: "REFUND", description: `Price difference refunded: ${label}`, referenceId });
    }
    await tx.payment.update({ where: { id: payment.id }, data: { amount: { increment: delta } } });
    return { ok: true, delta, target: companyId ? "COMPANY" : "PERSONAL" };
  }

  if (companyId) {
    if (hrCompany && hrCompany.id === companyId) {
      // The HR admin spends the company wallet directly (no member policy applies to them)
      const deducted = await tx.company.updateMany({ where: { id: companyId, balance: { gte: delta } }, data: { balance: { decrement: delta } } });
      if (deducted.count === 0) return { ok: false, status: 400, code: "INSUFFICIENT_BALANCE", error: "The company wallet does not have enough balance for the price difference." };
      const updated = await tx.company.findUniqueOrThrow({ where: { id: companyId } });
      await tx.companyWalletTransaction.create({
        data: { companyId, userId: ownerId, amount: delta, type: "WITHDRAW", description: `Price difference: ${label}`, referenceId, balanceAfter: updated.balance },
      });
    } else {
      const spent = await spendFromCompanyWallet(tx, { companyId, userId: ownerId, amount: delta, referenceId, description: `Price difference: ${label}` });
      if (!spent.ok) {
        const message =
          spent.code === "INSUFFICIENT_BALANCE"
            ? "The company wallet does not have enough balance for the price difference."
            : spent.code === "LIMIT_EXCEEDED"
              ? "The price difference is more than your remaining monthly company allowance."
              : "Your company has not allowed team members to pay from the company wallet.";
        return { ok: false, status: 400, code: spent.code, error: message };
      }
    }
    await tx.payment.update({ where: { id: payment.id }, data: { amount: { increment: delta } } });
    return { ok: true, delta, target: "COMPANY" };
  }

  // The owner's personal wallet: conditional decrement so it can never go negative
  const wallet = await tx.wallet.findUnique({ where: { userId: ownerId } });
  const deducted = wallet
    ? await tx.wallet.updateMany({ where: { id: wallet.id, balance: { gte: delta } }, data: { balance: { decrement: delta } } })
    : { count: 0 };
  if (!wallet || deducted.count === 0) {
    return { ok: false, status: 400, code: "INSUFFICIENT_BALANCE", error: "Your wallet does not have enough balance for the price difference. Top it up and try again." };
  }
  const after = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
  await tx.walletTransaction.create({
    data: { walletId: wallet.id, userId: ownerId, amount: delta, type: "WITHDRAW", description: `Price difference: ${label}`, referenceId, balanceAfter: after.balance },
  });
  await tx.payment.update({ where: { id: payment.id }, data: { amount: { increment: delta } } });
  return { ok: true, delta, target: "PERSONAL" };
}

/**
 * Who may move a booking: the person who made it, a Super Admin, or the HR admin of the company whose wallet paid
 * for it. Team members it was made for can see it but not change it.
 */
export async function mayReschedule(
  caller: { userId: string; role: string },
  booking: { userId: string },
  paymentCompanyId: string | null
): Promise<boolean> {
  if (caller.role === "SUPER_ADMIN" || booking.userId === caller.userId) return true;
  if (caller.role === "HR_ADMIN" && paymentCompanyId) {
    const company = await prisma.company.findUnique({ where: { hrAdminId: caller.userId }, select: { id: true } });
    return company?.id === paymentCompanyId;
  }
  return false;
}

/** Tells the booking owner, the venue's partner and (for company-funded bookings) the HR admin about the move. */
export async function notifyRescheduled(params: {
  ownerId: string;
  actorId: string;
  workspaceId: string | null;
  venueName: string;
  roomName: string | null | undefined;
  fromLabel: string;
  toLabel: string;
  companyId: string | null;
  attendeeIds: string[];
}) {
  try {
    const { ownerId, actorId, workspaceId, venueName, roomName, fromLabel, toLabel, companyId, attendeeIds } = params;
    const room = roomName ? ` (${roomName})` : "";
    const rows: Prisma.NotificationCreateManyInput[] = [];
    const push = (userId: string, title: string, message: string) =>
      rows.push({ userId, type: "BOOKING_CONFIRMED", title, message, channel: "IN_APP", sentAt: new Date() });

    push(ownerId, "Booking Rescheduled", `Your booking at ${venueName}${room} moved from ${fromLabel} to ${toLabel}.`);
    for (const id of attendeeIds) if (id !== ownerId) push(id, "Booking Rescheduled", `Your booking at ${venueName}${room} moved from ${fromLabel} to ${toLabel}.`);

    if (workspaceId) {
      const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { partner: { select: { contactEmail: true } } } });
      const email = ws?.partner?.contactEmail;
      if (email) {
        const partnerUser = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, role: "PARTNER_ADMIN" }, select: { id: true } });
        if (partnerUser && partnerUser.id !== ownerId) push(partnerUser.id, "Booking Rescheduled", `A booking at ${venueName}${room} moved from ${fromLabel} to ${toLabel}.`);
      }
    }
    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { hrAdminId: true } });
      if (company && company.hrAdminId !== ownerId && company.hrAdminId !== actorId) {
        push(company.hrAdminId, "Booking Rescheduled", `A company booking at ${venueName}${room} moved from ${fromLabel} to ${toLabel}.`);
      }
    }
    if (rows.length > 0) await prisma.notification.createMany({ data: rows });
  } catch (err) {
    console.warn("Reschedule notification failed:", err);
  }
}
