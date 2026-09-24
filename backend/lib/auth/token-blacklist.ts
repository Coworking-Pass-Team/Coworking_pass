// قائمة المستخدمين المحظورين حالياً (بالذاكرة)
const blacklistedUsers = new Set<string>();

export function blacklistUser(userId: string): void {
  blacklistedUsers.add(userId);
}

export function removeFromBlacklist(userId: string): void {
  blacklistedUsers.delete(userId);
}

export function isBlacklisted(userId: string): boolean {
  return blacklistedUsers.has(userId);
}