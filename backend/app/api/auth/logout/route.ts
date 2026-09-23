import { NextResponse } from "next/server";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { blacklistUser } from "@/lib/auth/token-blacklist";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: تسجيل الخروج (يلغي التوكن الحالي فوراً)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم تسجيل الخروج بنجاح
 */
export async function POST(request: Request) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse();

  blacklistUser(user.userId);

  return NextResponse.json({ message: "تم تسجيل الخروج بنجاح" });
}