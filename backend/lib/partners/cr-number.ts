/**
 * Saudi commercial registration numbers. Since the Commercial Registration Law took effect on 3 April 2025 every
 * establishment is identified by a 10-digit unified national number that starts with 7 (the "700 number").
 * Registrations issued before that keep their 10-digit number, whose first four digits are the issuing office
 * (1010 Riyadh, 4030 Jeddah, 2050 Dammam, 4650 Madinah, 5855 Khamis Mushait, ...), so both forms are accepted.
 */
const UNIFIED_OR_LEGACY_CR = /^(7\d{9}|[1-5]\d{9})$/;

/** Western digits only: Arabic-Indic and Persian digits are converted, spaces and dashes removed. */
export function normalizeCrNumber(raw: unknown): string {
  return String(raw ?? "")
    // U+0660..U+0669 and U+06F0..U+06F9 end in their digit value
    .replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf))
    .replace(/[\s-]/g, "");
}

export function isValidCrNumber(raw: unknown): boolean {
  return UNIFIED_OR_LEGACY_CR.test(normalizeCrNumber(raw));
}

export const CR_NUMBER_ERROR =
  "Enter the 10-digit unified number starting with 7 (e.g. 7001234567) or a 10-digit commercial registration number.";
