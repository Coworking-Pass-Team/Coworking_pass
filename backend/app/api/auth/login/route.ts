import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "This account has been suspended. Please contact platform support." }, { status: 403 });
    }

    // Check space provider approval status
    if (user.role === "PARTNER_ADMIN") {
      const partner = await prisma.partner.findFirst({
        where: { contactEmail: { equals: user.email, mode: "insensitive" } },
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

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        codeHash: otpHash,
        purpose: "LOGIN",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json({
      message: "Verification code sent to your email address.",
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}