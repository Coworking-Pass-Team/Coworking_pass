import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

const VALID_ROLES = ["GUEST", "B2C", "HR_ADMIN", "PARTNER_ADMIN"];

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
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser && existingUser.emailVerified) {
  return NextResponse.json(
    { error: "An account with this email address already exists." },
    { status: 400 }
  );
}

if (existingUser && !existingUser.emailVerified) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: existingUser.id },
    data: { name: name.trim(), passwordHash },
  });

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  await prisma.otpCode.create({
    data: {
      userId: existingUser.id,
      codeHash: otpHash,
      purpose: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  await sendOtpEmail(cleanEmail, otp).catch(() => {});

  return NextResponse.json(
    { message: "Account already exists but not verified. A new verification code has been sent.", userId: existingUser.id },
    { status: 200 }
  );
}

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = (role && VALID_ROLES.includes(role)) ? role : "B2C";

    if (assignedRole === "PARTNER_ADMIN" || (crNumber && String(crNumber).trim())) {
      const cleanCr = crNumber ? String(crNumber).trim() : '';
      if (assignedRole === "PARTNER_ADMIN" && !cleanCr) {
        return NextResponse.json(
          { error: "Commercial Registration (CR) Number is required for space venue partners." },
          { status: 400 }
        );
      }
      if (cleanCr && !/^(1010|1011|2050|2051|2052|2053|2055|2251|2252|3350|3351|3400|3450|3452|3550|4030|4031|4032|4650|4700|5850|5851|5900|5950|[1-5]\d{3})\d{6}$/.test(cleanCr)) {
        return NextResponse.json(
          { error: "CR Number must be 10 digits starting with a valid region code (e.g., 1010xxxxxx)." },
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
  await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  return NextResponse.json(
    { error: "Failed to create company record. Please try registering again." },
    { status: 500 }
  );
}
    }

    // إنشاء سجل الشريك لمزود المساحات بحالة بانتظار الاعتماد (PENDING_APPROVAL)
    if (assignedRole === "PARTNER_ADMIN") {
      const finalBrandName = (businessName || name || 'New Partner').trim();
      const cleanCr = crNumber ? String(crNumber).trim() : '';
      try {
        const existingPartner = await prisma.partner.findFirst({
          where: { contactEmail: cleanEmail },
        });
        if (existingPartner) {
          await prisma.partner.update({
            where: { id: existingPartner.id },
            data: {
              brandName: finalBrandName,
              taxNumber: cleanCr || existingPartner.taxNumber || '300000000000003',
              status: "PENDING_APPROVAL",
            },
          });
        } else {
          await prisma.partner.create({
            data: {
              brandName: finalBrandName,
              contactEmail: cleanEmail,
              taxNumber: cleanCr || '300000000000003',
              revenueSharePercentage: 15,
              status: "PENDING_APPROVAL",
            },
          });
        }

        // Notify Super Admins about the new application
        const superAdmins = await prisma.user.findMany({
          where: {
            OR: [
              { role: "SUPER_ADMIN" },
              { email: "admin@coworkingpass.sa" },
            ],
          },
          select: { id: true },
        });

        if (superAdmins.length > 0) {
  for (const admin of superAdmins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "PARTNER_APPROVED",
        title: "New Space Partner Application",
        message: `Venue "${finalBrandName}" (CR: ${cleanCr || 'N/A'}) has submitted a registration application pending your review and approval.`,
        channel: "IN_APP",
      },
    }).catch(() => {});
  }
} else {
  console.warn("⚠️ No SUPER_ADMIN account exists to notify about new partner application:", finalBrandName);
}
      } catch (partnerErr) {
        console.error("❌ Error creating partner for PARTNER_ADMIN on register:", partnerErr);
      }
    }

    // Create wallet for new user
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
        message: "Account created successfully. Verification code sent to your email address.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error registering user:", error);
    return NextResponse.json({ error: "Internal server error during account registration." }, { status: 500 });
  }
}