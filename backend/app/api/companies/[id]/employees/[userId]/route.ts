import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { forbiddenResponse } from "@/lib/ownership";

/**
 * @swagger
 * /api/companies/{id}/employees/{userId}:
 *   delete:
 *     summary: Remove a member from the company team (HR admin, super admin, or the member leaving)
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { id, userId } = await params;

    const company = await prisma.company.findUnique({ where: { id }, select: { id: true, companyName: true, hrAdminId: true } });
    if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

    const isManager = user.role === "SUPER_ADMIN" || company.hrAdminId === user.userId;
    const isLeaving = user.userId === userId;
    if (!isManager && !isLeaving) return forbiddenResponse("Only the company's HR admin can remove team members.");
    if (userId === company.hrAdminId) {
      return NextResponse.json({ error: "The company's HR admin cannot be removed from the team." }, { status: 400 });
    }

    const member = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, companyId: true } });
    if (!member || member.companyId !== id) {
      return NextResponse.json({ error: "This person is not in the team." }, { status: 404 });
    }

    await prisma.user.update({ where: { id: userId }, data: { companyId: null } });
    if (!isLeaving) {
      await prisma.notification.create({
        data: {
          userId,
          type: "PASS_ASSIGNED",
          title: "Removed from a company team",
          message: `You are no longer part of the ${company.companyName} team.`,
          channel: "IN_APP",
          sentAt: new Date(),
        },
      }).catch((err) => console.error("Team notification failed:", err));
    }
    return NextResponse.json({ message: "Team member removed." });
  } catch (error) {
    console.error("Error removing a company employee:", error);
    return NextResponse.json({ error: "Failed to remove the team member." }, { status: 500 });
  }
}
