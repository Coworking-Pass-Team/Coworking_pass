import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** The credentials that used to be hard-coded into every deployment. They are public, so never trusted. */
export const LEGACY_ADMIN_EMAIL = "admin@coworkingpass.sa";
const LEGACY_ADMIN_PASSWORD = "password";

type Env = Record<string, string | undefined>;

export type SuperAdminPlan =
  | { mode: "configured"; email: string; password: string; resetPassword: boolean }
  | { mode: "dev-default" }
  | { mode: "none" };

/**
 * Decides how the Super Admin account is provisioned, from environment variables only:
 *  - SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD: create that account if it does not exist yet. An existing
 *    account keeps its password (set SUPER_ADMIN_RESET_PASSWORD=true to overwrite it on purpose).
 *  - DEV_SEED_ADMIN=true (never in production): the well-known local development account.
 *  - otherwise: no admin is created, and the legacy public credentials are revoked.
 */
export function planSuperAdmin(env: Env = process.env): SuperAdminPlan {
  const email = env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.SUPER_ADMIN_PASSWORD;
  if (email && password) {
    return { mode: "configured", email, password, resetPassword: env.SUPER_ADMIN_RESET_PASSWORD === "true" };
  }
  if (env.DEV_SEED_ADMIN === "true" && env.NODE_ENV !== "production") {
    return { mode: "dev-default" };
  }
  return { mode: "none" };
}

async function hasLegacyPassword(passwordHash: string): Promise<boolean> {
  return bcrypt.compare(LEGACY_ADMIN_PASSWORD, passwordHash).catch(() => false);
}

/** Applies the plan. Returns human-readable notes for the schema-sync log. */
export async function provisionSuperAdmin(plan: SuperAdminPlan = planSuperAdmin()): Promise<string[]> {
  const notes: string[] = [];

  if (plan.mode === "dev-default") {
    const email = LEGACY_ADMIN_EMAIL;
    const passwordHash = await bcrypt.hash(LEGACY_ADMIN_PASSWORD, 10);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: { name: "Platform Super Admin", email, passwordHash, role: "SUPER_ADMIN", emailVerified: true, isBanned: false },
      });
      notes.push("Created development Super Admin (DEV_SEED_ADMIN)");
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, role: "SUPER_ADMIN", emailVerified: true, isBanned: false },
      });
      notes.push("Reset development Super Admin (DEV_SEED_ADMIN)");
    }
    return notes;
  }

  if (plan.mode === "configured") {
    const existing = await prisma.user.findUnique({ where: { email: plan.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: "Platform Super Admin",
          email: plan.email,
          passwordHash: await bcrypt.hash(plan.password, 10),
          role: "SUPER_ADMIN",
          emailVerified: true,
          isBanned: false,
        },
      });
      notes.push("Created configured Super Admin");
    } else if (plan.resetPassword || (await hasLegacyPassword(existing.passwordHash))) {
      // Overwrite only on request, or to replace the public legacy password with the configured one
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: await bcrypt.hash(plan.password, 10), role: "SUPER_ADMIN", emailVerified: true, isBanned: false },
      });
      notes.push("Updated configured Super Admin password");
    }
  }

  // Outside development, the old public credentials must stop working
  const legacy = await prisma.user.findUnique({ where: { email: LEGACY_ADMIN_EMAIL } });
  const keepsConfiguredEmail = plan.mode === "configured" && plan.email === LEGACY_ADMIN_EMAIL;
  if (legacy && !keepsConfiguredEmail && (await hasLegacyPassword(legacy.passwordHash))) {
    const unusable = await bcrypt.hash(`revoked-${Date.now()}-${Math.random()}`, 10);
    await prisma.user.update({ where: { id: legacy.id }, data: { passwordHash: unusable } });
    notes.push("Revoked the legacy public admin password");
  }
  return notes;
}
