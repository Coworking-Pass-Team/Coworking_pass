import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const db = vi.hoisted(() => ({
 subscription: { findUnique: vi.fn(async () => ({ userId: "u", status: "ACTIVE", visitsUsed: 0, startDate: new Date(), plan: { price: 15000 } })) },
 directBooking: { findUnique: vi.fn(async () => ({ userId: "u", status: "CONFIRMED", bookingDate: new Date(Date.now() + 86400000), user: { role: "B2C" } })) },
 payment: { findFirst: vi.fn(async () => null) }, $transaction: vi.fn()
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth/verify-token", () => ({ getTokenFromRequest: async () => ({ userId: "u", role: "B2C" }) }));
vi.mock("@/lib/db/schema-sync", () => ({ ensureDatabaseSchema: async () => undefined }));
import { POST } from "@/app/api/refund/route";
describe("audit refund exploit regressions", () => {
 it("F-04 refuses the 15000 SAR catalog fallback without a payment", async () => {
  const res = await POST(new NextRequest("http://test/api/refund", { method: "POST", body: JSON.stringify({ subscriptionId: "s" }) }));
  expect(res.status).toBe(409);
  expect(db.$transaction).not.toHaveBeenCalled();
  expect(db.payment.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: "u", referenceId: "s", status: "SUCCESS", paymentFor: "SUBSCRIPTION", method: "WALLET" } }));
 });
 it("F-03 refuses an unpaid booking and requires an owner-bound wallet settlement", async () => {
  const res = await POST(new NextRequest("http://test/api/refund", { method: "POST", body: JSON.stringify({ bookingId: "b" }) }));
  expect(res.status).toBe(404);
  expect(db.$transaction).not.toHaveBeenCalled();
  expect(db.payment.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: "u", referenceId: "b", status: "SUCCESS", paymentFor: "DIRECT_BOOKING", method: "WALLET" } }));
 });
});
