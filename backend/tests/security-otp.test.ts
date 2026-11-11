import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const harness = vi.hoisted(() => ({ db: {} as any, queue: Promise.resolve() as Promise<unknown> }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: (work: (tx: any) => unknown) => {
    const next = harness.queue.then(() => work(harness.db));
    harness.queue = next.catch(() => undefined);
    return next;
  },
} }));
vi.mock("@/lib/mailer", () => ({ isEmailConfigured: () => false, sendOtpEmail: vi.fn(), sendPasswordResetEmail: vi.fn() }));
import { checkOtp, deliverOtp, issueOtp, otpCheckResponse, OtpLimitError } from "@/lib/auth/otp";

let state: any;
let records: any[];
beforeEach(async () => {
  vi.stubEnv("ALLOW_MASTER_OTP", "false");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
  state = null;
  records = [];
  harness.queue = Promise.resolve();
  harness.db = {
    $executeRaw: vi.fn(),
    otpThrottle: {
      findUnique: async () => state,
      upsert: async ({ create, update }: any) => state = state ? { ...state, ...update } : { failures: 0, lockedUntil: null, ...create },
      update: async ({ data }: any) => state = { ...state, ...data },
    },
    otpCode: {
      create: async ({ data }: any) => { const row = { id: String(records.length), attempts: 0, isUsed: false, ...data }; records.push(row); return row; },
      findFirst: async ({ where }: any) => [...records].reverse().find(r => r.purpose === where.purpose && !r.isUsed && r.expiresAt > new Date()),
      update: async ({ where, data }: any) => { const r = records.find(r => r.id === where.id); Object.assign(r, { ...data, attempts: data.attempts ? r.attempts + data.attempts.increment : r.attempts }); return r; },
      updateMany: async ({ where, data }: any) => { records.filter(r => r.userId === where.userId && !r.isUsed && (!where.purpose || r.purpose === where.purpose)).forEach(r => Object.assign(r, data)); return { count: records.length }; },
    },
  };
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("persistent account OTP protection", () => {
  it("accepts the enabled master code and consumes only the user's matching codes", async () => {
    vi.stubEnv("ALLOW_MASTER_OTP", "true");
    records.push({ userId: "u", purpose: "LOGIN", isUsed: false }, { userId: "u", purpose: "PASSWORD_RESET", isUsed: false }, { userId: "other", purpose: "LOGIN", isUsed: false });
    state = { lockedUntil: new Date(Date.now() + 60_000) };
    expect(await checkOtp("u", "LOGIN", "123456", false)).toEqual({ ok: true });
    expect(records.map(r => r.isUsed)).toEqual([true, false, false]);
  });
  it("rejects the master code when disabled", async () => {
    expect(await checkOtp("u", "LOGIN", "123456")).toMatchObject({ ok: false });
  });
  it("allows console delivery in production only when master OTP is enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(deliverOtp("test@example.com", "654321", "LOGIN")).rejects.toThrow("OTP delivery is not configured.");
    vi.stubEnv("ALLOW_MASTER_OTP", "true");
    await expect(deliverOtp("test@example.com", "654321", "LOGIN")).resolves.toBe("console");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("654321"));
  });
  it("allows only one concurrent resend and shares the 60-second cooldown across purposes", async () => {
    const results = await Promise.allSettled([issueOtp("u", "LOGIN"), issueOtp("u", "LOGIN")]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(records).toHaveLength(1);
    await expect(issueOtp("u", "PASSWORD_RESET")).rejects.toBeInstanceOf(OtpLimitError);
    vi.setSystemTime(Date.now() + 60_000);
    await expect(issueOtp("u", "LOGIN")).resolves.toMatch(/^\d{6}$/);
    expect(records[0].isUsed).toBe(true);
  });
  it("counts concurrent failures, invalidates codes and blocks guessing and resend for 15 minutes", async () => {
    const code = await issueOtp("u", "LOGIN");
    const checks = await Promise.all(Array.from({ length: 5 }, () => checkOtp("u", "LOGIN", "000000")));
    expect(checks[4]).toMatchObject({ ok: false, code: "OTP_LOCKED", retryAfter: 900 });
    expect(records[0].isUsed).toBe(true);
    expect(await checkOtp("u", "LOGIN", code)).toMatchObject({ code: "OTP_LOCKED" });
    await expect(issueOtp("u", "PASSWORD_RESET")).rejects.toBeInstanceOf(OtpLimitError);
    const response = otpCheckResponse(checks[4] as any);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    vi.setSystemTime(Date.now() + 900_000);
    const fresh = await issueOtp("u", "LOGIN");
    expect(await checkOtp("u", "LOGIN", fresh)).toEqual({ ok: true });
  });
  it("consumes a valid code exactly once", async () => {
    const code = await issueOtp("u", "LOGIN");
    const results = await Promise.all([checkOtp("u", "LOGIN", code), checkOtp("u", "LOGIN", code)]);
    expect(results.filter(r => r.ok)).toHaveLength(1);
    expect(await bcrypt.compare(code, records[0].codeHash)).toBe(true);
    expect(records[0].codeHash).not.toBe(code);
  });
  it("does not reset consecutive failures when requesting a new code", async () => {
    await issueOtp("u", "LOGIN");
    for (let n = 0; n < 4; n++) await checkOtp("u", "LOGIN", "000000");
    vi.setSystemTime(Date.now() + 60_000);
    await issueOtp("u", "LOGIN");
    expect(await checkOtp("u", "LOGIN", "000000")).toMatchObject({ code: "OTP_LOCKED" });
  });
});
