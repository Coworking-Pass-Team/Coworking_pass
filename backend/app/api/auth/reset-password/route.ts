import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkOtp } from "@/lib/otp";
import { blacklistUser } from "@/lib/auth/token-blacklist";
import { clearAttempts } from "@/lib/rate-limit/login-attempts";

const MIN_PASSWORD_LENGTH = 8;

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Choose a new password with the one-time code that was emailed
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` }, { status: 400 });
    }
    if (newPassword.length > 128) {
      return NextResponse.json({ error: "Password is too long." }, { status: 400 });
    }

    const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true, isBanned: true } }) : null;
    if (!user || user.isBanned || !code) {
      return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
    }

    // Uses the code up: it works once, within ten minutes, and cancels itself after five wrong guesses
    const check = await checkOtp(user.id, "PASSWORD_RESET", code);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // Any other reset or sign-in code still waiting is cancelled, the sign-in lockout is lifted and old sessions end
    await prisma.otpCode.updateMany({ where: { userId: user.id, isUsed: false }, data: { isUsed: true } });
    clearAttempts(email);
    blacklistUser(user.id);

    return NextResponse.json({ message: "Password updated. Please sign in with your new password." });
  } catch (error) {
    console.error("[Reset password]:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
