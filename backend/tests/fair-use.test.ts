import { describe, expect, it } from "vitest";
import { fairUseWeek, isUnlimitedPlan, sessionParticipants } from "@/lib/booking/fair-use";

describe("fair-use week", () => {
  it("runs from Sunday to the next Sunday in KSA wall-clock time", () => {
    // Wednesday 29 October 2026, 14:00 KSA
    const { from, to } = fairUseWeek(new Date("2026-10-29T14:00:00.000Z"));
    expect(from.toISOString()).toBe("2026-10-25T00:00:00.000Z");
    expect(to.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("puts Sunday morning and Saturday night in the same week", () => {
    expect(fairUseWeek(new Date("2026-11-01T00:00:00.000Z")).from.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(fairUseWeek(new Date("2026-11-07T23:30:00.000Z")).from.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("unlimited plans", () => {
  it("are the Business Pass and Custom Enterprise", () => {
    expect(isUnlimitedPlan("Business Pass")).toBe(true);
    expect(isUnlimitedPlan("Custom Enterprise")).toBe(true);
    for (const name of ["Team Pass", "Monthly Pass", "Yearly Pass", "Day Pass", "", null]) {
      expect(isUnlimitedPlan(name)).toBe(false);
    }
  });
});

describe("session participants", () => {
  it("counts a company session against the people it was booked for, never the HR admin", () => {
    expect(sessionParticipants({ userId: "hr", attendeeIds: ["a", "b"] })).toEqual(["a", "b"]);
    expect(sessionParticipants({ userId: "me", attendeeIds: [] })).toEqual(["me"]);
  });
});
