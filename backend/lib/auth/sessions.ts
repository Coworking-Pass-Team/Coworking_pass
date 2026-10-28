import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

/**
 * Signed-out tokens and "end every session" events are kept in the database, so every server instance (each
 * Vercel function has its own memory) rejects them immediately. Tokens are stored only as SHA-256 hashes.
 */
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Claims of a session token: who, and when it was signed (milliseconds; `iat` alone has one-second precision). */
export interface SessionClaims {
  userId: string;
  role: string;
  issuedAtMs?: number;
  iat?: number;
}

/** Signs a new session token. A random token id makes every sign-in unique, even two in the same second. */
export function signSessionToken(user: { id: string; role: string }): string {
  return jwt.sign({ userId: user.id, role: user.role, issuedAtMs: Date.now() }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
    jwtid: crypto.randomUUID(),
  });
}

/** Signs one token out. Only genuine, unexpired tokens are stored, and only until they would have expired anyway. */
export async function revokeToken(token: string): Promise<boolean> {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  } catch {
    return false;
  }
  const expiresAt = new Date((payload.exp ?? Math.floor(Date.now() / 1000) + 24 * 3600) * 1000);
  const tokenHash = hashToken(token);
  await prisma.revokedToken.upsert({ where: { tokenHash }, create: { tokenHash, expiresAt }, update: {} });
  // Rows of tokens that have expired by now protect nothing any more
  await prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined);
  return true;
}

export async function isTokenRevoked(token: string): Promise<boolean> {
  const row = await prisma.revokedToken.findUnique({ where: { tokenHash: hashToken(token) }, select: { tokenHash: true } });
  return !!row;
}

/** User data that ends every session issued so far (password reset, suspension). */
export function endAllSessions(): { sessionsRevokedAt: Date } {
  return { sessionsRevokedAt: new Date() };
}

/** True when the token was signed before the account's sessions were ended. */
export function issuedBeforeRevocation(claims: Pick<SessionClaims, "issuedAtMs" | "iat">, sessionsRevokedAt: Date | null): boolean {
  if (!sessionsRevokedAt) return false;
  const issued = typeof claims.issuedAtMs === "number" ? claims.issuedAtMs : typeof claims.iat === "number" ? claims.iat * 1000 : null;
  if (issued === null) return true;
  return issued < sessionsRevokedAt.getTime();
}
