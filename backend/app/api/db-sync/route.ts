import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "@/lib/db-schema-sync";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const syncResult = await ensureDatabaseSchema(true);

    const admin = await prisma.user.findFirst({
      where: { email: "admin@coworkingpass.sa" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isBanned: true,
      },
    });

    const partnerCount = await prisma.partner.count().catch(() => -1);
    const userCount = await prisma.user.count().catch(() => -1);

    return NextResponse.json({
      success: syncResult.success,
      message: syncResult.message,
      adminUser: admin,
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
        error: error?.message || "Failed to synchronize database.",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
