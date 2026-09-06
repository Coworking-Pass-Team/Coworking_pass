import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/hourly-packages/[id] — تعديل باقة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const hourlyPackage = await prisma.hourlyPackage.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل الباقة بنجاح", hourlyPackage });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الباقة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}

// DELETE /api/hourly-packages/[id] — حذف باقة
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.hourlyPackage.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف الباقة بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الباقة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}