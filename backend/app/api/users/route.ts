import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

// GET /api/users — List all registered users (for Super Admin dashboard sync)
export async function GET(request: Request) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") return unauthorizedResponse();

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        emailVerified: true,
        isBanned: true,
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("[GET /api/users Error]:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}