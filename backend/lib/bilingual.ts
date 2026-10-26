/**
 * Bilingual workspace content is authored by providers/admins in both languages and stored as-is
 * (never machine-translated). These helpers normalize the optional text fields.
 */
export const BILINGUAL_FIELDS = ["nameAr", "description", "descriptionAr", "address", "addressAr", "cityAr"] as const;

const MAX_LENGTH: Record<(typeof BILINGUAL_FIELDS)[number], number> = {
  nameAr: 200,
  description: 4000,
  descriptionAr: 4000,
  address: 500,
  addressAr: 500,
  cityAr: 100,
};

/** Picks the bilingual fields present in the body: trimmed strings, empty strings become null. */
export function pickBilingualFields(body: Record<string, unknown>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const key of BILINGUAL_FIELDS) {
    const value = body[key];
    if (value === undefined) continue;
    if (value === null) {
      out[key] = null;
      continue;
    }
    if (typeof value !== "string") continue;
    const trimmed = value.trim().slice(0, MAX_LENGTH[key]);
    out[key] = trimmed === "" ? null : trimmed;
  }
  return out;
}
