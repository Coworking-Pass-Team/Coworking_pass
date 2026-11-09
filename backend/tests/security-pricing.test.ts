import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const harness = vi.hoisted(() => ({ db: {} as any, settle: vi.fn() }));
vi.mock("@/lib/security/idempotency", () => ({ idempotent: (_scope: string, handler: any) => (request: NextRequest) => handler(request, harness.db) }));
vi.mock("@/lib/security/checkout", () => ({ settleCheckout: harness.settle }));
vi.mock("@/lib/auth/verify-token", () => ({ getTokenFromRequest: async () => ({ userId: "u", role: "B2C" }) }));
vi.mock("@/lib/company/team", () => ({ resolveAttendeeIds: async () => [], notifyAttendees: async () => undefined }));
vi.mock("@/lib/workspaces/visibility", () => ({ hiddenWorkspaceError: async () => null }));
vi.mock("@/lib/booking/capacity", () => ({ directBookingEnd: () => new Date("2027-12-03"), effectiveCapacity: () => 100, getOccupiedSeats: async () => new Map(), getOccupiedSeatsForSection: async () => 0 }));
vi.mock("@/lib/booking/fair-use", () => ({ checkFairUse: async () => ({ ok: true }), sessionParticipants: () => [] }));
vi.mock("@/lib/workspaces/operating-hours", () => ({ validateHourlyWindow: () => null, isFixedSlotSection: () => false }));
import { POST as direct } from "@/app/api/direct-bookings/route";
import { POST as hourly } from "@/app/api/hourly-bookings/route";
import { POST as subscription } from "@/app/api/subscriptions/route";

let section: any;
beforeEach(() => {
  harness.settle.mockReset();
  section = { id: "section", workspaceId: "workspace", type: "MEETING_ROOM", name: "Room", dailyRate: 100, monthlyRate: 1500, yearlyRate: 15000, hourlyRate: 75, capacity: 100,
    hourlyPackages: [{ id: "package", sectionId: "section", hoursAmount: 2, price: 120 }] };
  const workspace = { id: "workspace", name: "Venue", totalCapacity: 100, sections: [section] };
  const create = async ({ data }: any) => ({ id: "booking", ...data, workspace, section });
  harness.db = {
    $executeRaw: vi.fn(), user: { findUnique: async () => ({ id: "u", role: "B2C", isBanned: false, companyId: null }) },
    workspace: { findUnique: async () => workspace }, workspaceSection: { findUnique: async () => section },
    directBooking: { findFirst: async () => null, create }, hourlyBooking: { findFirst: async () => null, create },
    membershipPlan: { findUnique: async () => ({ id: "plan", type: "B2C", price: 450, durationDays: 30 }) },
    subscription: { create }, notification: { create: async () => ({}) },
  };
});
const request = (data: object) => new NextRequest("http://test/api/checkout", { method: "POST", body: JSON.stringify({ amount: 1, totalPrice: 1, price: 1, ...data }) });

describe("server-authoritative route pricing", () => {
  it("calculates direct booking from stored rate, validated units and seats", async () => {
    const response = await direct(request({ workspaceId: "workspace", sectionId: "section", durationType: "DAILY", durationDays: 2, seats: 2, bookingDate: "2027-12-01", durationDetails: "365 Days" }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ payableAmount: 400, durationDetails: "2 Days" });
    expect(harness.settle).toHaveBeenCalledWith(harness.db, "u", "booking", "DIRECT_BOOKING", 400, "workspace");
  });
  it.each([75, null])("calculates hourly booking from section rate or the matching package (%s)", async rate => {
    section.hourlyRate = rate;
    const response = await hourly(request({ workspaceId: "workspace", sectionId: "section", packageId: "package", startDate: "2027-12-01T09:00:00.000Z", endDate: "2027-12-01T11:00:00.000Z", durationHours: 1 }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ payableAmount: rate === null ? 120 : 150, hoursUsed: 2 });
  });
  it("uses the database subscription price and term, ignoring client price and end date", async () => {
    const response = await subscription(request({ planId: "plan", endDate: "2099-01-01" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.payableAmount).toBe(450);
    expect(new Date(body.endDate).getTime() - new Date(body.startDate).getTime()).toBe(30 * 86400000);
    expect(harness.settle).toHaveBeenCalledWith(harness.db, "u", "booking", "SUBSCRIPTION", 450);
  });
});
