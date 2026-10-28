import { describe, expect, it } from "vitest";
import { endAllSessions, issuedBeforeRevocation } from "@/lib/auth/sessions";
import { ksaMonthStart } from "@/lib/company/credit";

describe("ending every session", () => {
  it("compares in milliseconds, so a token signed earlier in the same second is refused and a later one works", () => {
    const { sessionsRevokedAt } = endAllSessions();
    const at = sessionsRevokedAt.getTime();
    expect(issuedBeforeRevocation({ issuedAtMs: at - 1 }, sessionsRevokedAt)).toBe(true);
    expect(issuedBeforeRevocation({ issuedAtMs: at }, sessionsRevokedAt)).toBe(false);
    expect(issuedBeforeRevocation({ issuedAtMs: at + 5 }, sessionsRevokedAt)).toBe(false);
  });

  it("falls back to the one-second iat for older tokens", () => {
    const revokedAt = new Date(1_700_000_000_500);
    expect(issuedBeforeRevocation({ iat: 1_700_000_000 }, revokedAt)).toBe(true);
    expect(issuedBeforeRevocation({ iat: 1_700_000_001 }, revokedAt)).toBe(false);
  });

  it("keeps tokens valid when sessions were never ended, and rejects tokens without an issue time", () => {
    expect(issuedBeforeRevocation({ iat: 1_700_000_000 }, null)).toBe(false);
    expect(issuedBeforeRevocation({}, new Date())).toBe(true);
  });
});

describe("company spending month", () => {
  it("starts at midnight on the 1st in Saudi time", () => {
    // 15 October 2026, 12:00 UTC
    expect(ksaMonthStart(new Date("2026-10-15T12:00:00.000Z")).toISOString()).toBe("2026-09-30T21:00:00.000Z");
    // 31 October 2026, 22:30 UTC is already 1 November in Riyadh
    expect(ksaMonthStart(new Date("2026-10-31T22:30:00.000Z")).toISOString()).toBe("2026-10-31T21:00:00.000Z");
  });
});
