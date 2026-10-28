import { afterEach, describe, expect, it } from "vitest";
import { generateOtp } from "@/lib/auth/otp";
import { getFromAddress, isEmailConfigured, parseLocale, renderCodeEmail, toEmailLocale } from "@/lib/mailer";

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

describe("email language", () => {
  it("accepts only ar and en, and defaults to Arabic", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("ar")).toBe("ar");
    for (const raw of ["fr", "EN", "", null, undefined, 1]) expect(parseLocale(raw)).toBeNull();
    expect(toEmailLocale(undefined)).toBe("ar");
    expect(toEmailLocale("en")).toBe("en");
  });

  it("writes the Arabic code email right to left, in Arabic, with the code left to right", () => {
    const { subject, html } = renderCodeEmail("otp", "482913", "ar");
    expect(subject).toBe("رمز التحقق - كوورك باس");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
    expect(html).toContain("صالح لمدة 10 دقائق");
    expect(html).toContain('<div dir="ltr"');
    expect(html).toContain("482913");
    expect(html).not.toMatch(/Verification|valid for 10 minutes/);
  });

  it("writes the English reset email left to right, in English", () => {
    const { subject, html } = renderCodeEmail("reset", "120345", "en");
    expect(subject).toBe("Reset your password - Coworking Pass");
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("valid for 10 minutes");
    expect(html).not.toMatch(/[؀-ۿ]/);
  });
});
