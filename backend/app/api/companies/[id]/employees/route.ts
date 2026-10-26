import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { forbiddenResponse } from "@/lib/ownership";

const employeeFields = { id: true, name: true, email: true, role: true } as const;

/** The company's HR admin and super admins manage its team. */
async function loadManagedCompany(request: Request, companyId: string) {
  const user = await getTokenFromRequest(request);
  if (!user) return { error: unauthorizedResponse(request) };
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, companyName: true, hrAdminId: true } });
  if (!company) return { error: NextResponse.json({ error: "Company not found." }, { status: 404 }) };
  if (user.role !== "SUPER_ADMIN" && company.hrAdminId !== user.userId) {
    return { error: forbiddenResponse("Only the company's HR admin can manage its team.") };
  }
  return { user, company };
}

/**
 * @swagger
 * /api/companies/{id}/employees:
 *   get:
 *     summary: List the company's team members
 *   post:
 *     summary: Add an existing member account to the company by email
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadManagedCompany(request, id);
  if ("error" in ctx) return ctx.error;
  const employees = await prisma.user.findMany({ where: { companyId: id }, select: employeeFields, orderBy: { name: "asc" } });
  return NextResponse.json(employees);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await loadManagedCompany(request, id);
    if ("error" in ctx) return ctx.error;

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const member = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { ...employeeFields, companyId: true, isBanned: true },
    });
    // Accounts are created by their owners: the HR admin adds people who already signed up
    if (!member) {
      return NextResponse.json({ error: "No account uses this email yet. Ask your colleague to sign up first, then add them." }, { status: 404 });
    }
    if (member.companyId === id) {
      return NextResponse.json({ error: "This person is already in your team." }, { status: 409 });
    }
    if (member.companyId) {
      return NextResponse.json({ error: "This person already belongs to another company." }, { status: 409 });
    }
    if (member.role !== "B2C") {
      return NextResponse.json({ error: "Only individual member accounts can join a company team." }, { status: 400 });
    }
    if (member.isBanned) {
      return NextResponse.json({ error: "This account is suspended and cannot join a team." }, { status: 400 });
    }

    const employee = await prisma.user.update({ where: { id: member.id }, data: { companyId: id }, select: employeeFields });
    // Adding someone answers their pending join requests
    await prisma.companyJoinRequest.updateMany({
      where: { userId: member.id, status: "PENDING", companyId: id },
      data: { status: "APPROVED", decidedAt: new Date() },
    });
    await prisma.companyJoinRequest.updateMany({
      where: { userId: member.id, status: "PENDING" },
      data: { status: "CANCELLED", decidedAt: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId: member.id,
        type: "PASS_ASSIGNED",
        title: "Added to a company team",
        message: `You were added to the ${ctx.company.companyName} team. Team bookings can now be made for you.`,
        channel: "IN_APP",
        sentAt: new Date(),
      },
    }).catch((err) => console.error("Team notification failed:", err));

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Error adding a company employee:", error);
    return NextResponse.json({ error: "Failed to add the team member." }, { status: 500 });
  }
}
