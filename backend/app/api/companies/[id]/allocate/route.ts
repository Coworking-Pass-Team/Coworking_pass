import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { forbiddenResponse } from "@/lib/ownership";
import { applyAllocation, notifyRecipients, planAllocation } from "@/lib/company/allocation";

/** The company's HR admin (or a Super Admin) is the only one who may move the company's money. */
async function loadManagedCompany(request: Request, id: string) {
  const user = await getTokenFromRequest(request);
  if (!user) return { error: unauthorizedResponse(request) } as const;
  const company = await prisma.company.findUnique({ where: { id }, select: { id: true, companyName: true, hrAdminId: true, balance: true } });
  if (!company) return { error: NextResponse.json({ error: "Company not found." }, { status: 404 }) } as const;
  if (user.role !== "SUPER_ADMIN" && !(user.role === "HR_ADMIN" && company.hrAdminId === user.userId)) {
    return { error: forbiddenResponse("Only the company's HR admin can allocate funds to team members.") } as const;
  }
  return { user, company } as const;
}

/**
 * @swagger
 * /api/companies/{id}/allocate:
 *   post:
 *     summary: Move money from the company wallet into team members' personal wallets
 *     description: >
 *       mode EQUAL splits `amount` equally among every active team member; mode SPECIFIC pays each entry of
 *       `allocations` ({ userId, amount }). `requestId` makes the call safe to repeat. The company wallet is reduced
 *       and the personal wallets credited in one transaction, with a ledger row on both sides.
 *     security:
 *       - BearerAuth: []
 *   get:
 *     summary: Recent allocations made from the company wallet (audit trail)
 *     security:
 *       - BearerAuth: []
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadManagedCompany(request, id);
    if ("error" in loaded) return loaded.error;
    const { user, company } = loaded;

    const body = await request.json().catch(() => ({}));
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (requestId.length < 8 || requestId.length > 100 || requestId.includes(":")) {
      return NextResponse.json({ error: "A valid requestId is required." }, { status: 400 });
    }

    const plan = await planAllocation(id, { mode: body.mode, amount: body.amount, allocations: body.allocations });
    if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: plan.status });

    const result = await applyAllocation({ companyId: id, companyName: company.companyName, actorId: user.userId, requestId, lines: plan.lines, total: plan.total });
    if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });

    if (!result.duplicate) await notifyRecipients(company.companyName, result.lines);
    return NextResponse.json({
      message: result.duplicate ? "This allocation was already made." : "Funds allocated to the team.",
      duplicate: result.duplicate,
      balance: result.balance,
      total: result.total,
      recipients: result.lines.length,
      allocations: result.lines,
    }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    console.error("Error allocating company funds:", error);
    return NextResponse.json({ error: "Failed to allocate funds." }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadManagedCompany(request, id);
    if ("error" in loaded) return loaded.error;
    const rows = await prisma.companyWalletTransaction.findMany({
      where: { companyId: id, type: "ALLOCATION" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, amount: true, description: true, referenceId: true, createdAt: true },
    });
    return NextResponse.json(rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      employeeId: (r.referenceId ?? "").split(":")[2] ?? null,
      employeeName: (r.description ?? "").replace(/^Allocated to /, ""),
      createdAt: r.createdAt,
    })));
  } catch (error) {
    console.error("Error listing company allocations:", error);
    return NextResponse.json({ error: "Failed to load allocations." }, { status: 500 });
  }
}
