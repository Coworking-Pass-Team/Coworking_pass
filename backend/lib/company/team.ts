import { prisma } from "@/lib/prisma";

const MAX_ATTENDEES = 200;

/**
 * Team members a company booking is made for. Only an HR admin can name attendees, and only people who are
 * members of that HR admin's own company (never the booker, never suspended accounts). Anything else is dropped.
 */
export async function resolveAttendeeIds(bookerId: string, raw: unknown): Promise<string[]> {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const wanted = Array.from(
    new Set(raw.filter((id): id is string => typeof id === "string" && id.length > 0 && id !== bookerId))
  ).slice(0, MAX_ATTENDEES);
  if (wanted.length === 0) return [];
  const company = await prisma.company.findUnique({ where: { hrAdminId: bookerId }, select: { id: true } });
  if (!company) return [];
  const members = await prisma.user.findMany({
    where: { id: { in: wanted }, companyId: company.id, isBanned: false },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

/** Tells each attendee a booking was made for them (best effort, never blocks the booking). */
export async function notifyAttendees(
  attendeeIds: string[],
  venueName: string,
  roomName: string | null | undefined,
  when: string
) {
  if (attendeeIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: attendeeIds.map((userId) => ({
        userId,
        type: "BOOKING_CONFIRMED" as const,
        title: "Booked for you by your company",
        message: `Your company booked ${venueName}${roomName ? ` (${roomName})` : ""} for you: ${when}. You can see it under your bookings.`,
        channel: "IN_APP" as const,
        sentAt: new Date(),
      })),
    });
  } catch (err) {
    console.warn("Attendee notification failed:", err);
  }
}
