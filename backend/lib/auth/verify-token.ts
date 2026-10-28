import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTokenRevoked, issuedBeforeRevocation, type SessionClaims } from "./sessions";

type TokenPayload = SessionClaims;

// Short-lived cache so the ban and session checks do not hit the database on every request
const BAN_CACHE_TTL_MS = 10_000;
type UserState = { banned: boolean; exists: boolean; sessionsRevokedAt: Date | null };
const banCache = new Map<string, UserState & { expires: number }>();

/** Drop the cached account state (ban, ended sessions) so a change takes effect immediately on this instance. */
export function invalidateBanCache(userId: string): void {
  banCache.delete(userId);
}

// Requests rejected because the account is suspended, so the 401/403 response can carry the right code
const suspendedRequests = new WeakSet<Request>();

async function getUserState(userId: string): Promise<UserState> {
  const cached = banCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, sessionsRevokedAt: true },
  });
  const state = { banned: !!row?.isBanned, exists: !!row, sessionsRevokedAt: row?.sessionsRevokedAt ?? null, expires: Date.now() + BAN_CACHE_TTL_MS };
  banCache.set(userId, state);
  return state;
}

/**
 * Verifies the bearer token and confirms against the database that it was not signed out, that the account
 * still exists and is not blocked, and that its sessions were not ended after the token was issued. All of this
 * lives in the database, so it holds on every server instance and survives restarts.
 */
export async function getTokenFromRequest(request: Request): Promise<TokenPayload | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const [state, revoked] = await Promise.all([getUserState(decoded.userId), isTokenRevoked(token)]);
    // A suspended account is reported as such (403 ACCOUNT_SUSPENDED) even if its sessions were also revoked
    if (state.exists && state.banned) {
      suspendedRequests.add(request);
      return null;
    }

    // Signed out, or issued before a password reset or suspension ended every session
    if (revoked || issuedBeforeRevocation(decoded, state.sessionsRevokedAt)) {
      return null;
    }

    if (!state.exists) {
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
