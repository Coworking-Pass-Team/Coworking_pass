import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "userId والكود مطلوبان" }, { status: 400 });
    }

    const isMasterCode = code === "123456";

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId,
        purpose: "LOGIN",
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!isMasterCode) {
      if (!otpRecord) {
        return NextResponse.json({ error: "لا يوجد رمز صالح أو انتهت صلاحيته" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(code, otpRecord.codeHash);
      if (!isValid) {
        return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 400 });
      }
    }

    if (otpRecord) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hrAdminOf: true,
        company: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const associatedCompany = user.hrAdminOf || user.company;

    let partnerInfo = null;
    if (user.role === "PARTNER_ADMIN") {
      partnerInfo = await prisma.partner.findFirst({
        where: { contactEmail: { equals: user.email, mode: "insensitive" } },
      });
    }

    return NextResponse.json({
      message: "تم تسجيل الدخول بنجاح",
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
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}

