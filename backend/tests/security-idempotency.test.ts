import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const harness = vi.hoisted(() => ({ rows: new Map<string, any>(), queue: Promise.resolve() as Promise<unknown>, user: "u" }));
vi.mock("@/lib/auth/verify-token", () => ({
  getTokenFromRequest: async () => ({ userId: harness.user, role: "B2C" }),
  unauthorizedResponse: () => NextResponse.json({}, { status: 401 }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: (work: (tx: any) => unknown) => {
    const next = harness.queue.then(async () => {
      const snapshot = new Map(harness.rows);
      try { return await work({ $executeRaw: vi.fn(), idempotencyRecord: {
        findUnique: async ({ where }: any) => harness.rows.get(where.id),
        create: async ({ data }: any) => harness.rows.set(data.id, data),
      } }); } catch (e) { harness.rows = snapshot; throw e; }
    });
    harness.queue = next.catch(() => undefined);
    return next;
  },
} }));
import { idempotent } from "@/lib/security/idempotency";
import { POST as mockPayment } from "@/app/api/mock-payment/route";

const req = (body = { amount: 20 }, key = "retry-key-12345678") => new NextRequest("http://test/api/checkout", { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(body) });
beforeEach(() => { harness.rows.clear(); harness.queue = Promise.resolve(); harness.user = "u"; });

describe("transaction idempotency", () => {
  it("runs a concurrent duplicate only once and replays the same response", async () => {
    const effect = vi.fn(async () => NextResponse.json({ id: "payment-1" }, { status: 201 }));
    const post = idempotent("test", effect);
    const responses = await Promise.all([post(req()), post(req())]);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(await responses[0].json()).toEqual(await responses[1].json());
  });
  it("rejects key reuse with a different payload and scopes keys to the caller", async () => {
    const effect = vi.fn(async () => NextResponse.json({ ok: true }));
    const post = idempotent("test", effect);
    await post(req());
    expect((await post(req({ amount: 30 }))).status).toBe(409);
    harness.user = "another-user";
    expect((await post(req())).status).toBe(200);
    expect(effect).toHaveBeenCalledTimes(2);
  });
  it("does not persist a failed transaction and rejects missing keys and negative amounts", async () => {
    const post = idempotent("test", async () => NextResponse.json({ error: "Declined" }, { status: 400 }));
    expect((await post(req())).status).toBe(400);
    expect(harness.rows.size).toBe(0);
    expect((await post(req({ amount: -100 }))).status).toBe(400);
    expect((await post(req({ amount: 10 }, ""))).status).toBe(400);
  });
  it("never exposes mock payments in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try { expect((await mockPayment(req())).status).toBe(404); }
    finally { vi.unstubAllEnvs(); }
  });
});
