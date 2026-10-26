import { afterEach, describe, expect, it } from "vitest";
import { generateOtp } from "@/lib/auth/otp";
import { getFromAddress, isEmailConfigured } from "@/lib/mailer";

const saved = { ...process.env };
afterEach(() => {
  for (const key of ["RESEND_API_KEY", "RESEND_FROM_EMAIL"]) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("generateOtp", () => {
  it("always returns six digits and is not constant", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const code = generateOtp();
      expect(code).toMatch(/^\d{6}$/);
      expect(Number(code)).toBeGreaterThanOrEqual(100000);
      codes.add(code);
    }
    expect(codes.size).toBeGreaterThan(150);
  });
});

describe("email configuration", () => {
  it("treats a missing, placeholder or malformed key as not configured", () => {
    delete process.env.RESEND_API_KEY;
    expect(isEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_placeholder_build_key";
    expect(isEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_placeholder_local";
    expect(isEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "not-a-resend-key";
    expect(isEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_AbCdEf123_realKey";
    expect(isEmailConfigured()).toBe(true);
  });

  it("uses the configured sender and falls back to Resend's test sender", () => {
    delete process.env.RESEND_FROM_EMAIL;
    expect(getFromAddress()).toBe("Coworking Pass <onboarding@resend.dev>");
    process.env.RESEND_FROM_EMAIL = " Coworking Pass <no-reply@example.sa> ";
    expect(getFromAddress()).toBe("Coworking Pass <no-reply@example.sa>");
  });
});
