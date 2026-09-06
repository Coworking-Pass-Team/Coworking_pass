import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "userId والكود مطلوبان" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "لا يوجد رمز صالح أو انتهت صلاحيته" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(code, otpRecord.codeHash);
    if (!isValid) {
      return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 400 });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const token = jwt.sign(
      { userId: user!.id, role: user!.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      message: "تم تسجيل الدخول بنجاح",
      token,
      user: { id: user!.id, name: user!.name, email: user!.email, role: user!.role },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}