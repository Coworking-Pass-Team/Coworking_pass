import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { OtpPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendOtpEmail, sendPasswordResetEmail, type EmailLocale } from "@/lib/mailer";

/** A code is valid for ten minutes and for five wrong guesses, whichever comes first. */
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
/** A new code cannot be requested for the same purpose more often than this (stops mail flooding). */
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

/** Six random digits from the operating system's secure generator. */
export function generateOtp(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

/**
 * Creates a fresh code for the user and purpose. Every earlier unused code of that purpose is cancelled,
 * so only the newest code can ever work. Only a hash is stored.
 */
export const OTP_LOCKOUT_MS = 15 * 60 * 1000;
export class OtpLimitError extends Error {
  constructor(public retryAfter: number, public code: "OTP_LOCKED" | "OTP_COOLDOWN") {
    super(code === "OTP_LOCKED" ? "Too many incorrect attempts. Please wait before trying again." : "Please wait before requesting another code.");
  }
}
export function otpLimitResponse(error: unknown) {
  return error instanceof OtpLimitError ? NextResponse.json(
    { error: error.message, code: error.code, retryAfter: error.retryAfter },
    { status: 429, headers: { "Retry-After": String(error.retryAfter) } },
  ) : null;
}
export async function issueOtp(userId: string, purpose: OtpPurpose): Promise<string> {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.$transaction(async tx => {
    // One lock per account, shared by every purpose and every application instance.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'otp:' + userId}, 0))`;
    const now = Date.now();
    const state = await tx.otpThrottle.findUnique({ where: { userId } });
    if (state?.lockedUntil && state.lockedUntil.getTime() > now) {
      throw new OtpLimitError(Math.ceil((state.lockedUntil.getTime() - now) / 1000), "OTP_LOCKED");
    }
    if (state?.lastSentAt && now - state.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      throw new OtpLimitError(Math.ceil((OTP_RESEND_COOLDOWN_MS - now + state.lastSentAt.getTime()) / 1000), "OTP_COOLDOWN");
    }
    await tx.otpThrottle.upsert({ where: { userId }, create: { userId, lastSentAt: new Date(now) }, update: { lastSentAt: new Date(now) } });
    await tx.otpCode.updateMany({ where: { userId, purpose, isUsed: false }, data: { isUsed: true } });
    await tx.otpCode.create({ data: { userId, purpose, codeHash, expiresAt: new Date(now + OTP_TTL_MS) } });
  });
  return code;
}

/** True when a code for this purpose was issued so recently that another one should wait. */
export async function recentlyIssued(userId: string, purpose: OtpPurpose): Promise<boolean> {
  const last = await prisma.otpCode.findFirst({ where: { userId, purpose }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  return !!last && Date.now() - last.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS;
}

/**
 * Sends the code by email, in the recipient's language. While no Resend key is configured the code is written to the server console
 * instead, so local and QA runs keep working; once a key is configured it is never logged.
 */
export async function deliverOtp(email: string, code: string, purpose: OtpPurpose, locale: EmailLocale = "ar"): Promise<"email" | "console"> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "production") throw new Error("OTP delivery is not configured.");
    console.log(`[OTP] Resend is not configured, so the ${purpose} code for ${email} is: ${code} (valid 10 minutes)`);
    return "console";
  }
  const sent = purpose === "PASSWORD_RESET" ? await sendPasswordResetEmail(email, code, locale) : await sendOtpEmail(email, code, locale);
  if (!sent) console.warn(`[OTP] The ${purpose} email to ${email} could not be sent; check the Resend key and sender domain.`);
  return "email";
}

export type OtpCheck = { ok: true } | { ok: false; error: string; code?: "OTP_LOCKED"; retryAfter?: number };
export function otpCheckResponse(check: Exclude<OtpCheck, { ok: true }>) {
  return NextResponse.json(check, { status: check.code === "OTP_LOCKED" ? 429 : 400,
    headers: check.retryAfter ? { "Retry-After": String(check.retryAfter) } : undefined });
}

/** Failure increments, code consumption and lockouts are serialized across workers. */
export async function checkOtp(userId: string, purpose: OtpPurpose, rawCode: string, consume = true): Promise<OtpCheck> {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'otp:' + userId}, 0))`;
    const now = Date.now();
    const state = await tx.otpThrottle.upsert({ where: { userId }, create: { userId }, update: {} });
    if (state.lockedUntil && state.lockedUntil.getTime() > now) {
      return { ok: false, error: "Too many incorrect attempts. Please wait before trying again.", code: "OTP_LOCKED", retryAfter: Math.ceil((state.lockedUntil.getTime() - now) / 1000) };
    }
    const record = await tx.otpCode.findFirst({ where: { userId, purpose, isUsed: false, expiresAt: { gt: new Date(now) } }, orderBy: { createdAt: "desc" } });
    const valid = record && typeof rawCode === "string" && /^\d{6}$/.test(rawCode) && await bcrypt.compare(rawCode, record.codeHash);
    if (!valid) {
      const failures = (state.lockedUntil ? 0 : state.failures) + 1;
      const locked = failures >= OTP_MAX_ATTEMPTS;
      await tx.otpThrottle.update({ where: { userId }, data: { failures, lockedUntil: locked ? new Date(now + OTP_LOCKOUT_MS) : null } });
      if (record) await tx.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      if (locked) await tx.otpCode.updateMany({ where: { userId, isUsed: false }, data: { isUsed: true } });
      return locked ? { ok: false, error: "Too many incorrect attempts. Please wait 15 minutes.", code: "OTP_LOCKED", retryAfter: 900 }
        : { ok: false, error: "Invalid or expired verification code." };
    }
    await tx.otpThrottle.update({ where: { userId }, data: { failures: 0, lockedUntil: null } });
    if (consume) await tx.otpCode.update({ where: { id: record.id }, data: { isUsed: true } });
    return { ok: true };
  });
}
