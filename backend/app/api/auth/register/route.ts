import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: تسجيل حساب جديد
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [GUEST, B2C, HR_ADMIN, PARTNER_ADMIN]
 *               companyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء الحساب وإرسال رمز التحقق
 *       400:
 *         description: بيانات غير صحيحة أو الإيميل مستخدم مسبقاً
 */
export async function POST(request: Request) {
  try {
    const { name, email, password, role, companyId } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "الاسم والإيميل وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "يوجد حساب مسجل بهذا الإيميل مسبقاً" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const validRoles = ["GUEST", "B2C", "HR_ADMIN", "PARTNER_ADMIN", "SUPER_ADMIN"];
    const assignedRole = validRoles.includes(role) ? role : "B2C";

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: assignedRole as any,
        companyId: companyId || null,
        emailVerified: false,
      },
    });

    // Create empty wallet for the new user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    }).catch(() => {});

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

    await sendOtpEmail(cleanEmail, otp).catch(() => {});

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح. تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error registering user:", error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر أثناء تسجيل الحساب" },
      { status: 500 }
    );
  }
}
