import { suspendedResponse } from "@/lib/auth/verify-token";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { deliverOtp, issueOtp } from "@/lib/auth/otp";
import { parseLocale, toEmailLocale } from "@/lib/mailer";
import { ensureDatabaseSchema } from "@/lib/db/schema-sync";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/auth/login-attempts";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: تسجيل الدخول (خطوة 1)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم إرسال رمز التحقق إلى الإيميل
 */
export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema().catch((e) => console.warn("[Login DB Schema Sync Warning]:", e));

    const { email, password, locale } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (await isRateLimited(cleanEmail)) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await recordFailedAttempt(cleanEmail);
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    await clearAttempts(cleanEmail);

    if (user.isBanned) {
      return suspendedResponse();
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address first. Check your inbox for the verification code sent during registration." },
        { status: 403 }
      );
    }

    // Check space provider approval status
    if (user.role === "PARTNER_ADMIN") {
      const partner = await prisma.partner.findFirst({
        where: { contactEmail: { equals: user.email, mode: "insensitive" } }, orderBy: { createdAt: 'asc' },
      });
      if (partner && partner.status === "PENDING_APPROVAL") {
        return NextResponse.json({
          error: "Your partner account is currently under review by platform administrators. You will receive an email confirmation once approved.",
          code: "PARTNER_PENDING_APPROVAL",
        }, { status: 403 });
      }
      if (partner && partner.status === "REJECTED") {
        return NextResponse.json({
          error: "Your partner registration request has been declined. Please contact support for further assistance.",
          code: "PARTNER_REJECTED",
        }, { status: 403 });
      }
    }

    // Emails follow the language the person is using the site in; it is remembered for later emails
    const requested = parseLocale(locale);
    if (requested && requested !== user.locale) {
      await prisma.user.update({ where: { id: user.id }, data: { locale: requested } });
    }

    // A fresh random code (any earlier unused one is cancelled), stored hashed and valid for 10 minutes
    const code = await issueOtp(user.id, "LOGIN");
    await deliverOtp(user.email, code, "LOGIN", requested ?? toEmailLocale(user.locale));

    return NextResponse.json({
      message: "Verification code sent to your email address.",
      userId: user.id,
    });
  } catch (error) {
    console.error("[Login API Error]:", error);
    return NextResponse.json({
      error: "Internal server error.",
    }, { status: 500 });
  }
}