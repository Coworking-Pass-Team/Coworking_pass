import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/companies — عرض كل الشركات
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: { hrAdmin: true, employees: true },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}

// POST /api/companies — إضافة شركة جديدة
export async function POST(request: Request) {
  try {
    const { companyName, hrAdminId, totalPassesAllocated } = await request.json();

    if (!companyName || !hrAdminId) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: companyName, hrAdminId" },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({ where: { id: hrAdminId } });
    if (!userExists) {
      return NextResponse.json({ error: "المستخدم (hrAdminId) غير موجود" }, { status: 404 });
    }

    if (userExists.role !== "HR_ADMIN") {
      return NextResponse.json(
        { error: "هذا المستخدم دوره ليس HR_ADMIN" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        companyName,
        hrAdminId,
        totalPassesAllocated: totalPassesAllocated ?? 0,
      },
    });

    return NextResponse.json(
      { message: "تم إنشاء الشركة بنجاح", company },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}