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
    const { subject, message, category, priority, onBehalfOfEmail } = await request.json();

    if (!subject || typeof subject !== "string") {
      return NextResponse.json({ error: "Required field: subject" }, { status: 400 });
    }

    // The ticket belongs to the caller. An administrator may file it for a customer identified by email
    // (used when a customer's inquiry only exists in the admin's browser).
    let ownerId = user.userId;
    if (user.role === "SUPER_ADMIN" && typeof onBehalfOfEmail === "string" && onBehalfOfEmail.trim()) {
      const owner = await prisma.user.findFirst({ where: { email: { equals: onBehalfOfEmail.trim(), mode: "insensitive" } }, select: { id: true } });
      if (owner) ownerId = owner.id;
    }

    // The company always comes from the owner's own record; a client-supplied id is never trusted
    // (a stale id previously made the whole request fail and the inquiry never reached the database).
    const ownerRow = await prisma.user.findUnique({ where: { id: ownerId }, select: { companyId: true } });
    let resolvedCompanyId: string | null = ownerRow?.companyId ?? null;
    if (!resolvedCompanyId) {
      const owned = await prisma.company.findFirst({ where: { hrAdminId: ownerId }, select: { id: true } });
      resolvedCompanyId = owned?.id ?? null;
    }

    await ensureDatabaseSchema().catch(() => undefined);

    const ticket = await prisma.ticket.create({
      data: {
        companyId: resolvedCompanyId,
        userId: ownerId,
        subject: subject.slice(0, 300),
        message: typeof message === "string" ? message : null,
        category: typeof category === "string" ? category : null,
        priority: typeof priority === "string" ? priority : null,
        status: "OPEN",
      },
    });

    // Let every administrator know a new inquiry arrived (best effort; never blocks ticket creation)
    try {
      const admins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { id: true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: "SUPPORT_TICKET" as const,
            title: category === "enterprise" ? "New Custom Enterprise inquiry" : "New support ticket",
            message: ticket.subject,
            channel: "IN_APP" as const,
          })),
        });
      }
    } catch (notifyError) {
      console.warn("Ticket admin notification failed:", notifyError);
    }

    return NextResponse.json(
      { message: "Support ticket created successfully.", ticket },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
