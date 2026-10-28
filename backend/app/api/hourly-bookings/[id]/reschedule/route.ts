import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { getKsaNow, parseDateAndTimeToKsaDate } from "@/lib/time-utils";
import { getOccupiedSeats } from "@/lib/booking/capacity";
import { effectiveCapacity } from "@/lib/booking/capacity";
import { isFixedSlotSection, validateHourlyWindow } from "@/lib/workspaces/operating-hours";
import { checkFairUse, fairUseWeek, sessionParticipants } from "@/lib/booking/fair-use";
import {
  FREE_RESCHEDULES,
  MAX_RESCHEDULE_AHEAD_DAYS,
  hourlyQuote,
  mayReschedule,
  notifyRescheduled,
  repricedAmount,
  rescheduleNoticeHours,
  settlePriceDifference,
} from "@/lib/booking/reschedule";

const HOUR_MS = 3_600_000;

const label = (d: Date) => `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`;

function refuse(status: number, code: string, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, code, ...extra }, { status });
}

/**
 * @swagger
 * /api/hourly-bookings/{id}/reschedule:
 *   post:
 *     summary: Move an hourly session to another free session (one free change, same notice as cancellation)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, startTime]
 *             properties:
 *               startDate:
 *                 type: string
 *                 example: "2026-11-03"
 *               startTime:
 *                 type: string
 *                 example: "14:00"
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

    const booking = await prisma.hourlyBooking.findUnique({
      where: { id },
      include: { user: { select: { id: true, role: true } }, section: { include: { workspace: true } } },
    });
    if (!booking) return refuse(404, "NOT_FOUND", "Booking not found.");

    const payments = await prisma.payment.findMany({
      where: { referenceId: id, paymentFor: "HOURLY_BOOKING", status: "SUCCESS" },
      orderBy: { createdAt: "asc" },
    });
    if (!mayReschedule(user, booking)) {
      return refuse(403, "FORBIDDEN", "You are not allowed to reschedule this booking.");
    }

    const isAdmin = user.role === "SUPER_ADMIN";
    const nowKsa = getKsaNow();
    if (booking.status !== "ACTIVE" || booking.startDate.getTime() <= nowKsa.getTime()) {
      return refuse(400, "NOT_ELIGIBLE", "Only a session that has not started yet can be rescheduled.");
    }
    if (!isAdmin && booking.rescheduleCount >= FREE_RESCHEDULES) {
      return refuse(400, "RESCHEDULE_LIMIT", "This booking was already rescheduled once. You can cancel it (inside the cancellation window) and book again.");
    }

    const requiredHours = rescheduleNoticeHours(booking.user.role);
    const hoursUntilStart = (booking.startDate.getTime() - nowKsa.getTime()) / HOUR_MS;
    if (!isAdmin && hoursUntilStart < requiredHours) {
      return refuse(400, "RESCHEDULE_WINDOW", `Rescheduling is not allowed. Must reschedule at least ${requiredHours} hours before the session starts.`, { requiredHours });
    }

    // The new session keeps the same length
    if (typeof body.startDate !== "string" || typeof body.startTime !== "string") {
      return refuse(400, "INVALID_SLOT", "startDate and startTime are required.");
    }
    const durationMs = booking.endDate.getTime() - booking.startDate.getTime();
    const newStart = parseDateAndTimeToKsaDate(body.startDate, body.startTime, 9);
    if (Number.isNaN(newStart.getTime())) return refuse(400, "INVALID_SLOT", "The new date or time is not valid.");
    const newEnd = new Date(newStart.getTime() + durationMs);

    const targetSectionId = typeof body.sectionId === "string" && body.sectionId ? body.sectionId : booking.sectionId;
    if (targetSectionId === booking.sectionId && newStart.getTime() === booking.startDate.getTime()) {
      return refuse(400, "NOT_CHANGED", "This is the same session. Choose a different time or room.");
    }
    if (!isAdmin && (newStart.getTime() - nowKsa.getTime()) / HOUR_MS < requiredHours) {
      return refuse(400, "RESCHEDULE_WINDOW", `The new session must start at least ${requiredHours} hours from now.`, { requiredHours });
    }
    if (newStart.getTime() - booking.startDate.getTime() > MAX_RESCHEDULE_AHEAD_DAYS * 24 * HOUR_MS) {
      return refuse(400, "SLOT_TOO_FAR", `The new session can be at most ${MAX_RESCHEDULE_AHEAD_DAYS} days after the original date.`);
    }

    const workspace = booking.section.workspace;
    const section =
      targetSectionId === booking.sectionId
        ? booking.section
        : await prisma.workspaceSection.findUnique({ where: { id: targetSectionId }, include: { workspace: true } });
    if (!section || section.workspaceId !== workspace.id || section.type !== booking.section.type) {
      return refuse(400, "ROOM_NOT_ALLOWED", "The room must belong to the same venue and be the same type of room.");
    }

    const windowError = validateHourlyWindow({ workspace, sectionType: section.type, start: newStart, end: newEnd });
    if (windowError) return refuse(400, "INVALID_SLOT", windowError);

    const hours = Math.max(1, Math.round(durationMs / HOUR_MS));
    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    const newPaid = repricedAmount(paid, hourlyQuote(booking.section, workspace, hours), hourlyQuote(section, workspace, hours));
    const delta = Math.round((newPaid - paid) * 100) / 100;
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

    const outcome = await prisma.$transaction(async (tx) => {
      // Same per-venue lock as new bookings, so two requests can never take the same session
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"hourly-slot:" + workspace.id}))`;

      const fresh = await tx.hourlyBooking.findUnique({ where: { id }, select: { status: true, rescheduleCount: true, startDate: true } });
      if (!fresh || fresh.status !== "ACTIVE" || fresh.startDate.getTime() !== booking.startDate.getTime() || (!isAdmin && fresh.rescheduleCount >= FREE_RESCHEDULES)) {
        return { error: refuse(409, "CHANGED", "This booking was just changed. Please reload and try again.") };
      }

      if (isFixedSlotSection(section.type)) {
        const clash = await tx.hourlyBooking.findFirst({
          where: { id: { not: id }, sectionId: section.id, status: "ACTIVE", startDate: { lt: newEnd }, endDate: { gt: newStart } },
          select: { id: true },
        });
        if (clash) return { error: refuse(409, "SLOT_UNAVAILABLE", `${section.name} is already booked for the selected time. Please choose another session or room.`) };
      } else {
        const occupied = (await getOccupiedSeats([workspace.id], newStart, newEnd)).get(workspace.id) || 0;
        const overlapsOwn = booking.startDate < newEnd && booking.endDate > newStart;
        const others = occupied - (overlapsOwn ? booking.seats : 0);
        const limit = effectiveCapacity({ totalCapacity: workspace.totalCapacity, sections: [section] });
        if (others + booking.seats > limit) {
          return { error: refuse(409, "SLOT_UNAVAILABLE", `Not enough availability. Only ${Math.max(0, limit - others)} seat(s) left for the selected time.`) };
        }
      }

      // Moving a session into another week must respect that week's fair-use limit of the "Unlimited*" plans
      if (fairUseWeek(newStart).from.getTime() !== fairUseWeek(booking.startDate).from.getTime()) {
        const fairUse = await checkFairUse(tx, {
          bookerId: booking.userId,
          participantIds: sessionParticipants(booking),
          start: newStart,
          excludeBookingId: id,
        });
        if (!fairUse.ok) return { error: refuse(fairUse.status, fairUse.code, fairUse.error) };
      }

      const settled = await settlePriceDifference(tx, {
        ownerId: booking.userId,
        ownerRole: booking.user.role,
        payment: latestPayment ? { id: latestPayment.id } : null,
        delta,
        reference: `${id}:${booking.rescheduleCount + 1}`,
        label: `${workspace.name} session moved`,
      });
      if (!settled.ok) return { error: refuse(settled.status, settled.code, settled.error) };

      // A booking in another room uses that room's package
      const newPackage = section.id === booking.sectionId ? null : await tx.hourlyPackage.findFirst({ where: { sectionId: section.id }, select: { id: true } });
      const updated = await tx.hourlyBooking.update({
        where: { id },
        data: {
          startDate: newStart,
          endDate: newEnd,
          sectionId: section.id,
          ...(newPackage ? { packageId: newPackage.id } : {}),
          rescheduleCount: { increment: 1 },
          rescheduledFrom: booking.rescheduledFrom ?? booking.startDate,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          workspace: { select: { id: true, name: true, city: true, images: true } },
          section: { include: { workspace: { select: { id: true, name: true, city: true } } } },
          package: true,
        },
      });
      return { updated, settled };
    });

    if ("error" in outcome) return outcome.error;

    await notifyRescheduled({
      ownerId: booking.userId,
      workspaceId: workspace.id,
      venueName: workspace.name,
      roomName: section.name,
      fromLabel: label(booking.startDate),
      toLabel: label(newStart),
      attendeeIds: booking.attendeeIds,
    });

    return NextResponse.json({
      message: "Booking rescheduled.",
      booking: outcome.updated,
      priceDifference: outcome.settled.delta,
      settledOn: outcome.settled.target,
    });
  } catch (error) {
    console.error("Error rescheduling an hourly booking:", error);
    return NextResponse.json({ error: "Failed to reschedule the booking." }, { status: 500 });
  }
}
