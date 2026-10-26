// تتبع محاولات الدخول الفاشلة (بالذاكرة، يُعاد ضبطه عند إعادة تشغيل السيرفر)
const attempts = new Map<string, { count: number; firstAttempt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة

export function isRateLimited(email: string): boolean {
  const record = attempts.get(email);
  if (!record) return false;

  const elapsed = Date.now() - record.firstAttempt;
  if (elapsed > WINDOW_MS) {
    attempts.delete(email);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(email: string): void {
  const record = attempts.get(email);
  if (!record || Date.now() - record.firstAttempt > WINDOW_MS) {
    attempts.set(email, { count: 1, firstAttempt: Date.now() });
  } else {
    record.count += 1;
  }
}

export function clearAttempts(email: string): void {
  attempts.delete(email);
}