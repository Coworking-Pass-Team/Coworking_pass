import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Fair-use rule of the "Unlimited*" plans (PRD, Legal Policies): meeting room and theater sessions have no hours
 * balance on these plans, but each person can hold at most this many sessions per week.
 */
export const FAIR_USE_WEEKLY_LIMIT = 5;

/** Plans sold as "Unlimited*": the Business Pass and Custom Enterprise (same rule as the HR dashboard). */
const UNLIMITED_PLAN_KEYWORDS = ["business", "enterprise"];

export function isUnlimitedPlan(planName: string | null | undefined): boolean {
  const name = (planName || "").toLowerCase();
  return UNLIMITED_PLAN_KEYWORDS.some((keyword) => name.includes(keyword));
}

const DAY_MS = 24 * 3_600_000;

/**
 * The Saudi week (Sunday to Saturday) that contains `start`. Booking timestamps hold KSA wall-clock time in their
 * UTC fields, so the bounds are computed with the UTC getters.
 */
export function fairUseWeek(start: Date): { from: Date; to: Date } {
  const from = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() - start.getUTCDay()));
  return { from, to: new Date(from.getTime() + 7 * DAY_MS) };
}

/** Who a session counts against: the people a company booked it for, otherwise the person who booked it. */
export function sessionParticipants(booking: { userId: string; attendeeIds: string[] }): string[] {
  return booking.attendeeIds.length > 0 ? booking.attendeeIds : [booking.userId];
}

export type FairUseCheck = { ok: true } | { ok: false; status: 409; code: "FAIR_USE_LIMIT"; error: string };

/**
 * Refuses a meeting room or theater session that would give a person on an "Unlimited*" plan more than
 * FAIR_USE_WEEKLY_LIMIT sessions in that week. A person is on such a plan through their own active pass or the
 * active pass of their company's HR admin. Cancelled sessions do not count; `excludeBookingId` leaves out the session
 * being moved. Runs inside the booking transaction and locks each counted person, so two simultaneous bookings
 * cannot both take the last place.
 */
export async function checkFairUse(
  tx: Tx,
  params: { bookerId: string; participantIds: string[]; start: Date; excludeBookingId?: string }
): Promise<FairUseCheck> {
  const { bookerId, participantIds, start, excludeBookingId } = params;
  if (participantIds.length === 0) return { ok: true };

  const now = new Date();
  const activeUnlimitedPass: Prisma.SubscriptionWhereInput = {
    status: "ACTIVE",
    endDate: { gte: now },
    OR: UNLIMITED_PLAN_KEYWORDS.map((keyword) => ({ plan: { planName: { contains: keyword, mode: "insensitive" as const } } })),
  };
  const covered = await tx.user.findMany({
    where: {
      id: { in: participantIds },
      OR: [
        { subscriptions: { some: activeUnlimitedPass } },
        { company: { hrAdmin: { subscriptions: { some: activeUnlimitedPass } } } },
      ],
    },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
  if (covered.length === 0) return { ok: true };

  const { from, to } = fairUseWeek(start);
  for (const person of covered) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"fair-use:" + person.id}))`;
    const sessions = await tx.hourlyBooking.count({
      where: {
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        status: { not: "CANCELLED" },
        startDate: { gte: from, lt: to },
        OR: [{ attendeeIds: { has: person.id } }, { userId: person.id, attendeeIds: { isEmpty: true } }],
      },
    });
    if (sessions >= FAIR_USE_WEEKLY_LIMIT) {
      const week = from.toISOString().slice(0, 10);
      const who = person.id === bookerId ? "you already have" : `${person.name} already has`;
      return {
        ok: false,
        status: 409,
        code: "FAIR_USE_LIMIT",
        error: `Fair use limit reached: ${who} ${FAIR_USE_WEEKLY_LIMIT} bookings in the week starting ${week}. Unlimited plans include up to ${FAIR_USE_WEEKLY_LIMIT} meeting room or theater bookings per person each week.`,
      };
    }
  }
  return { ok: true };
}
