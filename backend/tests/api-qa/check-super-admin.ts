// Run with a scratch database:  DATABASE_URL=... npx tsx tests/api-qa/check-super-admin.ts
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { provisionSuperAdmin, planSuperAdmin, LEGACY_ADMIN_EMAIL } from "../../lib/super-admin";

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + name + (detail ? "  -> " + detail : "")); };
const user = (email: string) => prisma.user.findUnique({ where: { email } });
const matches = async (email: string, pw: string) => { const u = await user(email); return !!u && bcrypt.compare(pw, u.passwordHash); };

async function main() {
  await prisma.user.deleteMany({ where: { role: "SUPER_ADMIN" } });

  // 1. Production default: nothing is created
  await provisionSuperAdmin(planSuperAdmin({ NODE_ENV: "production" }));
  check("production default creates no admin", (await user(LEGACY_ADMIN_EMAIL)) === null);

  // 2. A deployment that still has the legacy account with the public password
  await prisma.user.create({ data: { name: "Legacy", email: LEGACY_ADMIN_EMAIL, passwordHash: await bcrypt.hash("password", 10), role: "SUPER_ADMIN", emailVerified: true } });
  check("legacy account starts with the public password", await matches(LEGACY_ADMIN_EMAIL, "password"));
  const notes = await provisionSuperAdmin(planSuperAdmin({ NODE_ENV: "production" }));
  check("public password is revoked", !(await matches(LEGACY_ADMIN_EMAIL, "password")), notes.join("; "));
  check("legacy account row is kept (not deleted)", (await user(LEGACY_ADMIN_EMAIL)) !== null);

  // 3. Configured admin is created, and an existing one keeps its password
  const env = { SUPER_ADMIN_EMAIL: "owner@example.com", SUPER_ADMIN_PASSWORD: "First#Pass1", NODE_ENV: "production" };
  await provisionSuperAdmin(planSuperAdmin(env));
  check("configured admin is created", await matches("owner@example.com", "First#Pass1"));
  check("configured admin has the SUPER_ADMIN role", (await user("owner@example.com"))?.role === "SUPER_ADMIN");
  await provisionSuperAdmin(planSuperAdmin({ ...env, SUPER_ADMIN_PASSWORD: "Other#Pass2" }));
  check("restart does not overwrite an existing admin password", await matches("owner@example.com", "First#Pass1"));
  await provisionSuperAdmin(planSuperAdmin({ ...env, SUPER_ADMIN_PASSWORD: "Other#Pass2", SUPER_ADMIN_RESET_PASSWORD: "true" }));
  check("explicit reset overwrites the password", await matches("owner@example.com", "Other#Pass2"));

  // 4. Configuring the legacy email replaces the public password instead of locking the admin out
  await prisma.user.update({ where: { email: LEGACY_ADMIN_EMAIL }, data: { passwordHash: await bcrypt.hash("password", 10) } });
  await provisionSuperAdmin(planSuperAdmin({ SUPER_ADMIN_EMAIL: LEGACY_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD: "Real#Pass3", NODE_ENV: "production" }));
  check("legacy email + configured password: public password replaced", (await matches(LEGACY_ADMIN_EMAIL, "Real#Pass3")) && !(await matches(LEGACY_ADMIN_EMAIL, "password")));

  // 5. Local development seed
  await prisma.user.deleteMany({ where: { role: "SUPER_ADMIN" } });
  await provisionSuperAdmin(planSuperAdmin({ DEV_SEED_ADMIN: "true" }));
  check("DEV_SEED_ADMIN seeds the local admin", await matches(LEGACY_ADMIN_EMAIL, "password"));
  await provisionSuperAdmin(planSuperAdmin({ DEV_SEED_ADMIN: "true", NODE_ENV: "production" }));
  check("DEV_SEED_ADMIN is ignored in production (account revoked)", !(await matches(LEGACY_ADMIN_EMAIL, "password")));

  console.log(failed ? `\n${failed} failed` : "\nall passed");
  await prisma.user.deleteMany({ where: { role: "SUPER_ADMIN" } });
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
