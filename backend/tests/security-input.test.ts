import { describe, expect, it } from "vitest";
import { financialBody, money } from "@/lib/security/input";
import { validateJwtSecret } from "@/lib/auth/secrets";
import { adminPasswordError } from "@/lib/auth/admin-password";
import { planSuperAdmin, provisionSuperAdmin } from "@/lib/auth/super-admin";

describe("security configuration", () => {
  it.each([undefined, "", "change-me", "secret", "password", "x".repeat(40), "change-me".repeat(8), "a".repeat(31)])("rejects unsafe JWT configuration %s", value => {
    expect(() => validateJwtSecret(value)).toThrow(/JWT_SECRET/);
  });
  it("accepts a random secret and strong admin password", () => {
    expect(validateJwtSecret("mD8v6qL2xK9rB4hF7sW5jN0pT3yC1zAa")).toBeTruthy();
    expect(adminPasswordError("Muttaka!R7v92")).toBeNull();
  });
  it.each(["password", "Abc1!", "abcdefghijkl!5", "ABCDEFGHIJKL!5", "MuttakaLong!!", "MuttakaLong15"])("rejects weak admin password %s", value => {
    expect(adminPasswordError(value)).not.toBeNull();
    expect(() => planSuperAdmin({ SUPER_ADMIN_EMAIL: "a@b.c", SUPER_ADMIN_PASSWORD: value })).toThrow();
  });
});

describe("financial input", () => {
  it.each([-100, 0, 0.999, null, undefined, NaN, Infinity, -Infinity, "100", "1e2", 100000.01])("rejects invalid amount %s", value => {
    expect(() => money(value)).toThrow();
  });
  it("rounds valid amounts to cents and enforces inclusive limits", () => {
    expect(money(1)).toBe(1);
    expect(money(1.005)).toBe(1.01);
    expect(money(18.126)).toBe(18.13);
    expect(money(100000)).toBe(100000);
  });
  it.each(['{"amount":1e2}', '{"amount":1E+2}', '{"amount":null}', '{"amount":NaN}', '{"amount":-100}', '{"amount":"1e2"}', 'null', '[]'])("rejects raw payload %s", async body => {
    await expect(financialBody(new Request("http://test", { method: "POST", body }))).rejects.toThrow();
  });
  it("does not mistake text or escaped strings for numeric exponent tokens", async () => {
    const body = JSON.stringify({ amount: 10, description: 'Invoice 1e2 says "1E3"', referenceId: "1e4" });
    await expect(financialBody(new Request("http://test", { method: "POST", body }))).resolves.toMatchObject({ amount: 10 });
  });
});
