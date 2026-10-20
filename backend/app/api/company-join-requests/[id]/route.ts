import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { forbiddenResponse } from "@/lib/ownership";

/**
 * @swagger
 * /api/company-join-requests/{id}:
 *   patch:
 *     summary: The company's HR admin approves or declines a join request (action is approve or decline)
 *   delete:
 *     summary: The member withdraws their pending request
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { id } = await params;

    const joinRequest = await prisma.companyJoinRequest.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, company: { select: { id: true, companyName: true, hrAdminId: true } } },
    });
    if (!joinRequest) return NextResponse.json({ error: "Join request not found." }, { status: 404 });
    if (user.role !== "SUPER_ADMIN" && joinRequest.company.hrAdminId !== user.userId) {
      return forbiddenResponse("Only the company's HR admin can answer join requests.");
    }
    if (joinRequest.status !== "PENDING") {
      return NextResponse.json({ error: "This join request was already answered." }, { status: 409 });
    }

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "approve" && action !== "decline") {
      return NextResponse.json({ error: "Action must be approve or decline." }, { status: 400 });
    }
    const { company } = joinRequest;

    if (action === "approve") {
      const member = await prisma.user.findUnique({ where: { id: joinRequest.userId }, select: { companyId: true, role: true, isBanned: true } });
      if (!member || member.role !== "B2C" || member.isBanned) {
        return NextResponse.json({ error: "This account can no longer join a team." }, { status: 400 });
      }
      if (member.companyId && member.companyId !== company.id) {
        return NextResponse.json({ error: "This person already belongs to another company." }, { status: 409 });
      }
      await prisma.$transaction([
        prisma.user.update({ where: { id: joinRequest.userId }, data: { companyId: company.id } }),
        prisma.companyJoinRequest.update({ where: { id }, data: { status: "APPROVED", decidedAt: new Date() } }),
        prisma.companyJoinRequest.updateMany({
          where: { userId: joinRequest.userId, status: "PENDING", id: { not: id } },
          data: { status: "CANCELLED", decidedAt: new Date() },
        }),
      ]);
    } else {
      await prisma.companyJoinRequest.update({ where: { id }, data: { status: "DECLINED", decidedAt: new Date() } });
    }

    await prisma.notification.create({
      data: {
        userId: joinRequest.userId,
        type: "PASS_ASSIGNED",
        title: action === "approve" ? "Added to a company team" : "Team join request declined",
        message: action === "approve"
          ? `You were added to the ${company.companyName} team. Team bookings can now be made for you.`
          : `Your request to join the ${company.companyName} team was declined.`,
        channel: "IN_APP",
        sentAt: new Date(),
      },
    }).catch((err) => console.error("Join request notification failed:", err));

    return NextResponse.json({ status: action === "approve" ? "APPROVED" : "DECLINED" });
  } catch (error) {
    console.error("Error answering a company join request:", error);
    return NextResponse.json({ error: "Failed to answer the join request." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse(request);
  const { id } = await params;
  const joinRequest = await prisma.companyJoinRequest.findUnique({ where: { id }, select: { userId: true, status: true } });
  if (!joinRequest || joinRequest.userId !== user.userId) return NextResponse.json({ error: "Join request not found." }, { status: 404 });
  if (joinRequest.status !== "PENDING") {
    return NextResponse.json({ error: "This join request was already answered." }, { status: 409 });
  }
  await prisma.companyJoinRequest.update({ where: { id }, data: { status: "CANCELLED", decidedAt: new Date() } });
  return NextResponse.json({ status: "CANCELLED" });
}
