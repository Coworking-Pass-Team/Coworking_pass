import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/amenities — عرض كل المرافق
export async function GET() {
  try {
    const amenities = await prisma.amenityCatalog.findMany();
    return NextResponse.json(amenities);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}

// POST /api/amenities — اقتراح مرفق جديد
export async function POST(request: Request) {
  try {
    const { name, icon, isDefault, requestedBy } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "الحقل name مطلوب" }, { status: 400 });
    }

    // لو مرفق افتراضي من الإدارة، يوافق عليه تلقائياً
    // لو مقترح من شريك، يبقى بانتظار الموافقة
    const status = isDefault ? "APPROVED" : "PENDING_APPROVAL";

    if (!isDefault && !requestedBy) {
      return NextResponse.json(
        { error: "requestedBy مطلوب عند اقتراح مرفق غير افتراضي" },
        { status: 400 }
      );
    }

    const amenity = await prisma.amenityCatalog.create({
      data: {
        name,
        icon,
        isDefault: isDefault ?? false,
        status,
        requestedBy: isDefault ? null : requestedBy,
      },
    });

    return NextResponse.json(
      { message: "تم إضافة المرفق بنجاح", amenity },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}