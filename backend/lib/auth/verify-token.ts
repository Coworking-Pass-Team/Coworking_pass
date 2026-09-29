import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBlacklisted, isTokenBlacklisted } from "./token-blacklist";

interface TokenPayload {
  userId: string;
  role: string;
}

// Short-lived cache so the ban check does not hit the database on every request
const BAN_CACHE_TTL_MS = 10_000;
const banCache = new Map<string, { banned: boolean; exists: boolean; expires: number }>();

/** Drop the cached ban state for a user so a block/unblock takes effect immediately. */
export function invalidateBanCache(userId: string): void {
  banCache.delete(userId);
}

async function isUserAllowed(userId: string): Promise<boolean> {
  const cached = banCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.exists && !cached.banned;
  }

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true },
  });
  const state = { banned: !!row?.isBanned, exists: !!row, expires: Date.now() + BAN_CACHE_TTL_MS };
  banCache.set(userId, state);
  return state.exists && !state.banned;
}

/**
 * Verifies the bearer token and confirms against the database that the account
 * still exists and is not blocked, so suspensions survive server restarts.
 */
export async function getTokenFromRequest(request: Request): Promise<TokenPayload | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  if (isTokenBlacklisted(token)) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // Reject token if user is explicitly blacklisted (e.g. logged out)
    if (isBlacklisted(decoded.userId)) {
      return null;
    }

    if (!(await isUserAllowed(decoded.userId))) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized access. Please log in first." },
    { status: 401 }
  );
}
