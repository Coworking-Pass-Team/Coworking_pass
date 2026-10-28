import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/wallet";
import { debitPersonalWallet } from "@/lib/company/credit";

type Tx = Prisma.TransactionClient;

/** One free reschedule per booking. */
export const FREE_RESCHEDULES = 1;
/** The new slot may be at most this many days after the original date. */
export const MAX_RESCHEDULE_AHEAD_DAYS = 30;

/**
 * Notice needed before the original start, the same as the cancellation window: 6 hours for a member's own
 * booking (their wallet, including money the company allocated to it), 24 hours for HR admins.
 */
export function rescheduleNoticeHours(ownerRole: string): number {
  return ownerRole === "B2C" ? 6 : 24;
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
 * Settles the price difference of a rescheduled booking on the wallet that paid: the company wallet for the HR admin
 * who owns the booking, the owner's own wallet for everyone else. A positive delta charges, a negative one refunds.
 * Runs inside the reschedule transaction.
 */
export async function settlePriceDifference(
  tx: Tx,
  params: {
    ownerId: string;
    ownerRole: string;
    payment: { id: string } | null;
    delta: number;
    reference: string;
    label: string;
  }
): Promise<SettleOutcome> {
  const { ownerId, ownerRole, payment, delta, reference, label } = params;
  if (!payment || Math.abs(delta) < 0.005) return { ok: true, delta: 0, target: "NONE" };

  const referenceId = `reschedule:${reference}`;

  if (delta < 0) {
    // creditWallet sends an HR admin's refund to the company wallet and everyone else's to their own wallet
    const credited = await creditWallet(tx, { userId: ownerId, amount: Math.abs(delta), type: "REFUND", description: `Price difference refunded: ${label}`, referenceId });
    await tx.payment.update({ where: { id: payment.id }, data: { amount: { increment: delta } } });
    return { ok: true, delta, target: credited.target };
  }

  const hrCompany = ownerRole === "HR_ADMIN" ? await tx.company.findUnique({ where: { hrAdminId: ownerId }, select: { id: true } }) : null;
  if (hrCompany) {
    const deducted = await tx.company.updateMany({ where: { id: hrCompany.id, balance: { gte: delta } }, data: { balance: { decrement: delta } } });
    if (deducted.count === 0) return { ok: false, status: 400, code: "INSUFFICIENT_BALANCE", error: "The company wallet does not have enough balance for the price difference." };
    const updated = await tx.company.findUniqueOrThrow({ where: { id: hrCompany.id } });
    await tx.companyWalletTransaction.create({
      data: { companyId: hrCompany.id, userId: ownerId, amount: delta, type: "WITHDRAW", description: `Price difference: ${label}`, referenceId, balanceAfter: updated.balance },
    });
    await tx.payment.update({ where: { id: payment.id }, data: { amount: { increment: delta } } });
    return { ok: true, delta, target: "COMPANY" };
  }

  // The owner's own wallet (company money first for team members); never goes negative
  const debited = await debitPersonalWallet(tx, { userId: ownerId, amount: delta, purpose: "PAYMENT", description: `Price difference: ${label}`, referenceId });
  if (!debited.ok) {
    return debited.code === "COMPANY_SPEND_LIMIT"
      ? { ok: false, status: 400, code: debited.code, error: debited.error }
      : { ok: false, status: 400, code: "INSUFFICIENT_BALANCE", error: "Your wallet does not have enough balance for the price difference. Top it up and try again." };
  }
  await tx.payment.update({ where: { id: payment.id }, data: { amount: { increment: delta } } });
  return { ok: true, delta, target: "PERSONAL" };
}

/** Who may move a booking: the person who made it or a Super Admin. People a booking was made for can only view it. */
export function mayReschedule(caller: { userId: string; role: string }, booking: { userId: string }): boolean {
  return caller.role === "SUPER_ADMIN" || booking.userId === caller.userId;
}

/** Tells the booking owner, the people it was made for and the venue's partner about the move. */
export async function notifyRescheduled(params: {
  ownerId: string;
  workspaceId: string | null;
  venueName: string;
  roomName: string | null | undefined;
  fromLabel: string;
  toLabel: string;
  attendeeIds: string[];
}) {
  try {
    const { ownerId, workspaceId, venueName, roomName, fromLabel, toLabel, attendeeIds } = params;
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
    if (rows.length > 0) await prisma.notification.createMany({ data: rows });
  } catch (err) {
    console.warn("Reschedule notification failed:", err);
  }
}
