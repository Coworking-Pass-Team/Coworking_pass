import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkOtp } from "@/lib/auth/otp";

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Check a password-reset code without using it up (so the screen can ask for the new password next)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code : "";
    const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null;
    if (!user || !code) return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });

    const check = await checkOtp(user.id, "PASSWORD_RESET", code, false);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    return NextResponse.json({ message: "Code accepted." });
  } catch (error) {
    console.error("[Verify reset code]:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
