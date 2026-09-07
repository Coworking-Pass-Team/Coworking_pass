import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/amenities/[id] — الموافقة أو رفض مرفق مقترح
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "status يجب أن يكون APPROVED أو REJECTED" },
        { status: 400 }
      );
    }

    const amenity = await prisma.amenityCatalog.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ message: "تم تحديث حالة المرفق بنجاح", amenity });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "المرفق غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}

// DELETE /api/amenities/[id] — حذف مرفق
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.amenityCatalog.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف المرفق بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "المرفق غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}