import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { startOfDay } from "@/lib/capacity";
import { parseDateAndTimeToKsaDate } from "@/lib/time-utils";

const ALL_TYPES = ["DESK", "MEETING_ROOM", "THEATER"] as const;
type UnitType = (typeof ALL_TYPES)[number];

/** Booking category of a room kind chosen by the provider (frontend space type). */
function sectionTypeFor(subType: unknown, explicit: unknown): UnitType {
  if (typeof explicit === "string" && (ALL_TYPES as readonly string[]).includes(explicit)) return explicit as UnitType;
  const kind = String(subType || "").toLowerCase();
  if (kind.includes("theater")) return "THEATER";
  if (kind.includes("hall") || kind.includes("meeting") || kind.includes("room") && !kind.includes("office")) return "MEETING_ROOM";
  return "DESK";
}

const rateOrNull = (value: unknown): number | null => {
  const n = Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(n) || n < 0 ? null : n;
};

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

/**
 * GET /api/workspaces/:id/units?date=YYYY-MM-DD
 * Lists the individual halls / theaters of a workspace with their seating capacity and, when a date is given,
 * the sessions already booked for each unit on that date (KSA wall-clock "HH:mm" ranges).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const date = new URL(request.url).searchParams.get("date");

    const workspace = await prisma.workspace.findUnique({ where: { id }, select: { id: true } });
    if (!workspace) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });

    const sections = await prisma.workspaceSection.findMany({
      where: { workspaceId: id },
      orderBy: { name: "asc" },
    });

    let bookedBySection = new Map<string, { startTime: string; endTime: string }[]>();
    if (date && sections.length > 0) {
      const dayStart = startOfDay(parseDateAndTimeToKsaDate(date, null, 9));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const bookings = await prisma.hourlyBooking.findMany({
        where: { sectionId: { in: sections.map((s) => s.id) }, status: "ACTIVE", startDate: { lt: dayEnd }, endDate: { gt: dayStart } },
        select: { sectionId: true, startDate: true, endDate: true },
      });
      bookedBySection = new Map();
      for (const b of bookings) {
        const list = bookedBySection.get(b.sectionId) || [];
        list.push({ startTime: hhmm(b.startDate), endTime: hhmm(b.endDate) });
        bookedBySection.set(b.sectionId, list);
      }
    }

    return NextResponse.json({
      units: sections.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        subType: s.subType,
        capacity: s.capacity,
        hourlyRate: s.hourlyRate,
        dailyRate: s.dailyRate,
        monthlyRate: s.monthlyRate,
        yearlyRate: s.yearlyRate,
        booked: bookedBySection.get(s.id) || [],
      })),
    });
  } catch (error) {
    console.error("Error listing workspace units:", error);
    return NextResponse.json({ error: "Failed to load halls." }, { status: 500 });
  }
}

/**
 * PUT /api/workspaces/:id/units
 * Body: { units: [{ id?, name, subType?, type?, capacity, hourlyRate?, dailyRate?, monthlyRate?, yearlyRate? }] }
 * Replaces the rooms / sections of the hub: existing units are updated, new ones created, and units missing from the
 * list are removed unless they already have bookings. The workspace capacity becomes the sum of unit capacities.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { id } = await params;

    const role = String(user.role || "").toUpperCase();
    const workspace = await prisma.workspace.findUnique({ where: { id }, include: { partner: true } });
    if (!workspace) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    if (role !== "SUPER_ADMIN") {
      const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { email: true } });
      const owns = role === "PARTNER_ADMIN" && dbUser?.email
        && workspace.partner.contactEmail.toLowerCase() === dbUser.email.toLowerCase();
      if (!owns) return NextResponse.json({ error: "You are not allowed to modify this workspace." }, { status: 403 });
    }

    const body = await request.json();
    const rawUnits: any[] = Array.isArray(body.units) ? body.units : [];
    if (rawUnits.length === 0) {
      return NextResponse.json({ error: "At least one room or section is required." }, { status: 400 });
    }
    if (rawUnits.length > 50) {
      return NextResponse.json({ error: "A workspace can have at most 50 rooms or sections." }, { status: 400 });
    }

    const units = rawUnits.map((u, i) => {
      const subType = typeof u.subType === "string" && u.subType ? u.subType.slice(0, 60) : null;
      const type = sectionTypeFor(subType, u.type ?? body.type);
      const fallbackLabel = type === "THEATER" ? "Theater" : type === "MEETING_ROOM" ? "Meeting Hall" : "Room";
      return {
        id: typeof u.id === "string" && u.id ? u.id : undefined,
        name: (typeof u.name === "string" && u.name.trim() ? u.name.trim() : `${fallbackLabel} ${i + 1}`).slice(0, 120),
        capacity: Math.floor(Number(u.capacity)),
        type,
        subType,
        hourlyRate: rateOrNull(u.hourlyRate),
        dailyRate: rateOrNull(u.dailyRate),
        monthlyRate: rateOrNull(u.monthlyRate),
        yearlyRate: rateOrNull(u.yearlyRate),
      };
    });
    if (units.some((u) => !Number.isFinite(u.capacity) || u.capacity < 1 || u.capacity > 100000)) {
      return NextResponse.json({ error: "Every room or section needs a seating capacity of at least 1." }, { status: 400 });
    }

    const existing = await prisma.workspaceSection.findMany({ where: { workspaceId: id } });
    const keepIds = new Set(units.filter((u) => u.id && existing.some((e) => e.id === u.id)).map((u) => u.id as string));
    const toRemove = existing.filter((e) => !keepIds.has(e.id));

    // A unit with booking history cannot be deleted
    for (const section of toRemove) {
      const [hourly, direct, checkIns] = await Promise.all([
        prisma.hourlyBooking.count({ where: { sectionId: section.id } }),
        prisma.directBooking.count({ where: { sectionId: section.id } }),
        prisma.qrCheckIn.count({ where: { sectionId: section.id } }),
      ]);
      if (hourly + direct + checkIns > 0) {
        return NextResponse.json(
          { error: `"${section.name}" already has bookings and cannot be removed. Keep it in the list or reduce its capacity instead.` },
          { status: 409 }
        );
      }
    }

    const saved = await prisma.$transaction(async (tx) => {
      for (const section of toRemove) {
        await tx.hourlyPackage.deleteMany({ where: { sectionId: section.id } });
        await tx.workspaceSection.delete({ where: { id: section.id } });
      }
      const result = [];
      for (const u of units) {
        if (u.id && keepIds.has(u.id)) {
          result.push(await tx.workspaceSection.update({
            where: { id: u.id },
            data: { name: u.name, capacity: u.capacity, type: u.type, subType: u.subType, hourlyRate: u.hourlyRate, dailyRate: u.dailyRate, monthlyRate: u.monthlyRate, yearlyRate: u.yearlyRate },
          }));
        } else {
          result.push(await tx.workspaceSection.create({
            data: {
              workspaceId: id, type: u.type, subType: u.subType, name: u.name, capacity: u.capacity,
              hourlyRate: u.hourlyRate, dailyRate: u.dailyRate ?? workspace.dailyRate ?? null, monthlyRate: u.monthlyRate, yearlyRate: u.yearlyRate,
            },
          }));
        }
      }
      await tx.workspace.update({ where: { id }, data: { totalCapacity: units.reduce((sum, u) => sum + u.capacity, 0) } });
      return result;
    });

    return NextResponse.json({
      units: saved.map((s) => ({ id: s.id, name: s.name, type: s.type, subType: s.subType, capacity: s.capacity, hourlyRate: s.hourlyRate, dailyRate: s.dailyRate, monthlyRate: s.monthlyRate, yearlyRate: s.yearlyRate })),
    });
  } catch (error) {
    console.error("Error saving workspace units:", error);
    return NextResponse.json({ error: "Failed to save halls." }, { status: 500 });
  }
}
