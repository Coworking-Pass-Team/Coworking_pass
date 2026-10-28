import { prisma } from "@/lib/prisma";

/**
 * Failed password attempts per email, stored in the database so the lockout holds on every server instance:
 * five failures within 15 minutes lock the email until the window has passed.
 */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function isRateLimited(email: string): Promise<boolean> {
  const row = await prisma.loginAttempt.findUnique({ where: { email } });
  if (!row || Date.now() - row.windowStart.getTime() > WINDOW_MS) return false;
  return row.failures >= MAX_ATTEMPTS;
}

export async function recordFailedAttempt(email: string): Promise<void> {
  const now = new Date().toISOString();
  const windowOpenedAfter = new Date(Date.now() - WINDOW_MS).toISOString();
  // One atomic statement, so simultaneous failures on different instances are all counted. ISO strings cast to
  // "timestamp" keep UTC wall-clock values, the way Prisma stores dates.
  await prisma.$executeRaw`
    INSERT INTO "LoginAttempt" ("email", "failures", "windowStart") VALUES (${email}, 1, ${now}::timestamp)
    ON CONFLICT ("email") DO UPDATE SET
      "failures" = CASE WHEN "LoginAttempt"."windowStart" < ${windowOpenedAfter}::timestamp THEN 1 ELSE "LoginAttempt"."failures" + 1 END,
      "windowStart" = CASE WHEN "LoginAttempt"."windowStart" < ${windowOpenedAfter}::timestamp THEN ${now}::timestamp ELSE "LoginAttempt"."windowStart" END`;
}

export async function clearAttempts(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}
