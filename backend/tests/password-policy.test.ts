import { describe, expect, it } from "vitest";
import { failedPasswordRules, hasSequentialRun, passwordPolicyError } from "@/lib/password-policy";

describe("hasSequentialRun", () => {
  it.each(["123", "987", "abc", "cba", "xAbCx", "a789b", "Zyx"])("finds a run in %s", (text) => {
    expect(hasSequentialRun(text)).toBe(true);
  });
  it.each(["", "12", "ab", "135", "acb", "a1b2c3", "1a2", "Window#4829Kp"])("finds no run in %s", (text) => {
    expect(hasSequentialRun(text)).toBe(false);
  });
});

describe("failedPasswordRules", () => {
  it("accepts a password that meets every rule", () => {
    expect(failedPasswordRules("Window#4829Kp")).toEqual([]);
  });
  it("lists each broken rule", () => {
    expect(failedPasswordRules("abc")).toEqual(expect.arrayContaining(["length", "uppercase", "number", "special", "noSequence"]));
    expect(failedPasswordRules("ABCDEFGH1!")).toContain("lowercase");
    expect(failedPasswordRules("abcdefgh1!")).toContain("uppercase");
    expect(failedPasswordRules("Qwerty!Pass")).toContain("number");
    expect(failedPasswordRules("Qwerty9Pass")).toContain("special");
  });
});

describe("passwordPolicyError", () => {
  it("is null for a good password and a 400 body for a weak one", () => {
    expect(passwordPolicyError("Window#4829Kp")).toBeNull();
    expect(passwordPolicyError("Pass#Word123")).toMatchObject({ code: "WEAK_PASSWORD", failed: ["noSequence"] });
    expect(passwordPolicyError(undefined)).toMatchObject({ code: "WEAK_PASSWORD" });
  });
  it("rejects a password over 128 characters", () => {
    expect(passwordPolicyError("Aa#" + "x9".repeat(70))).toMatchObject({ code: "WEAK_PASSWORD" });
  });
});
