import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

const VALID_ROLES = ["GUEST", "B2C", "HR_ADMIN", "PARTNER_ADMIN", "SUPER_ADMIN"];

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
 *         description: تم إنشاء الحساب بنجاح وإرسال رمز التحقق
 */
export async function POST(request: Request) {
  try {
    const { name, email, password, role, companyId, companyName, orgName } = await request.json();

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
    const assignedRole = (role && VALID_ROLES.includes(role)) ? role : "B2C";

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

    // إنشاء سجل الشركة للمنظمة بشكل منفصل عن اسم المالك الشخصي
    if (assignedRole === "HR_ADMIN") {
      const finalCompanyName = (companyName || orgName || 'New Organization').trim();
      try {
        const company = await prisma.company.create({
          data: {
            companyName: finalCompanyName,
            hrAdminId: user.id,
            totalPassesAllocated: 0,
            balance: 0,
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: company.id },
        });
      } catch (companyErr) {
        console.error("❌ Error creating company for HR_ADMIN on register:", companyErr);
      }
    }

    // إنشاء محفظة للمستخدم الجديد
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
    return NextResponse.json({ error: "حدث خطأ في السيرفر أثناء تسجيل الحساب" }, { status: 500 });
  }
}