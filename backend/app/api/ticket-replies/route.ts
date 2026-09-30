import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

// GET /api/ticket-replies — list replies visible to the caller
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    // Admins see every reply; everyone else only replies on their own tickets
    const replies = await prisma.ticketReply.findMany({
      where: user.role === "SUPER_ADMIN" ? {} : { ticket: { userId: user.userId } },
      include: { ticket: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(replies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}


/**
 * @swagger
 * /api/ticket-replies:
 *   post:
 *     summary: إضافة رد على تذكرة
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticketId, userId, message]
 *             properties:
 *               ticketId:
 *                 type: string
 *               userId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إضافة الرد
 *       400:
 *         description: التذكرة مغلقة (CLOSED)
 */
export async function POST(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { ticketId, message } = await request.json();
    const userId = user.userId;

    if (!ticketId || !userId || !message) {
      return NextResponse.json(
        { error: "Required fields: ticketId, userId, message" },
        { status: 400 }
      );
    }

    const ticketExists = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketExists) {
      return NextResponse.json({ error: "Support ticket (ticketId) not found." }, { status: 404 });
    }
    // Only the ticket owner or an administrator may reply
    if (user.role !== "SUPER_ADMIN" && ticketExists.userId !== user.userId) {
      return NextResponse.json({ error: "You are not allowed to reply to this ticket." }, { status: 403 });
    }

    // Administrators may keep answering a resolved ticket; customers cannot reopen it by replying
    if (ticketExists.status === "CLOSED" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot reply to a closed support ticket." },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return NextResponse.json({ error: "User (userId) not found." }, { status: 404 });
    }

    const reply = await prisma.ticketReply.create({
      data: { ticketId, userId, message },
    });

    // When an admin replies to an open ticket, move it to IN_PROGRESS automatically
    if (ticketExists.status === "OPEN" && user.role === "SUPER_ADMIN") {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Tell the customer when support answers their ticket (best effort)
    if (user.role === "SUPER_ADMIN" && ticketExists.userId !== user.userId) {
      await prisma.notification
        .create({
          data: {
            userId: ticketExists.userId,
            type: "SUPPORT_TICKET",
            title: "Support replied to your ticket",
            message: message.slice(0, 200),
            channel: "IN_APP",
          },
        })
        .catch(() => undefined);
    }

    return NextResponse.json(
      { message: "Reply added successfully.", reply },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}