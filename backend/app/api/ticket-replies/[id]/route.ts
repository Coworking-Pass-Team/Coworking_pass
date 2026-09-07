import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/ticket-replies/[id] — حذف رد
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.ticketReply.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف الرد بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "الرد غير موجود أو حدث خطأ" },
      { status: 404 }
    );
  }
}