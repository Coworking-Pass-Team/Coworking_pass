/**
 * Venue operating hours and fixed session slots for halls and theaters.
 * Times are stored as "HH:mm" (24h). Booking timestamps hold KSA wall-clock time in their UTC fields.
 */

export const FIXED_SLOT_MINUTES = 120;
export const SLOT_BUFFER_MINUTES = 60;
/** Fixed hall/theater sessions must end no later than 10:00 PM. */
export const LATEST_SESSION_END_MINUTES = 22 * 60;

export interface WorkspaceHours {
  openingTime?: string | null;
  closingTime?: string | null;
  is24Hours?: boolean | null;
}

export function hhmmToMinutes(value: string | null | undefined, fallback: number): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value || "").trim());
  if (!match) return fallback;
  const minutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  return minutes >= 0 && minutes <= 24 * 60 ? minutes : fallback;
}

export function isValidHhmm(value: unknown): value is string {
  return typeof value === "string" && /^([01]?\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export function getOperatingRange(ws: WorkspaceHours): { openMinutes: number; closeMinutes: number } {
  if (ws.is24Hours) return { openMinutes: 0, closeMinutes: 24 * 60 };
  return {
    openMinutes: hhmmToMinutes(ws.openingTime, 8 * 60),
    closeMinutes: hhmmToMinutes(ws.closingTime, 22 * 60),
  };
}

export function isFixedSlotSection(sectionType: string | null | undefined): boolean {
  return sectionType === "THEATER" || sectionType === "MEETING_ROOM";
}

/**
 * Validates an hourly booking window against the venue's operating hours and, for halls and theaters,
 * the fixed 2-hour session rule. Returns an error message, or null when the window is acceptable.
 */
export function validateHourlyWindow(params: {
  workspace: WorkspaceHours;
  sectionType: string | null | undefined;
  start: Date;
  end: Date;
}): string | null {
  const { workspace, sectionType, start, end } = params;
  const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
  const endMin = end.getUTCHours() * 60 + end.getUTCMinutes();
  const sameDay = start.getUTCFullYear() === end.getUTCFullYear()
    && start.getUTCMonth() === end.getUTCMonth()
    && start.getUTCDate() === end.getUTCDate();
  const effectiveEnd = sameDay ? endMin : endMin + 24 * 60;

  if (effectiveEnd <= startMin) return "Session end time must be after the start time.";

  const { openMinutes, closeMinutes } = getOperatingRange(workspace);
  // A 24-hour venue may host sessions that cross midnight
  const latestAllowedEnd = workspace.is24Hours ? 48 * 60 : closeMinutes;
  if (startMin < openMinutes || effectiveEnd > latestAllowedEnd) {
    return "The selected time is outside the venue's operating hours.";
  }

  if (isFixedSlotSection(sectionType)) {
    if (effectiveEnd - startMin !== FIXED_SLOT_MINUTES) {
      return "Halls and theaters can only be booked in fixed 2-hour sessions.";
    }
    if (effectiveEnd > LATEST_SESSION_END_MINUTES) {
      return "Sessions must end no later than 10:00 PM.";
    }
  }
  return null;
}
