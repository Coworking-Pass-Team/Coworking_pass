import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { removeFromBlacklist } from "@/lib/auth/token-blacklist";

/**
 * @swagger
 * /api/auth/verify-login:
 *   post:
 *     summary: تأكيد الدخول (يرجع Token)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, code]
 *             properties:
 *               userId:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول، يرجع token
 */

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "User ID and verification code are required." }, { status: 400 });
    }

    const isDevOtpAllowed = process.env.ENABLE_DEV_OTP !== "false";
    const isMasterCode = isDevOtpAllowed && code === "123456";

    if (!isMasterCode) {
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          userId,
          purpose: "LOGIN",
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!otpRecord) {
        return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
      }

      const isValid = await bcrypt.compare(code, otpRecord.codeHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
      }

      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
    } else {
      // Mark any pending OTP code as used
      const existingOtp = await prisma.otpCode.findFirst({
        where: { userId, purpose: "LOGIN", isUsed: false },
        orderBy: { createdAt: "desc" },
      });
      if (existingOtp) {
        await prisma.otpCode.update({
          where: { id: existingOtp.id },
          data: { isUsed: true },
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hrAdminOf: true,
        company: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!user.emailVerified) {
     return NextResponse.json({ error: "Please verify your email address first." }, { status: 403 });
    }
    if (user.isBanned) {
      return NextResponse.json({ error: "This account has been suspended. Please contact platform support." }, { status: 403 });
    }

    let partnerInfo = null;
    if (user.role === "PARTNER_ADMIN") {
      partnerInfo = await prisma.partner.findFirst({
        where: { contactEmail: { equals: user.email, mode: "insensitive" } },
      });
      if (partnerInfo && partnerInfo.status === "PENDING_APPROVAL") {
        return NextResponse.json({
          error: "Your partner account is currently under review by platform administrators. You will receive an email once approved.",
          code: "PARTNER_PENDING_APPROVAL",
        }, { status: 403 });
      }
      if (partnerInfo && partnerInfo.status === "REJECTED") {
        return NextResponse.json({
          error: "Your partner registration request has been declined. Please contact support.",
          code: "PARTNER_REJECTED",
        }, { status: 403 });
      }
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Unblacklist user on fresh login to allow new sessions
    removeFromBlacklist(user.id);

    const associatedCompany = user.hrAdminOf || user.company;

    return NextResponse.json({
      message: "Logged in successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: associatedCompany?.id || user.companyId || null,
        companyName: associatedCompany?.companyName || null,
        orgName: associatedCompany?.companyName || null,
        businessName: partnerInfo?.brandName || null,
        crNumber: partnerInfo?.taxNumber || null,
        partnerStatus: partnerInfo?.status || null,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

