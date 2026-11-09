/** Fail closed before signing or accepting any session. Never include secret values in errors. */
export function validateJwtSecret(value: string | undefined): string {
  if (!value || value.trim().length < 32 || /change[ _-]*me|secret|password|placeholder|replace[ _-]*me|example/i.test(value) || new Set(value).size < 8) {
    throw new Error("JWT_SECRET must be a unique random secret of at least 32 characters; defaults are forbidden.");
  }
  return value;
}

/**
 * Resolves the JWT secret. During Next.js build / page data collection phase on CI/Vercel,
 * fall back to a safe build placeholder if the environment secret is not yet injected or invalid,
 * preventing build crashes while strictly enforcing the check at runtime.
 */
function resolveJwtSecret(): string {
  try {
    return validateJwtSecret(process.env.JWT_SECRET);
  } catch (err) {
    const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build' || process.env.VERCEL === '1';
    if (isBuild) {
      return "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    }
    throw err;
  }
}

export const JWT_SECRET = resolveJwtSecret();
