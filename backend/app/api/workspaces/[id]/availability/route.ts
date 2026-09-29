import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { directBookingEnd, getOccupiedSeats } from "@/lib/capacity";
import { getOperatingRange, isFixedSlotSection, FIXED_SLOT_MINUTES, LATEST_SESSION_END_MINUTES, hhmmToMinutes } from "@/lib/operating-hours";
import { parseDateAndTimeToKsaDate } from "@/lib/time-utils";

/**
 * GET /api/workspaces/{id}/availability
 * Pre-checks whether a booking would be accepted (capacity + operating hours) before the customer is charged.
 * Query: plan (hourly|daily|monthly|yearly), date, startTime, endTime, days, months, seats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const plan = (searchParams.get("plan") || "daily").toLowerCase();
    const date = searchParams.get("date");
    const seats = Math.max(1, Math.floor(Number(searchParams.get("seats")) || 1));

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { id: true, isVisible: true, totalCapacity: true, openingTime: true, closingTime: true, is24Hours: true, sections: { select: { type: true } } },
    });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    if (workspace.isVisible === false) {
      return NextResponse.json({ available: false, reason: "This workspace is currently unavailable." });
    }

    let from: Date;
    let to: Date;

    if (plan === "hourly") {
      const startTime = searchParams.get("startTime");
      const endTime = searchParams.get("endTime");
      from = parseDateAndTimeToKsaDate(date, startTime, 9);
      to = parseDateAndTimeToKsaDate(date, endTime, 10);

      const startMin = from.getUTCHours() * 60 + from.getUTCMinutes();
      const endMin = to.getUTCHours() * 60 + to.getUTCMinutes();
      const { openMinutes, closeMinutes } = getOperatingRange(workspace);
      if (endMin <= startMin) {
        return NextResponse.json({ available: false, reason: "Session end time must be after the start time." });
      }
      if (startMin < openMinutes || endMin > closeMinutes) {
        return NextResponse.json({ available: false, reason: "The selected time is outside the venue's operating hours." });
      }
      const fixedSlot = workspace.sections.some((s) => isFixedSlotSection(s.type));
      if (fixedSlot && (endMin - startMin !== FIXED_SLOT_MINUTES || endMin > LATEST_SESSION_END_MINUTES)) {
        return NextResponse.json({ available: false, reason: "Halls and theaters can only be booked in fixed 2-hour sessions ending by 10:00 PM." });
      }
    } else {
      const durationType = plan === "monthly" ? "MONTHLY" : plan === "yearly" ? "YEARLY" : "DAILY";
      const details = durationType === "MONTHLY"
        ? `${Number(searchParams.get("months")) || 1} Months`
        : durationType === "DAILY"
        ? `${Number(searchParams.get("days")) || 1} Days`
        : "1 Year";
      from = parseDateAndTimeToKsaDate(date, null, 9);
      to = directBookingEnd({ bookingDate: from, durationType, durationDetails: details });
    }

    const occupied = (await getOccupiedSeats([id], from, to)).get(id) || 0;
    const total = workspace.totalCapacity;
    const remaining = Math.max(0, total - occupied);

    if (total > 0 && occupied + seats > total) {
      return NextResponse.json({
        available: false,
        remaining,
        reason: `Not enough availability. Only ${remaining} seat(s) left for the selected period.`,
      });
    }
    return NextResponse.json({ available: true, remaining });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json({ error: "Failed to check availability." }, { status: 500 });
  }
}
