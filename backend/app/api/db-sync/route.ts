import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "@/lib/db-schema-sync";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") return unauthorizedResponse();

  try {
    const syncResult = await ensureDatabaseSchema(true);

    const partnerCount = await prisma.partner.count().catch(() => -1);
    const userCount = await prisma.user.count().catch(() => -1);

    return NextResponse.json({
      success: syncResult.success,
      message: syncResult.message,
      counts: {
        users: userCount,
        partners: partnerCount,
      },
      details: syncResult.details,
    });
  } catch (error: any) {
    console.error("[GET /api/db-sync Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to synchronize database.",
      },
      { status: 500 }
    );
  }
}