import { describe, expect, it } from "vitest";
import { directBookingEnd, startOfDay } from "@/lib/booking/capacity";

const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m - 1, day, 9));
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe("startOfDay", () => {
  it("truncates to UTC midnight (KSA wall-clock)", () => {
    expect(startOfDay(new Date(Date.UTC(2026, 5, 15, 23, 59))).toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });
});

describe("directBookingEnd", () => {
  it("daily bookings span N days", () => {
    expect(iso(directBookingEnd({ bookingDate: d(2026, 6, 15), durationType: "DAILY", durationDetails: "3 Days" }))).toBe("2026-06-18");
  });
  it("defaults to one day when the duration text is missing", () => {
    expect(iso(directBookingEnd({ bookingDate: d(2026, 6, 15), durationType: "DAILY", durationDetails: null }))).toBe("2026-06-16");
  });
  it("crosses month and year boundaries and the leap day", () => {
    expect(iso(directBookingEnd({ bookingDate: d(2028, 2, 28), durationType: "DAILY", durationDetails: "2 Days" }))).toBe("2028-03-01");
    expect(iso(directBookingEnd({ bookingDate: d(2026, 12, 31), durationType: "DAILY", durationDetails: "1 Day" }))).toBe("2027-01-01");
  });
  it("monthly and yearly bookings", () => {
    expect(iso(directBookingEnd({ bookingDate: d(2026, 11, 15), durationType: "MONTHLY", durationDetails: "3 Months" }))).toBe("2027-02-15");
    expect(iso(directBookingEnd({ bookingDate: d(2026, 6, 15), durationType: "YEARLY", durationDetails: "1 Year" }))).toBe("2027-06-15");
  });
});
