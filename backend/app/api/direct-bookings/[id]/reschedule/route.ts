import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { getKsaNow, parseDateAndTimeToKsaDate } from "@/lib/time-utils";
import { directBookingEnd, effectiveCapacity, getOccupiedSeats, getOccupiedSeatsForSection, startOfDay } from "@/lib/capacity";
import {
  FREE_RESCHEDULES,
  MAX_RESCHEDULE_AHEAD_DAYS,
  directRate,
  mayReschedule,
  notifyRescheduled,
  repricedAmount,
  rescheduleNoticeHours,
  settlePriceDifference,
} from "@/lib/reschedule";

const HOUR_MS = 3_600_000;

const label = (d: Date) => d.toISOString().slice(0, 10);

function refuse(status: number, code: string, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, code, ...extra }, { status });
}

/**
 * @swagger
 * /api/direct-bookings/{id}/reschedule:
 *   post:
 *     summary: Move a daily, monthly or yearly booking to another start date (one free change, same notice as cancellation)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingDate]
 *             properties:
 *               bookingDate:
 *                 type: string
 *                 example: "2026-11-03"
 *               sectionId:
 *                 type: string
 *                 description: Another room of the same venue and type (optional)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const booking = await prisma.directBooking.findUnique({
      where: { id },
      include: { user: { select: { id: true, role: true } }, section: true, workspace: { include: { sections: true } } },
    });
    if (!booking) return refuse(404, "NOT_FOUND", "Booking not found.");

    const payments = await prisma.payment.findMany({
      where: { referenceId: id, paymentFor: "DIRECT_BOOKING", status: "SUCCESS" },
      orderBy: { createdAt: "asc" },
    });
    const fundingCompanyId = payments.find((p) => p.companyId)?.companyId ?? null;
    if (!(await mayReschedule(user, booking, fundingCompanyId))) {
      return refuse(403, "FORBIDDEN", "You are not allowed to reschedule this booking.");
    }

    const isAdmin = user.role === "SUPER_ADMIN";
    const nowKsa = getKsaNow();
    if (booking.status !== "CONFIRMED" || booking.bookingDate.getTime() <= nowKsa.getTime()) {
      return refuse(400, "NOT_ELIGIBLE", "Only a confirmed booking that has not started yet can be rescheduled.");
    }
    if (!isAdmin && booking.rescheduleCount >= FREE_RESCHEDULES) {
      return refuse(400, "RESCHEDULE_LIMIT", "This booking was already rescheduled once. You can cancel it (inside the cancellation window) and book again.");
    }

    const companyFunded = Boolean(fundingCompanyId) || booking.user.role === "HR_ADMIN";
    const requiredHours = rescheduleNoticeHours(booking.user.role, companyFunded);
    const hoursUntilStart = (booking.bookingDate.getTime() - nowKsa.getTime()) / HOUR_MS;
    if (!isAdmin && hoursUntilStart < requiredHours) {
      return refuse(400, "RESCHEDULE_WINDOW", `Rescheduling is not allowed. Must reschedule at least ${requiredHours} hours before the booking starts.`, { requiredHours });
    }

    if (typeof body.bookingDate !== "string") return refuse(400, "INVALID_SLOT", "bookingDate is required.");
    const newStart = parseDateAndTimeToKsaDate(body.bookingDate, null, 9);
    if (Number.isNaN(newStart.getTime())) return refuse(400, "INVALID_SLOT", "The new date is not valid.");

    const targetSectionId = typeof body.sectionId === "string" && body.sectionId ? body.sectionId : booking.sectionId;
    if (targetSectionId === booking.sectionId && newStart.getTime() === booking.bookingDate.getTime()) {
      return refuse(400, "NOT_CHANGED", "This is the same date. Choose a different date or room.");
    }
    if (!isAdmin && (newStart.getTime() - nowKsa.getTime()) / HOUR_MS < requiredHours) {
      return refuse(400, "RESCHEDULE_WINDOW", `The new date must start at least ${requiredHours} hours from now.`, { requiredHours });
    }
    if (newStart.getTime() - booking.bookingDate.getTime() > MAX_RESCHEDULE_AHEAD_DAYS * 24 * HOUR_MS) {
      return refuse(400, "SLOT_TOO_FAR", `The new date can be at most ${MAX_RESCHEDULE_AHEAD_DAYS} days after the original date.`);
    }

    const workspace = booking.workspace;
    const section = workspace.sections.find((s) => s.id === targetSectionId) ?? null;
    if (!section || section.type !== booking.section.type) {
      return refuse(400, "ROOM_NOT_ALLOWED", "The room must belong to the same venue and be the same type of room.");
    }

    const newEnd = directBookingEnd({ bookingDate: newStart, durationType: booking.durationType, durationDetails: booking.durationDetails });
    const oldRange = { from: startOfDay(booking.bookingDate), to: directBookingEnd(booking) };
    const overlapsOwn = oldRange.from < newEnd && oldRange.to > startOfDay(newStart);

    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    const newPaid = repricedAmount(paid, directRate(booking.section, workspace, booking.durationType), directRate(section, workspace, booking.durationType));
    const delta = Math.round((newPaid - paid) * 100) / 100;
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

    const outcome = await prisma.$transaction(async (tx) => {
      // Same per-venue lock as new bookings, so the last seats can never be taken twice
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"hourly-slot:" + workspace.id}))`;

      const fresh = await tx.directBooking.findUnique({ where: { id }, select: { status: true, rescheduleCount: true, bookingDate: true } });
      if (!fresh || fresh.status !== "CONFIRMED" || fresh.bookingDate.getTime() !== booking.bookingDate.getTime() || (!isAdmin && fresh.rescheduleCount >= FREE_RESCHEDULES)) {
        return { error: refuse(409, "CHANGED", "This booking was just changed. Please reload and try again.") };
      }

      // Capacity of the target room (or the venue) for the new period, not counting this booking's own seats
      if (workspace.sections.length > 1 && section.capacity > 0) {
        const occupied = await getOccupiedSeatsForSection(section.id, newStart, newEnd);
        const others = occupied - (overlapsOwn && section.id === booking.sectionId ? booking.seats : 0);
        if (others + booking.seats > section.capacity) {
          return { error: refuse(409, "SLOT_UNAVAILABLE", `${section.name} has only ${Math.max(0, section.capacity - others)} seat(s) left for the selected period.`) };
        }
      } else {
        const limit = effectiveCapacity(workspace);
        const occupied = (await getOccupiedSeats([workspace.id], newStart, newEnd)).get(workspace.id) || 0;
        const others = occupied - (overlapsOwn ? booking.seats : 0);
        if (others + booking.seats > limit) {
          return { error: refuse(409, "SLOT_UNAVAILABLE", `Not enough availability. Only ${Math.max(0, limit - others)} seat(s) left for the selected period.`) };
        }
      }

      const settled = await settlePriceDifference(tx, {
        ownerId: booking.userId,
        ownerRole: booking.user.role,
        payment: latestPayment ? { id: latestPayment.id, companyId: latestPayment.companyId } : null,
        delta,
        reference: `${id}:${booking.rescheduleCount + 1}`,
        label: `${workspace.name} booking moved`,
      });
      if (!settled.ok) return { error: refuse(settled.status, settled.code, settled.error) };

      const updated = await tx.directBooking.update({
        where: { id },
        data: {
          bookingDate: newStart,
          sectionId: section.id,
          rescheduleCount: { increment: 1 },
          rescheduledFrom: booking.rescheduledFrom ?? booking.bookingDate,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, companyId: true } },
          workspace: true,
          section: true,
        },
      });

      // The seat that was freed goes to the first person on the waitlist, as when a booking is cancelled
      const next = await tx.directBooking.findFirst({
        where: { workspaceId: workspace.id, sectionId: booking.sectionId, status: "WAITLISTED" },
        orderBy: { createdAt: "asc" },
      });
      if (next && !overlapsOwn) {
        await tx.directBooking.update({ where: { id: next.id }, data: { status: "CONFIRMED", bookingDate: new Date() } });
        await tx.notification.create({
          data: {
            userId: next.userId,
            type: "WAITLIST_PROMOTED",
            title: "Booking Confirmed from Waitlist",
            message: "A spot became available and your booking was automatically confirmed.",
            channel: "IN_APP",
            sentAt: new Date(),
          },
        });
      }
      return { updated, settled };
    });

    if ("error" in outcome) return outcome.error;

    await notifyRescheduled({
      ownerId: booking.userId,
      actorId: user.userId,
      workspaceId: workspace.id,
      venueName: workspace.name,
      roomName: section.name,
      fromLabel: label(booking.bookingDate),
      toLabel: label(newStart),
      companyId: fundingCompanyId,
      attendeeIds: booking.attendeeIds,
    });

    return NextResponse.json({
      message: "Booking rescheduled.",
      booking: outcome.updated,
      priceDifference: outcome.settled.delta,
      settledOn: outcome.settled.target,
    });
  } catch (error) {
    console.error("Error rescheduling a direct booking:", error);
    return NextResponse.json({ error: "Failed to reschedule the booking." }, { status: 500 });
  }
}
