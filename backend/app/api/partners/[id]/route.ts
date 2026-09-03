import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const partner = await prisma.partner.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل الشريك بنجاح", partner });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشريك غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.partner.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الشريك بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الشريك غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}