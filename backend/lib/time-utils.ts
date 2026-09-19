/**
 * Time and Timezone Utilities for Saudi Arabia (Asia/Riyadh, UTC+3)
 * Ensures accurate wall-clock timestamps in PostgreSQL and preserves booked hours.
 */

export function getKsaNow(): Date {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}

export function parseTimeString(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const cleanStr = timeStr.trim().toUpperCase();
  const isPM = cleanStr.includes('PM');
  const isAM = cleanStr.includes('AM');
  const timeOnly = cleanStr.replace(/[^\d:]/g, '');
  const parts = timeOnly.split(':');
  if (parts.length === 0 || !parts[0]) return null;

  let hours = parseInt(parts[0], 10);
  if (isNaN(hours)) return null;

  const minutes = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return { hours, minutes };
}

export function parseDateAndTimeToKsaDate(
  dateInput?: string | Date | null,
  timeStr?: string | null,
  defaultHour: number = 9
): Date {
  if (!dateInput) {
    const now = getKsaNow();
    now.setUTCHours(defaultHour, 0, 0, 0);
    return now;
  }

  let year: number;
  let month: number;
  let day: number;
  let existingHours = defaultHour;
  let existingMinutes = 0;

  if (dateInput instanceof Date) {
    year = dateInput.getUTCFullYear();
    month = dateInput.getUTCMonth() + 1;
    day = dateInput.getUTCDate();
    existingHours = dateInput.getUTCHours();
    existingMinutes = dateInput.getUTCMinutes();
  } else {
    const raw = String(dateInput).trim();
    if (raw.includes('T')) {
      const parsedDate = new Date(raw);
      if (!isNaN(parsedDate.getTime())) {
        year = parsedDate.getUTCFullYear();
        month = parsedDate.getUTCMonth() + 1;
        day = parsedDate.getUTCDate();
        existingHours = parsedDate.getUTCHours();
        existingMinutes = parsedDate.getUTCMinutes();
      } else {
        const parts = raw.split('T')[0].split('-').map(Number);
        year = parts[0] || new Date().getFullYear();
        month = parts[1] || (new Date().getMonth() + 1);
        day = parts[2] || new Date().getDate();
      }
    } else {
      const parts = raw.split('-').map(Number);
      year = parts[0] || new Date().getFullYear();
      month = parts[1] || (new Date().getMonth() + 1);
      day = parts[2] || new Date().getDate();
    }
  }

  let finalHours = existingHours;
  let finalMinutes = existingMinutes;

  if (timeStr) {
    const parsedTime = parseTimeString(timeStr);
    if (parsedTime) {
      finalHours = parsedTime.hours;
      finalMinutes = parsedTime.minutes;
    }
  } else if (finalHours === 0 && finalMinutes === 0) {
    finalHours = defaultHour;
    finalMinutes = 0;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = `${year}-${pad(month)}-${pad(day)}T${pad(finalHours)}:${pad(finalMinutes)}:00.000Z`;
  return new Date(iso);
}
