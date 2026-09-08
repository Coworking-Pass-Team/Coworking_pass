import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

const VALID_ROLES = ["GUEST", "B2C", "HR_ADMIN", "PARTNER_ADMIN", "SUPER_ADMIN"];

function normalizeRole(role: string): string {
  if (!role) return "B2C";
  const r = role.toUpperCase().trim();
  if (r === "INDIVIDUAL" || r === "B2C") return "B2C";
  if (r === "ORGANIZATION" || r === "HR_ADMIN" || r === "HR") return "HR_ADMIN";
  if (r === "PROVIDER" || r === "PARTNER_ADMIN" || r === "PARTNER") return "PARTNER_ADMIN";
  if (r === "ADMIN" || r === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (r === "GUEST") return "GUEST";
  return r;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const normalizedRole = normalizeRole(role);

    if (!VALID_ROLES.includes(normalizedRole)) {
      return NextResponse.json(
        { error: `نوع الحساب غير صحيح. القيم المسموحة: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "هذا الإيميل مسجل مسبقاً" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: normalizedRole as any },
    });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        codeHash: otpHash,
        purpose: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب. تم إرسال رمز التحقق إلى إيميلك",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}
