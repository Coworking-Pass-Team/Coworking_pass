import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { forbiddenResponse } from "@/lib/ownership";
import { companySpentThisMonth } from "@/lib/company/credit";

const MAX_LIMIT = 1_000_000;

/** The company's HR admin (or a Super Admin) manages the company money held by its members. */
async function loadManagedCompany(request: Request, id: string) {
  const user = await getTokenFromRequest(request);
  if (!user) return { error: unauthorizedResponse(request) } as const;
  const company = await prisma.company.findUnique({ where: { id }, select: { id: true, hrAdminId: true } });
  if (!company) return { error: NextResponse.json({ error: "Company not found." }, { status: 404 }) } as const;
  if (user.role !== "SUPER_ADMIN" && !(user.role === "HR_ADMIN" && company.hrAdminId === user.userId)) {
    return { error: forbiddenResponse("Only the company's HR admin can manage team members' company funds.") } as const;
  }
  return { user, company } as const;
}

/**
 * @swagger
 * /api/companies/{id}/funds:
 *   get:
 *     summary: Company money held by each team member (unspent funds, spent this month, monthly limit)
 *     security:
 *       - BearerAuth: []
 *   put:
 *     summary: Set or clear a team member's monthly limit on spending company money
 *     description: Body { userId, monthlyLimit } where monthlyLimit is an amount in SAR or null for no limit.
 *     security:
 *       - BearerAuth: []
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadManagedCompany(request, id);
    if ("error" in loaded) return loaded.error;

    const members = await prisma.user.findMany({
      where: { companyId: id, role: "B2C" },
      select: { id: true, name: true, email: true, companySpendLimit: true, wallet: { select: { id: true, companyCredit: true, companyCreditCompanyId: true } } },
      orderBy: { name: "asc" },
    });
    const rows = await Promise.all(
      members.map(async (m) => ({
        userId: m.id,
        name: m.name,
        email: m.email,
        companyCredit: m.wallet && m.wallet.companyCreditCompanyId === id ? m.wallet.companyCredit : 0,
        spentThisMonth: m.wallet ? await companySpentThisMonth(prisma, m.wallet.id) : 0,
        monthlyLimit: m.companySpendLimit,
      }))
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error reading team members' company funds:", error);
    return NextResponse.json({ error: "Failed to load team members' company funds." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadManagedCompany(request, id);
    if ("error" in loaded) return loaded.error;

    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId : "";
    const raw = body.monthlyLimit;
    const monthlyLimit = raw === null ? null : typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw * 100) / 100 : Number.NaN;
    if (monthlyLimit !== null && (Number.isNaN(monthlyLimit) || monthlyLimit < 0 || monthlyLimit > MAX_LIMIT)) {
      return NextResponse.json({ error: "Enter a monthly limit of zero or more, or remove the limit." }, { status: 400 });
    }

    const member = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, companyId: true, role: true } }) : null;
    if (!member || member.companyId !== id || member.role !== "B2C") {
      return NextResponse.json({ error: "This person is not in the team." }, { status: 404 });
    }

    await prisma.user.update({ where: { id: userId }, data: { companySpendLimit: monthlyLimit } });
    return NextResponse.json({ message: monthlyLimit === null ? "Monthly limit removed." : "Monthly limit saved.", userId, monthlyLimit });
  } catch (error) {
    console.error("Error saving a team member's monthly limit:", error);
    return NextResponse.json({ error: "Failed to save the monthly limit." }, { status: 500 });
  }
}
