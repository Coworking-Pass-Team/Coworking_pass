/**
 * Password rules shown as a live checklist on sign-up and password reset. The server enforces the same rules
 * (backend/lib/auth/password-policy.ts); keep the two in step.
 */
export type PasswordRule = 'length' | 'lowercase' | 'uppercase' | 'number' | 'special' | 'noSequence';

export const PASSWORD_RULES: PasswordRule[] = ['length', 'lowercase', 'uppercase', 'number', 'special', 'noSequence'];

const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\|,.<>/?`~]/;

/** True when the text holds three letters or digits in a row that go up or down by one (case does not matter). */
export function hasSequentialRun(text: string): boolean {
  const s = text.toLowerCase();
  const isDigit = (x: number) => x >= 48 && x <= 57;
  const isLetter = (x: number) => x >= 97 && x <= 122;
  for (let i = 0; i + 2 < s.length; i++) {
    const a = s.charCodeAt(i);
    const b = s.charCodeAt(i + 1);
    const c = s.charCodeAt(i + 2);
    const sameKind = (isDigit(a) && isDigit(b) && isDigit(c)) || (isLetter(a) && isLetter(b) && isLetter(c));
    if (sameKind && ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1))) return true;
  }
  return false;
}

export function passwordRuleStatus(password: string): Record<PasswordRule, boolean> {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: SPECIAL.test(password),
    // An empty field has not met anything yet, so this rule stays red until the person starts typing
    noSequence: password.length > 0 && !hasSequentialRun(password),
  };
}

export function isPasswordValid(password: string): boolean {
  return Object.values(passwordRuleStatus(password)).every(Boolean);
}
