import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { forbiddenResponse } from "@/lib/ownership";
import { spendFromCompanyWallet } from "@/lib/company-spending";
import { ensureDatabaseSchema } from "@/lib/db-schema-sync";

const REFUSALS: Record<string, { status: number; error: string }> = {
  COMPANY_NOT_FOUND: { status: 404, error: "Company not found." },
  POLICY_DISABLED: { status: 403, error: "Your company has not allowed team members to pay from the company wallet." },
  LIMIT_EXCEEDED: { status: 400, error: "This is more than your remaining monthly company allowance." },
  INSUFFICIENT_BALANCE: { status: 400, error: "Insufficient company wallet balance." },
};

/**
 * @swagger
 * /api/companies/{id}/spend:
 *   post:
 *     summary: A team member pays a booking from the company wallet (needs the company's spending policy and monthly limit)
 *     security:
 *       - BearerAuth: []
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { id } = await params;

    // Only members of this company spend through here; HR admins keep using the withdraw endpoint
    const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { role: true, companyId: true } });
    if (!me || me.role !== "B2C" || me.companyId !== id) {
      return forbiddenResponse("Only members of this company can pay from the company wallet.");
    }

    const body = await request.json();
    const amount = body.amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount is required and must be greater than zero." }, { status: 400 });
    }
    const referenceId = typeof body.referenceId === "string" && body.referenceId ? body.referenceId.slice(0, 200) : null;
    const description = typeof body.description === "string" && body.description ? body.description.slice(0, 200) : "Team booking payment";

    await ensureDatabaseSchema().catch(() => undefined);
    const outcome = await prisma.$transaction((tx) => spendFromCompanyWallet(tx, { companyId: id, userId: user.userId, amount, referenceId, description }));
    if (!outcome.ok) {
      const refusal = REFUSALS[outcome.code];
      return NextResponse.json({ error: refusal.error, code: outcome.code, remaining: outcome.remaining }, { status: refusal.status });
    }
    return NextResponse.json({ message: "Payment taken from the company wallet.", balance: outcome.balance, duplicate: outcome.duplicate });
  } catch (error) {
    console.error("Error spending from the company wallet:", error);
    return NextResponse.json({ error: "Failed to pay from the company wallet." }, { status: 500 });
  }
}
