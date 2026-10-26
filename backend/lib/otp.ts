import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { OtpPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendOtpEmail, sendPasswordResetEmail } from "@/lib/mailer";

/** A code is valid for ten minutes and for five wrong guesses, whichever comes first. */
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
/** A new code cannot be requested for the same purpose more often than this (stops mail flooding). */
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

/** The shared test code is accepted only when this is switched on explicitly (local and QA environments). */
const MASTER_TEST_CODE = "123456";
export function masterOtpEnabled(): boolean {
  return process.env.ALLOW_MASTER_OTP === "true";
}

/** Six random digits from the operating system's secure generator. */
export function generateOtp(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

/**
 * Creates a fresh code for the user and purpose. Every earlier unused code of that purpose is cancelled,
 * so only the newest code can ever work. Only a hash is stored.
 */
export async function issueOtp(userId: string, purpose: OtpPurpose): Promise<string> {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.$transaction([
    prisma.otpCode.updateMany({ where: { userId, purpose, isUsed: false }, data: { isUsed: true } }),
    prisma.otpCode.create({ data: { userId, purpose, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS) } }),
  ]);
  return code;
}

/** True when a code for this purpose was issued so recently that another one should wait. */
export async function recentlyIssued(userId: string, purpose: OtpPurpose): Promise<boolean> {
  const last = await prisma.otpCode.findFirst({ where: { userId, purpose }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  return !!last && Date.now() - last.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS;
}

/**
 * Sends the code by email. While no Resend key is configured the code is written to the server console
 * instead, so local and QA runs keep working; once a key is configured it is never logged.
 */
export async function deliverOtp(email: string, code: string, purpose: OtpPurpose): Promise<"email" | "console"> {
  if (!isEmailConfigured()) {
    console.log(`[OTP] Resend is not configured, so the ${purpose} code for ${email} is: ${code} (valid 10 minutes)`);
    return "console";
  }
  const sent = purpose === "PASSWORD_RESET" ? await sendPasswordResetEmail(email, code) : await sendOtpEmail(email, code);
  if (!sent) console.warn(`[OTP] The ${purpose} email to ${email} could not be sent; check the Resend key and sender domain.`);
  return "email";
}

export type OtpCheck = { ok: true } | { ok: false; error: string };

/**
 * Checks a code. With `consume` (the default) a correct code is used up in the same step; without it the code is
 * only checked, which lets a screen confirm the code before asking for a new password. Wrong guesses are counted
 * and the code is cancelled after five.
 */
export async function checkOtp(userId: string, purpose: OtpPurpose, rawCode: string, consume = true): Promise<OtpCheck> {
  const code = String(rawCode ?? "").trim();

  if (masterOtpEnabled() && code === MASTER_TEST_CODE) {
    if (consume) await prisma.otpCode.updateMany({ where: { userId, purpose, isUsed: false }, data: { isUsed: true } });
    return { ok: true };
  }

  const record = await prisma.otpCode.findFirst({
    where: { userId, purpose, isUsed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return { ok: false, error: "Invalid or expired verification code." };

  const valid = /^\d{6}$/.test(code) && (await bcrypt.compare(code, record.codeHash));
  if (!valid) {
    const attempts = record.attempts + 1;
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts, isUsed: attempts >= OTP_MAX_ATTEMPTS } });
    return {
      ok: false,
      error: attempts >= OTP_MAX_ATTEMPTS ? "Too many incorrect attempts. Please request a new code." : "Incorrect verification code.",
    };
  }

  if (consume) {
    // Only the first request can use the code up, even if two arrive together
    const used = await prisma.otpCode.updateMany({ where: { id: record.id, isUsed: false }, data: { isUsed: true } });
    if (used.count === 0) return { ok: false, error: "Invalid or expired verification code." };
  }
  return { ok: true };
}
