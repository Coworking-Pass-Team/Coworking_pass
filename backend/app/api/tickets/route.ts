import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

// GET /api/tickets — عرض كل التذاكر
export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const tickets = await prisma.ticket.findMany({
      include: { company: true, user: true, replies: true },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}


/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: فتح تذكرة دعم (للشركات فقط)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId, userId, subject]
 *             properties:
 *               companyId:
 *                 type: string
 *               userId:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء التذكرة
 */
// POST /api/tickets — إنشاء تذكرة جديدة
export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
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