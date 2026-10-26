import { describe, expect, it } from "vitest";
import { validateHourlyWindow, hhmmToMinutes, isValidHhmm, getOperatingRange } from "@/lib/workspaces/operating-hours";

// Booking timestamps hold KSA wall-clock time in their UTC fields
const at = (h: number, m = 0, day = 15) => new Date(Date.UTC(2026, 5, day, h, m));
const ws = { openingTime: "08:00", closingTime: "22:00", is24Hours: false };

describe("hhmm helpers", () => {
  it("parses valid times and falls back otherwise", () => {
    expect(hhmmToMinutes("08:30", 0)).toBe(510);
    expect(hhmmToMinutes("nope", 99)).toBe(99);
    expect(isValidHhmm("24:00")).toBe(false);
    expect(isValidHhmm("23:59")).toBe(true);
  });
  it("uses defaults and 24h mode", () => {
    expect(getOperatingRange({})).toEqual({ openMinutes: 480, closeMinutes: 1320 });
    expect(getOperatingRange({ is24Hours: true })).toEqual({ openMinutes: 0, closeMinutes: 1440 });
  });
});

describe("validateHourlyWindow", () => {
  it("accepts a 2-hour hall session exactly at opening time", () => {
    expect(validateHourlyWindow({ workspace: ws, sectionType: "MEETING_ROOM", start: at(8), end: at(10) })).toBeNull();
  });
  it("accepts a theater session ending exactly at closing time", () => {
    expect(validateHourlyWindow({ workspace: ws, sectionType: "THEATER", start: at(20), end: at(22) })).toBeNull();
  });
  it("rejects a session starting before opening", () => {
    expect(validateHourlyWindow({ workspace: ws, sectionType: "MEETING_ROOM", start: at(7), end: at(9) })).toMatch(/operating hours/);
  });
  it("rejects a session ending after closing", () => {
    expect(validateHourlyWindow({ workspace: ws, sectionType: "MEETING_ROOM", start: at(21), end: at(23) })).toMatch(/operating hours/);
  });
  it("rejects non 2-hour hall and theater sessions", () => {
    expect(validateHourlyWindow({ workspace: ws, sectionType: "THEATER", start: at(9), end: at(10) })).toMatch(/2-hour/);
    expect(validateHourlyWindow({ workspace: ws, sectionType: "MEETING_ROOM", start: at(9), end: at(12) })).toMatch(/2-hour/);
  });
  it("rejects end before start", () => {
    expect(validateHourlyWindow({ workspace: ws, sectionType: "MEETING_ROOM", start: at(12), end: at(11) })).toMatch(/after the start/);
  });
  it("caps hall sessions at 10 PM even for 24h venues", () => {
    const h24 = { is24Hours: true };
    expect(validateHourlyWindow({ workspace: h24, sectionType: "MEETING_ROOM", start: at(21), end: at(23) })).toMatch(/10:00 PM/);
    expect(validateHourlyWindow({ workspace: h24, sectionType: "MEETING_ROOM", start: at(18), end: at(20) })).toBeNull();
  });
  it("does not enforce slot length for desks", () => {
    expect(validateHourlyWindow({ workspace: ws, sectionType: "DESK", start: at(9), end: at(10) })).toBeNull();
  });
});
