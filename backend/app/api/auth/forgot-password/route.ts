import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliverOtp, issueOtp, recentlyIssued } from "@/lib/auth/otp";
import { parseLocale, toEmailLocale } from "@/lib/mailer";

/** Same answer whether or not the address has an account, so the form cannot be used to find out who is registered. */
const GENERIC = { message: "If an account exists for this email, a reset code has been sent to it." };

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send a one-time password-reset code to the account's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Always the same message, whether or not the account exists
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, isBanned: true, emailVerified: true, locale: true } });
    // Suspended and unverified accounts get no code (an unverified one finishes sign-up instead)
    if (user && !user.isBanned && user.emailVerified && !(await recentlyIssued(user.id, "PASSWORD_RESET"))) {
      const requested = parseLocale(body.locale);
      if (requested && requested !== user.locale) {
        await prisma.user.update({ where: { id: user.id }, data: { locale: requested } });
      }
      const code = await issueOtp(user.id, "PASSWORD_RESET");
      await deliverOtp(user.email, code, "PASSWORD_RESET", requested ?? toEmailLocale(user.locale));
    }
    return NextResponse.json(GENERIC);
  } catch (error) {
    console.error("[Forgot password]:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
