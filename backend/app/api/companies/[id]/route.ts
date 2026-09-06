import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/companies/[id] — تعديل شركة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const company = await prisma.company.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل الشركة بنجاح", company });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشركة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}

// DELETE /api/companies/[id] — حذف شركة
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الشركة بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشركة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}