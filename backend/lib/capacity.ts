import { prisma } from "@/lib/prisma";
import { getKsaNow } from "@/lib/time-utils";

const DAY_MS = 24 * 60 * 60 * 1000;

/** First instant (KSA wall-clock stored as UTC) of the day containing `date`. */
export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Last day (exclusive end instant) covered by a direct booking, derived from its duration. */
export function directBookingEnd(b: { bookingDate: Date; durationType: string; durationDetails: string | null }): Date {
  const start = startOfDay(b.bookingDate);
  const amount = Math.max(1, parseInt((b.durationDetails || "").match(/\d+/)?.[0] || "1", 10) || 1);
  if (b.durationType === "YEARLY") {
    return new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), start.getUTCDate()));
  }
  if (b.durationType === "MONTHLY") {
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + amount, start.getUTCDate()));
  }
  return new Date(start.getTime() + amount * DAY_MS);
}

/**
 * Seats occupied per workspace during [from, to). Direct bookings occupy whole days;
 * hourly bookings occupy their exact time window. Cancelled/refunded/expired bookings are ignored.
 */
export async function getOccupiedSeats(workspaceIds: string[], from: Date, to: Date): Promise<Map<string, number>> {
  const occupied = new Map<string, number>();
  if (workspaceIds.length === 0) return occupied;
  const add = (id: string, n: number) => occupied.set(id, (occupied.get(id) || 0) + n);

  // Direct bookings that started before the window ends; the end is derived per booking in JS
  const direct = await prisma.directBooking.findMany({
    where: { workspaceId: { in: workspaceIds }, status: "CONFIRMED", bookingDate: { lt: to } },
    select: { workspaceId: true, bookingDate: true, durationType: true, durationDetails: true, seats: true },
  });
  for (const b of direct) {
    if (directBookingEnd(b) > startOfDay(from)) add(b.workspaceId, b.seats || 1);
  }

  const hourly = await prisma.hourlyBooking.findMany({
    where: {
      workspaceId: { in: workspaceIds },
      status: "ACTIVE",
      startDate: { lt: to },
      endDate: { gt: from },
      // Halls and theaters are booked per session and per unit, so they never lock the whole workspace
      section: { type: "DESK" },
    },
    select: { workspaceId: true, seats: true },
  });
  for (const b of hourly) {
    if (b.workspaceId) add(b.workspaceId, b.seats || 1);
  }

  return occupied;
}

/** Occupied seats for the current KSA day, used for the availability shown on cards and detail pages. */
export async function getOccupiedSeatsToday(workspaceIds: string[]): Promise<Map<string, number>> {
  const dayStart = startOfDay(getKsaNow());
  return getOccupiedSeats(workspaceIds, dayStart, new Date(dayStart.getTime() + DAY_MS));
}

/** Seats held in one room / section during [from, to): its confirmed direct bookings plus active hourly sessions. */
export async function getOccupiedSeatsForSection(sectionId: string, from: Date, to: Date): Promise<number> {
  let total = 0;
  const direct = await prisma.directBooking.findMany({
    where: { sectionId, status: "CONFIRMED", bookingDate: { lt: to } },
    select: { bookingDate: true, durationType: true, durationDetails: true, seats: true },
  });
  for (const b of direct) {
    if (directBookingEnd(b) > startOfDay(from)) total += b.seats || 1;
  }
  const hourly = await prisma.hourlyBooking.findMany({
    where: { sectionId, status: "ACTIVE", startDate: { lt: to }, endDate: { gt: from } },
    select: { seats: true },
  });
  for (const b of hourly) total += b.seats || 1;
  return total;
}
