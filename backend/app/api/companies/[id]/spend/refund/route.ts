import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { forbiddenResponse } from "@/lib/ownership";
import { returnToCompanyWallet } from "@/lib/company-spending";

/**
 * @swagger
 * /api/companies/{id}/spend/refund:
 *   post:
 *     summary: Undo a member's company-wallet payment (a booking that could not be confirmed); returns exactly what that payment took, once
 *     security:
 *       - BearerAuth: []
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { id } = await params;

    const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { role: true, companyId: true } });
    if (!me || me.role !== "B2C" || me.companyId !== id) {
      return forbiddenResponse("Only members of this company can use the company wallet.");
    }

    const body = await request.json();
    const referenceId = typeof body.referenceId === "string" ? body.referenceId.slice(0, 200) : "";
    if (!referenceId) return NextResponse.json({ error: "referenceId is required." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"spend:" + id + ":" + user.userId}))`;
      const spent = await tx.companyWalletTransaction.findFirst({ where: { companyId: id, userId: user.userId, type: "WITHDRAW", referenceId } });
      if (!spent) return { error: "No company-wallet payment with this reference was found.", status: 404 as const };
      const refundRef = `${referenceId}:refund`;
      const already = await tx.companyWalletTransaction.findFirst({ where: { companyId: id, userId: user.userId, type: "REFUND", referenceId: refundRef } });
      if (already) return { balance: already.balanceAfter, amount: already.amount, duplicate: true as const };
      const back = await returnToCompanyWallet(tx, { companyId: id, userId: user.userId, amount: spent.amount, referenceId: refundRef, description: "Refund: payment could not be completed" });
      return { balance: back.balance, amount: spent.amount, duplicate: false as const };
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ message: "Returned to the company wallet.", balance: result.balance, amount: result.amount, duplicate: result.duplicate });
  } catch (error) {
    console.error("Error returning a company-wallet payment:", error);
    return NextResponse.json({ error: "Failed to return the payment to the company wallet." }, { status: 500 });
  }
}
