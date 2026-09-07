import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/ticket-replies — عرض كل الردود
export async function GET() {
  try {
    const replies = await prisma.ticketReply.findMany({
      include: { ticket: true, user: true },
    });
    return NextResponse.json(replies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}

// POST /api/ticket-replies — إضافة رد على تذكرة
export async function POST(request: Request) {
  try {
    const { ticketId, userId, message } = await request.json();

    if (!ticketId || !userId || !message) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: ticketId, userId, message" },
        { status: 400 }
      );
    }

    const ticketExists = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketExists) {
      return NextResponse.json({ error: "التذكرة (ticketId) غير موجودة" }, { status: 404 });
    }

    if (ticketExists.status === "CLOSED") {
      return NextResponse.json(
        { error: "لا يمكن الرد على تذكرة مغلقة" },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return NextResponse.json({ error: "المستخدم (userId) غير موجود" }, { status: 404 });
    }

    const reply = await prisma.ticketReply.create({
      data: { ticketId, userId, message },
    });

    // لما الأدمن يرد، تحديث حالة التذكرة تلقائياً لـ IN_PROGRESS
    if (ticketExists.status === "OPEN") {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json(
      { message: "تم إضافة الرد بنجاح", reply },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}