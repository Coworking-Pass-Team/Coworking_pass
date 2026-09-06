import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/workspaces — عرض كل مساحات العمل
export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: { partner: true, sections: true },
    });
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces — إضافة مساحة عمل جديدة
export async function POST(request: Request) {
  try {
    const {
      partnerId,
      name,
      city,
      locationMapUrl,
      dailyRate,
      monthlyRate,
      yearlyRate,
      passVisitValue,
      totalCapacity,
    } = await request.json();

    if (!partnerId || !name || !city || !passVisitValue || !totalCapacity) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: partnerId, name, city, passVisitValue, totalCapacity" },
        { status: 400 }
      );
    }

    const partnerExists = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partnerExists) {
      return NextResponse.json(
        { error: "الشريك (partnerId) غير موجود" },
        { status: 404 }
      );
    }

    const workspace = await prisma.workspace.create({
      data: {
        partnerId,
        name,
        city,
        locationMapUrl,
        dailyRate,
        monthlyRate,
        yearlyRate,
        passVisitValue,
        totalCapacity,
      },
    });

    return NextResponse.json(
      { message: "تم إنشاء مساحة العمل بنجاح", workspace },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}