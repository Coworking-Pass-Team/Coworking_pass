import { NextResponse } from "next/server";
import { unauthorizedResponse } from "@/lib/auth/verify-token";
import { revokeToken } from "@/lib/auth/sessions";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Sign out and invalidate the current token (other devices stay signed in)
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

  // Also works for a suspended account's token, so signing out never fails
  await revokeToken(authHeader.split(" ")[1]);

  return NextResponse.json({ message: "Signed out successfully." });
}
