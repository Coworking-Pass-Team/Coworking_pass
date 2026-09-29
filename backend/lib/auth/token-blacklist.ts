// In-memory blacklist for invalidated tokens and user sessions
const blacklistedTokens = new Map<string, number>();
const blacklistedUsers = new Set<string>();

export function blacklistToken(token: string, expiryMs: number = 24 * 60 * 60 * 1000): void {
  blacklistedTokens.set(token, Date.now() + expiryMs);
}

export function isTokenBlacklisted(token: string): boolean {
  const exp = blacklistedTokens.get(token);
  if (!exp) return false;
  if (Date.now() > exp) {
    blacklistedTokens.delete(token);
    return false;
  }
  return true;
}

export function blacklistUser(userId: string): void {
  blacklistedUsers.add(userId);
}

export function removeFromBlacklist(userId: string): void {
  blacklistedUsers.delete(userId);
}

export function isBlacklisted(userId: string): boolean {
  return blacklistedUsers.has(userId);
}