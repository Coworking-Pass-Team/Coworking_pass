import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPendingJoinRequestsOf } from "@/lib/company/join";
import { checkOtp } from "@/lib/auth/otp";



/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: تفعيل الحساب بالكود
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
 *         description: تم تفعيل الحساب
 */
export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "userId and verification code are required." }, { status: 400 });
    }

    const check = await checkOtp(userId, "EMAIL_VERIFICATION", String(code));
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    // Join requests made at sign-up reach the HR admin only now that the email is confirmed
    await notifyPendingJoinRequestsOf(userId).catch((err) => console.error("Join request notification failed:", err));

    return NextResponse.json({ message: "Account verified successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}