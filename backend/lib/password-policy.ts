/**
 * Password security policy, enforced on sign-up and password reset. The browser shows the same rules as a live
 * checklist (frontend/lib/passwordPolicy.ts); keep the two in step.
 *
 * - at least 8 characters
 * - a lowercase letter, an uppercase letter, a number and a special character
 * - no sequential characters: three letters or digits in a row, going up or down, such as 123, 987, abc or cba
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRule = "length" | "lowercase" | "uppercase" | "number" | "special" | "noSequence";

const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\|,.<>/?`~]/;

/** True when the text holds three letters or digits in a row that go up or down by one (case does not matter). */
export function hasSequentialRun(text: string): boolean {
  const s = text.toLowerCase();
  for (let i = 0; i + 2 < s.length; i++) {
    const [a, b, c] = [s.charCodeAt(i), s.charCodeAt(i + 1), s.charCodeAt(i + 2)];
    const isDigit = (x: number) => x >= 48 && x <= 57;
    const isLetter = (x: number) => x >= 97 && x <= 122;
    const sameKind = (isDigit(a) && isDigit(b) && isDigit(c)) || (isLetter(a) && isLetter(b) && isLetter(c));
    if (!sameKind) continue;
    if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) return true;
  }
  return false;
}

/** The rules a password does not meet (empty when it is acceptable). */
export function failedPasswordRules(password: string): PasswordRule[] {
  const failed: PasswordRule[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) failed.push("length");
  if (!/[a-z]/.test(password)) failed.push("lowercase");
  if (!/[A-Z]/.test(password)) failed.push("uppercase");
  if (!/[0-9]/.test(password)) failed.push("number");
  if (!SPECIAL.test(password)) failed.push("special");
  if (hasSequentialRun(password)) failed.push("noSequence");
  return failed;
}

export const WEAK_PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number and a special character, with no sequential characters such as 123 or abc.";

/** Null when the password is acceptable, otherwise the body for a 400 response. */
export function passwordPolicyError(password: unknown): { error: string; code: "WEAK_PASSWORD"; failed: PasswordRule[] } | null {
  if (typeof password !== "string") return { error: WEAK_PASSWORD_MESSAGE, code: "WEAK_PASSWORD", failed: ["length"] };
  if (password.length > PASSWORD_MAX_LENGTH) return { error: "Password is too long.", code: "WEAK_PASSWORD", failed: [] };
  const failed = failedPasswordRules(password);
  return failed.length > 0 ? { error: WEAK_PASSWORD_MESSAGE, code: "WEAK_PASSWORD", failed } : null;
}
