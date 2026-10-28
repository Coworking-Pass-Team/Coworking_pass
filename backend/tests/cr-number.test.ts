import { describe, expect, it } from "vitest";
import { isValidCrNumber, normalizeCrNumber } from "@/lib/partners/cr-number";

describe("commercial registration numbers", () => {
  it("accepts the unified national number (7 + 9 digits)", () => {
    expect(isValidCrNumber("7001234567")).toBe(true);
    expect(isValidCrNumber("7039876543")).toBe(true);
  });

  it("accepts registrations issued before 3 April 2025 from any region", () => {
    for (const cr of ["1010123456", "4030123456", "2050123456", "4650123456", "5855123456", "3550123456"]) {
      expect(isValidCrNumber(cr)).toBe(true);
    }
  });

  it("rejects wrong lengths, letters and numbers that are neither form", () => {
    for (const cr of ["", "700123456", "70012345678", "0010123456", "6010123456", "8001234567", "9001234567", "70012a4567", null, undefined]) {
      expect(isValidCrNumber(cr)).toBe(false);
    }
  });

  it("converts Arabic-Indic digits and drops spaces and dashes", () => {
    expect(normalizeCrNumber("٧٠٠١٢٣٤٥٦٧")).toBe("7001234567");
    expect(normalizeCrNumber("۷۰۰۱۲۳۴۵۶۷")).toBe("7001234567");
    expect(normalizeCrNumber(" 700-123 4567 ")).toBe("7001234567");
    expect(isValidCrNumber("٧٠٠١٢٣٤٥٦٧")).toBe(true);
  });
});
