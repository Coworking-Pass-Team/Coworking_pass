export function adminPasswordError(password: unknown): string | null {
  return typeof password !== "string" || password.length < 12 || Buffer.byteLength(password, "utf8") > 72 ||
    !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password)
    ? "Super Admin passwords require 12–72 bytes with uppercase, lowercase, numbers and symbols."
    : null;
}
