import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { ensureDatabaseSchema } from "@/lib/db-schema-sync";

// GET /api/tickets — عرض كل التذاكر
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    // Admins see every ticket; everyone else only their own
    const tickets = await prisma.ticket.findMany({
      where: user.role === "SUPER_ADMIN" ? {} : { userId: user.userId },
      include: { company: true, user: { select: { id: true, name: true, email: true } }, replies: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
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
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { companyId, subject, message, category, priority } = await request.json();

    if (!subject || typeof subject !== "string") {
      return NextResponse.json({ error: "Required field: subject" }, { status: 400 });
    }

    // The ticket always belongs to the caller; a company is optional (individuals and partners have none)
    let resolvedCompanyId: string | null = null;
    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        return NextResponse.json({ error: "Company (companyId) not found." }, { status: 404 });
      }
      if (user.role !== "SUPER_ADMIN" && company.hrAdminId !== user.userId) {
        const member = await prisma.user.findFirst({ where: { id: user.userId, companyId } });
        if (!member) {
          return NextResponse.json({ error: "You do not belong to this company." }, { status: 403 });
        }
      }
      resolvedCompanyId = company.id;
    }

    await ensureDatabaseSchema().catch(() => undefined);

    const ticket = await prisma.ticket.create({
      data: {
        companyId: resolvedCompanyId,
        userId: user.userId,
        subject: subject.slice(0, 300),
        message: typeof message === "string" ? message : null,
        category: typeof category === "string" ? category : null,
        priority: typeof priority === "string" ? priority : null,
        status: "OPEN",
      },
    });

    return NextResponse.json(
      { message: "Support ticket created successfully.", ticket },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
