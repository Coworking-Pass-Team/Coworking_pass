import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { deliverOtp, issueOtp } from "@/lib/auth/otp";
import type { Role } from "@prisma/client";
import { createPendingJoinRequest, findCompanyByHrEmail } from "@/lib/company/join";
import { passwordPolicyError } from "@/lib/auth/password-policy";
import { CR_NUMBER_ERROR, isValidCrNumber, normalizeCrNumber } from "@/lib/partners/cr-number";
import { toEmailLocale } from "@/lib/mailer";

const VALID_ROLES = ["GUEST", "B2C", "HR_ADMIN", "PARTNER_ADMIN"];

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
 *               companyHrEmail:
 *                 type: string
 *                 description: Company employees only - the HR admin's email; sends a join request for the HR admin to approve
 *     responses:
 *       201:
 *         description: تم إنشاء الحساب بنجاح وإرسال رمز التحقق
 */
export async function POST(request: Request) {
  try {
    const { name, email, password, role, companyName, orgName, businessName, crNumber, companyHrEmail, locale } = await request.json();
    // Language of the emails this person receives (the site language at sign-up, Arabic by default)
    const emailLocale = toEmailLocale(locale);

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const weak = passwordPolicyError(password);
    if (weak) return NextResponse.json(weak, { status: 400 });

    const cleanEmail = email.trim().toLowerCase();

    // A company employee names their company by the HR admin's email; the HR admin approves the request.
    // Accounts never join a company directly at sign-up.
    let joinCompanyId: string | null = null;
    const wantsToJoin = typeof companyHrEmail === "string" && companyHrEmail.trim() !== "";
    if (wantsToJoin) {
      if (role && role !== "B2C") {
        return NextResponse.json({ error: "Only individual member accounts can join a company team." }, { status: 400 });
      }
      const target = await findCompanyByHrEmail(companyHrEmail);
      if (!target.ok) return NextResponse.json({ error: target.error }, { status: target.status });
      if (companyHrEmail.trim().toLowerCase() === cleanEmail) {
        return NextResponse.json({ error: "Please enter your HR admin's email, not your own." }, { status: 400 });
      }
      joinCompanyId = target.company.id;
    }

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
    data: { name: name.trim(), passwordHash, locale: emailLocale },
  });
  if (joinCompanyId && existingUser.role === "B2C" && !existingUser.companyId) {
    await createPendingJoinRequest(existingUser.id, joinCompanyId);
  }

  const otp = await issueOtp(existingUser.id, "EMAIL_VERIFICATION");
  await deliverOtp(cleanEmail, otp, "EMAIL_VERIFICATION", emailLocale);

  return NextResponse.json(
    { message: "Account already exists but not verified. A new verification code has been sent.", userId: existingUser.id },
    { status: 200 }
  );
}

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = (role && VALID_ROLES.includes(role)) ? role : "B2C";

    const cleanCr = normalizeCrNumber(crNumber);
    if (assignedRole === "PARTNER_ADMIN" && !cleanCr) {
      return NextResponse.json(
        { error: "Commercial Registration (CR) Number is required for space venue partners." },
        { status: 400 }
      );
    }
    if (cleanCr && !isValidCrNumber(cleanCr)) {
      return NextResponse.json({ error: CR_NUMBER_ERROR }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: assignedRole as Role,
        emailVerified: false,
        locale: emailLocale,
      },
    });

    if (joinCompanyId && assignedRole === "B2C") {
      await createPendingJoinRequest(user.id, joinCompanyId);
    }

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

    const otp = await issueOtp(user.id, "EMAIL_VERIFICATION");
    await deliverOtp(cleanEmail, otp, "EMAIL_VERIFICATION", emailLocale);

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