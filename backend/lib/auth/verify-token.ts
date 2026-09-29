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

// Requests rejected because the account is suspended, so the 401/403 response can carry the right code
const suspendedRequests = new WeakSet<Request>();

async function getUserState(userId: string): Promise<{ banned: boolean; exists: boolean }> {
  const cached = banCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true },
  });
  const state = { banned: !!row?.isBanned, exists: !!row, expires: Date.now() + BAN_CACHE_TTL_MS };
  banCache.set(userId, state);
  return state;
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

    const state = await getUserState(decoded.userId);
    if (!state.exists) {
      return null;
    }
    if (state.banned) {
      suspendedRequests.add(request);
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export const SUSPENDED_MESSAGE =
  "This account has been suspended by the platform administration. Please contact platform support.";

/** 403 response returned to blocked users; the frontend keys off `code` to show the suspension modal. */
export function suspendedResponse() {
  return NextResponse.json(
    { error: SUSPENDED_MESSAGE, code: "ACCOUNT_SUSPENDED" },
    { status: 403 }
  );
}

export function unauthorizedResponse(request?: Request) {
  if (request && suspendedRequests.has(request)) {
    return suspendedResponse();
  }
  return NextResponse.json(
    { error: "Unauthorized access. Please log in first." },
    { status: 401 }
  );
}
