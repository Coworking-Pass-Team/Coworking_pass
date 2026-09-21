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
    const { name, email, password, role, companyId, companyName, orgName, businessName, crNumber } = await request.json();

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

    if (assignedRole === "PARTNER_ADMIN" || (crNumber && String(crNumber).trim())) {
      const cleanCr = crNumber ? String(crNumber).trim() : '';
      if (assignedRole === "PARTNER_ADMIN" && !cleanCr) {
        return NextResponse.json(
          { error: "رقم السجل التجاري (CR Number) مطلوب لمزودي المساحات" },
          { status: 400 }
        );
      }
      if (cleanCr && !/^(1010|1011|2050|2051|2052|2053|2055|2251|2252|3350|3351|3400|3450|3452|3550|4030|4031|4032|4650|4700|5850|5851|5900|5950|[1-5]\d{3})\d{6}$/.test(cleanCr)) {
        return NextResponse.json(
          { error: "رقم السجل التجاري غير صالح. يجب أن يتكون من 10 أرقام ويبدأ برمز منطقة معتمد (مثل 1010xxxxxx)" },
          { status: 400 }
        );
      }
    }

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

    // إنشاء سجل الشريك لمزود المساحات بحالة بانتظار الاعتماد (PENDING_APPROVAL)
    if (assignedRole === "PARTNER_ADMIN") {
      const finalBrandName = (businessName || name || 'New Partner').trim();
      const cleanCr = crNumber ? String(crNumber).trim() : '';
      try {
        await prisma.partner.create({
          data: {
            brandName: finalBrandName,
            contactEmail: cleanEmail,
            taxNumber: cleanCr || '300000000000003',
            revenueSharePercentage: 15,
            status: "PENDING_APPROVAL",
          },
        });

        // إشعار السوبر أدمن بالطلب الجديد
        const superAdmins = await prisma.user.findMany({
          where: { role: "SUPER_ADMIN" },
          select: { id: true },
        });
        for (const admin of superAdmins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              type: "PARTNER_APPROVED",
              title: "طلب انضمام مزود مساحة جديد",
              message: `قدمت المنشأة "${finalBrandName}" (السجل التجاري: ${cleanCr || 'غير محدد'}) طلب انضمام جديد وهو قيد المراجعة والاعتماد.`,
              channel: "IN_APP",
            },
          }).catch(() => {});
        }
      } catch (partnerErr) {
        console.error("❌ Error creating partner for PARTNER_ADMIN on register:", partnerErr);
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