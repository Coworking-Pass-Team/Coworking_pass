import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { getKsaNow } from "@/lib/time-utils";
import { directBookingEnd, getOccupiedSeatsToday, startOfDay } from "@/lib/capacity";

const PERIODS = ["today", "week", "month", "year"] as const;
type Period = (typeof PERIODS)[number];

function periodStart(period: Period): Date {
  const today = startOfDay(getKsaNow());
  if (period === "today") return today;
  if (period === "week") return new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  if (period === "month") return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
}

/**
 * GET /api/admin/reports?period=today|week|month|year
 * Live platform analytics for super admins, aggregated from bookings, payments, users and workspaces.
 */
export async function GET(request: Request) {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse(request);
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only administrators can view reports." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const requested = (searchParams.get("period") || "month").toLowerCase() as Period;
    const period: Period = PERIODS.includes(requested) ? requested : "month";
    const from = periodStart(period);
    const now = getKsaNow();

    const [directInPeriod, hourlyInPeriod, allDirectActive, allHourlyActive, payments, users, workspaces] = await Promise.all([
      prisma.directBooking.findMany({
        where: { createdAt: { gte: from } },
        select: { status: true, durationType: true, workspaceId: true },
      }),
      prisma.hourlyBooking.findMany({
        where: { createdAt: { gte: from } },
        select: { status: true, workspaceId: true },
      }),
      prisma.directBooking.findMany({
        where: { status: "CONFIRMED" },
        select: { bookingDate: true, durationType: true, durationDetails: true },
      }),
      prisma.hourlyBooking.count({ where: { status: "ACTIVE", endDate: { gte: now } } }),
      prisma.payment.findMany({
        where: { createdAt: { gte: from }, status: "SUCCESS" },
        select: { amount: true, paymentFor: true, workspaceId: true },
      }),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.workspace.findMany({ select: { id: true, name: true, city: true, totalCapacity: true, isVisible: true } }),
    ]);

    const workspaceById = new Map(workspaces.map((w) => [w.id, w]));
    const occupiedToday = await getOccupiedSeatsToday(workspaces.map((w) => w.id));

    // Revenue: successful payments minus refunds
    let grossRevenue = 0;
    let refunds = 0;
    const revenueByCity = new Map<string, number>();
    const revenueByWorkspace = new Map<string, number>();
    for (const p of payments) {
      const signed = p.paymentFor === "REFUND" ? -p.amount : p.amount;
      if (p.paymentFor === "REFUND") refunds += p.amount;
      else grossRevenue += p.amount;
      const city = (p.workspaceId && workspaceById.get(p.workspaceId)?.city) || "Passes & other";
      revenueByCity.set(city, (revenueByCity.get(city) || 0) + signed);
      if (p.workspaceId) revenueByWorkspace.set(p.workspaceId, (revenueByWorkspace.get(p.workspaceId) || 0) + signed);
    }

    const cancelledDirect = directInPeriod.filter((b) => b.status === "CANCELLED" || b.status === "REFUNDED").length;
    const cancelledHourly = hourlyInPeriod.filter((b) => b.status === "CANCELLED").length;

    // Currently active: confirmed direct bookings whose period covers now + hourly bookings that have not ended
    const activeDirect = allDirectActive.filter(
      (b) => b.bookingDate <= now && directBookingEnd({ bookingDate: b.bookingDate, durationType: b.durationType, durationDetails: b.durationDetails }) > now
    ).length;

    const bookingsByPlan = [
      { label: "Hourly", value: hourlyInPeriod.length },
      { label: "Daily", value: directInPeriod.filter((b) => b.durationType === "DAILY").length },
      { label: "Monthly", value: directInPeriod.filter((b) => b.durationType === "MONTHLY").length },
      { label: "Yearly", value: directInPeriod.filter((b) => b.durationType === "YEARLY").length },
    ];

    const usersByRole = Object.fromEntries(users.map((u) => [u.role, u._count._all]));

    const spaces = workspaces.map((w) => {
      const occupied = Math.min(w.totalCapacity, occupiedToday.get(w.id) || 0);
      const bookingCount =
        directInPeriod.filter((b) => b.workspaceId === w.id && b.status !== "CANCELLED" && b.status !== "REFUNDED").length +
        hourlyInPeriod.filter((b) => b.workspaceId === w.id && b.status !== "CANCELLED").length;
      return {
        id: w.id,
        name: w.name,
        city: w.city,
        totalCapacity: w.totalCapacity,
        occupiedSeats: occupied,
        occupancyPercent: w.totalCapacity > 0 ? Math.round((occupied / w.totalCapacity) * 100) : 0,
        revenue: Math.round((revenueByWorkspace.get(w.id) || 0) * 100) / 100,
        bookingCount,
        isVisible: w.isVisible,
      };
    });

    const round = (n: number) => Math.round(n * 100) / 100;
    return NextResponse.json({
      period,
      from: from.toISOString(),
      revenue: round(grossRevenue - refunds),
      grossRevenue: round(grossRevenue),
      refunds: round(refunds),
      totalBookings: directInPeriod.length + hourlyInPeriod.length,
      activeBookings: activeDirect + allHourlyActive,
      cancelledBookings: cancelledDirect + cancelledHourly,
      totalUsers: users.reduce((sum, u) => sum + u._count._all, 0) - (usersByRole["SUPER_ADMIN"] || 0),
      organizations: usersByRole["HR_ADMIN"] || 0,
      partners: usersByRole["PARTNER_ADMIN"] || 0,
      individuals: usersByRole["B2C"] || 0,
      availableSpaces: spaces.filter((s) => s.isVisible && s.occupiedSeats < s.totalCapacity).length,
      fullyBookedSpaces: spaces.filter((s) => s.totalCapacity > 0 && s.occupiedSeats >= s.totalCapacity).length,
      revenueByCity: Array.from(revenueByCity.entries())
        .map(([label, value]) => ({ label, value: round(value) }))
        .sort((a, b) => b.value - a.value),
      bookingsByPlan,
      usersByType: [
        { label: "Individuals", value: usersByRole["B2C"] || 0 },
        { label: "Organizations", value: usersByRole["HR_ADMIN"] || 0 },
        { label: "Partners", value: usersByRole["PARTNER_ADMIN"] || 0 },
      ],
      occupancy: [...spaces].sort((a, b) => b.occupancyPercent - a.occupancyPercent).slice(0, 5),
      topSpaces: [...spaces].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    });
  } catch (error) {
    console.error("Error building admin report:", error);
    return NextResponse.json({ error: "Failed to build report." }, { status: 500 });
  }
}
