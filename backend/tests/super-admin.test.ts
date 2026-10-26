import { describe, expect, it } from "vitest";
import { planSuperAdmin } from "@/lib/super-admin";

describe("planSuperAdmin", () => {
  it("uses the configured account when both variables are set", () => {
    expect(planSuperAdmin({ SUPER_ADMIN_EMAIL: " Boss@Example.com ", SUPER_ADMIN_PASSWORD: "s3cret" })).toEqual({
      mode: "configured", email: "boss@example.com", password: "s3cret", resetPassword: false,
    });
  });
  it("only resets an existing password when asked to", () => {
    const plan = planSuperAdmin({ SUPER_ADMIN_EMAIL: "a@b.c", SUPER_ADMIN_PASSWORD: "x", SUPER_ADMIN_RESET_PASSWORD: "true" });
    expect(plan).toMatchObject({ mode: "configured", resetPassword: true });
  });
  it("needs both email and password", () => {
    expect(planSuperAdmin({ SUPER_ADMIN_EMAIL: "a@b.c" })).toEqual({ mode: "none" });
    expect(planSuperAdmin({ SUPER_ADMIN_PASSWORD: "x" })).toEqual({ mode: "none" });
  });
  it("seeds the well-known account only for local development", () => {
    expect(planSuperAdmin({ DEV_SEED_ADMIN: "true" })).toEqual({ mode: "dev-default" });
    expect(planSuperAdmin({ DEV_SEED_ADMIN: "true", NODE_ENV: "production" })).toEqual({ mode: "none" });
  });
  it("creates nothing by default (production)", () => {
    expect(planSuperAdmin({})).toEqual({ mode: "none" });
    expect(planSuperAdmin({ NODE_ENV: "production" })).toEqual({ mode: "none" });
  });
});
