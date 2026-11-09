/** Fail closed before signing or accepting any session. Never include secret values in errors. */
export function validateJwtSecret(value: string | undefined): string {
  if (!value || value.trim().length < 32 || /change[ _-]*me|secret|password|placeholder|replace[ _-]*me|example/i.test(value) || new Set(value).size < 8) {
    throw new Error("JWT_SECRET must be a unique random secret of at least 32 characters; defaults are forbidden.");
  }
  return value;
}
export const JWT_SECRET = validateJwtSecret(process.env.JWT_SECRET);
