import { NextResponse } from "next/server";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { blacklistToken, blacklistUser } from "@/lib/auth/token-blacklist";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Sign out and invalidate current token
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Signed out successfully
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorizedResponse(request);
  }

  const token = authHeader.split(" ")[1];
  blacklistToken(token);

  const user = await getTokenFromRequest(request);
  if (user) {
    blacklistUser(user.userId);
  }

  return NextResponse.json({ message: "Signed out successfully." });
}