import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"];

// PUT /api/tickets/[id] — تعديل حالة التذكرة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    if (data.status && !VALID_STATUSES.includes(data.status)) {
      return NextResponse.json(
        { error: `status يجب أن يكون: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "تم تعديل التذكرة بنجاح", ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "التذكرة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}

// DELETE /api/tickets/[id] — حذف تذكرة
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.ticket.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف التذكرة بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "التذكرة غير موجودة أو حدث خطأ" },
      { status: 404 }
    );
  }
}