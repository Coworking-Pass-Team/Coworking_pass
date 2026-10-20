import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { forbiddenResponse } from "@/lib/ownership";
import { createPendingJoinRequest, findCompanyByHrEmail, notifyHrOfJoinRequest } from "@/lib/company-join";

/**
 * @swagger
 * /api/company-join-requests:
 *   get:
 *     summary: A member's pending request, or the pending requests of the HR admin's company
 *   post:
 *     summary: A member asks to join a company team, naming it by the HR admin's email
 */
export async function GET(request: Request) {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse(request);

  if (user.role === "HR_ADMIN" || user.role === "SUPER_ADMIN") {
    const companyId = user.role === "SUPER_ADMIN"
      ? new URL(request.url).searchParams.get("companyId")
      : (await prisma.company.findUnique({ where: { hrAdminId: user.userId }, select: { id: true } }))?.id;
    if (!companyId) return NextResponse.json([]);
    const requests = await prisma.companyJoinRequest.findMany({
      // Requests made during sign-up count once the member has verified their email
      where: { companyId, status: "PENDING", user: { emailVerified: true } },
      select: { id: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(requests);
  }

  const [pending, me] = await Promise.all([
    prisma.companyJoinRequest.findFirst({
      where: { userId: user.userId, status: "PENDING" },
      select: { id: true, status: true, createdAt: true, company: { select: { companyName: true, hrAdmin: { select: { name: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: user.userId }, select: { company: { select: { id: true, companyName: true } } } }),
  ]);
  // The current membership lets the app catch up after the HR admin approves or removes the member
  return NextResponse.json({ request: pending, company: me?.company ?? null });
}

export async function POST(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    if (user.role !== "B2C") return forbiddenResponse("Only individual member accounts can join a company team.");

    const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { companyId: true, isBanned: true, emailVerified: true } });
    if (!me || me.isBanned) return forbiddenResponse("This account cannot join a team.");
    if (me.companyId) {
      return NextResponse.json({ error: "Your account already belongs to a company team. Leave it first to join another one." }, { status: 409 });
    }

    const body = await request.json().catch(() => null);
    const target = await findCompanyByHrEmail(body?.hrEmail);
    if (!target.ok) return NextResponse.json({ error: target.error }, { status: target.status });

    const existing = await prisma.companyJoinRequest.findFirst({ where: { userId: user.userId, companyId: target.company.id, status: "PENDING" } });
    if (existing) {
      return NextResponse.json({ error: "Your request to join this company is already waiting for the HR admin." }, { status: 409 });
    }

    const created = await createPendingJoinRequest(user.userId, target.company.id);
    if (me.emailVerified) await notifyHrOfJoinRequest(created.id);
    return NextResponse.json({ id: created.id, status: created.status, companyName: target.company.companyName }, { status: 201 });
  } catch (error) {
    console.error("Error creating a company join request:", error);
    return NextResponse.json({ error: "Failed to send the join request." }, { status: 500 });
  }
}
