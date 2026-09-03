import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/partners — عرض كل الشركاء
export async function GET() {
  try {
    const partners = await prisma.partner.findMany();
    return NextResponse.json(partners);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}

// POST /api/partners — إضافة شريك جديد
export async function POST(request: Request) {
  try {
    const { brandName, contactEmail, taxNumber, revenueSharePercentage } =
      await request.json();

    if (!brandName || !contactEmail || !taxNumber || revenueSharePercentage === undefined) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: brandName, contactEmail, taxNumber, revenueSharePercentage" },
        { status: 400 }
      );
    }

    const partner = await prisma.partner.create({
      data: { brandName, contactEmail, taxNumber, revenueSharePercentage },
    });

    return NextResponse.json(
      { message: "تم إنشاء الشريك بنجاح", partner },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}