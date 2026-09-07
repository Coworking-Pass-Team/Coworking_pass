import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tickets — عرض كل التذاكر
export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { company: true, user: true, replies: true },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}

// POST /api/tickets — إنشاء تذكرة جديدة
export async function POST(request: Request) {
  try {
    const { companyId, userId, subject } = await request.json();

    if (!companyId || !userId || !subject) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: companyId, userId, subject" },
        { status: 400 }
      );
    }

    const companyExists = await prisma.company.findUnique({ where: { id: companyId } });
    if (!companyExists) {
      return NextResponse.json({ error: "الشركة (companyId) غير موجودة" }, { status: 404 });
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return NextResponse.json({ error: "المستخدم (userId) غير موجود" }, { status: 404 });
    }

    const ticket = await prisma.ticket.create({
      data: { companyId, userId, subject, status: "OPEN" },
    });

    return NextResponse.json(
      { message: "تم إنشاء التذكرة بنجاح", ticket },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}