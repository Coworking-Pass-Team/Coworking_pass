/** The three kinds of workspace on the platform. */
export const SPACE_TYPES = ["theater", "meeting-room", "private-office"] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];

/**
 * Maps any stored or client-sent value (hot-desk, event-hall, auditorium ...) onto one of the three space types:
 * theaters and auditoriums are theaters, halls and meeting spaces are meeting rooms, everything else is a private office.
 * Keep in step with normalizeSpaceType in frontend/types/index.ts and the SQL of the standardization migration.
 */
export function normalizeSpaceType(raw: unknown): SpaceType {
  const t = String(raw ?? "").toLowerCase().trim();
  if (!t) return "private-office";
  if (t.includes("theater") || t.includes("theatre") || t.includes("auditorium")) return "theater";
  if (/(hall|meeting|room|majlis|conference|training|workshop|event|lecture)/.test(t) && !t.includes("office")) return "meeting-room";
  return "private-office";
}
