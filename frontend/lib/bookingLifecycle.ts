import type { Booking } from '@/types/types';

export type BookingSortOrder = 'newest' | 'oldest';

/** Saudi wall-clock "now", as UTC fields (the same convention the bookings are stored in). */
const ksaNow = () => new Date(Date.now() + 3 * 3600 * 1000);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Reads "14:30", "2:30 PM" or "02:30 م" into hours and minutes. */
function parseClock(value?: string): { h: number; m: number } | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|ص|م)?$/i);
  if (!match) return null;
  let h = Number(match[1]);
  const m = Number(match[2]);
  const marker = (match[3] || '').toUpperCase();
  if ((marker === 'PM' || marker === 'م') && h < 12) h += 12;
  if ((marker === 'AM' || marker === 'ص') && h === 12) h = 0;
  return { h, m };
}

/**
 * True once a booking's scheduled time has passed, whatever status it was saved with:
 * hourly sessions end at their end time, daily passes after their last day, and monthly / yearly
 * passes on the day their term ends.
 */
export function isBookingEnded(b: Pick<Booking, 'plan' | 'startDate' | 'endDate' | 'endTime'>, now: Date = ksaNow()): boolean {
  const today = isoDay(now);
  const endDay = (b.endDate || b.startDate || '').slice(0, 10);
  if (!endDay) return false;
  if (b.plan === 'hourly') {
    const clock = parseClock(b.endTime);
    const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes();
    if (endDay < today) return true;
    return endDay === today && clock !== null && clock.h * 60 + clock.m <= minutesNow;
  }
  if (b.plan === 'daily') return endDay < today;
  return endDay <= today; // monthly / yearly: the end date is the first day after the term
}

/** An active booking whose time has passed is shown as completed ("previous"); cancelled ones stay cancelled. */
export function withLifecycleStatus<T extends Booking>(b: T, now?: Date): T {
  return b.status === 'active' && isBookingEnded(b, now) ? { ...b, status: 'previous' } : b;
}

/** Hourly bookings from the API: ACTIVE becomes EXPIRED once the session end has passed. */
export function hourlyEffectiveStatus(hb: { status: string; endDate?: string }, now: Date = ksaNow()): string {
  if (hb.status !== 'ACTIVE' || !hb.endDate) return hb.status;
  const end = new Date(hb.endDate);
  return !isNaN(end.getTime()) && end.getTime() <= now.getTime() ? 'EXPIRED' : hb.status;
}

/** When the booking happens (start date and time), used to order lists chronologically. */
export function bookingMoment(b: { startDate?: string; startTime?: string; createdAt?: string }): number {
  // Full timestamps (hourly bookings from the API) keep their time of day; plain dates start at midnight
  if (b.startDate && b.startDate.includes('T') && !isNaN(Date.parse(b.startDate))) return Date.parse(b.startDate);
  const day = Date.parse(`${(b.startDate || '').slice(0, 10)}T00:00:00Z`);
  if (isNaN(day)) {
    const created = Date.parse(b.createdAt || '');
    return isNaN(created) ? 0 : created;
  }
  const clock = parseClock(b.startTime);
  return day + (clock ? (clock.h * 60 + clock.m) * 60000 : 0);
}

/** Newest first by default; the creation time breaks ties between bookings on the same moment. */
export function sortBookings<T extends { startDate?: string; startTime?: string; createdAt?: string }>(list: T[], order: BookingSortOrder = 'newest'): T[] {
  const sign = order === 'newest' ? -1 : 1;
  return [...list].sort((a, b) => {
    const diff = bookingMoment(a) - bookingMoment(b);
    if (diff !== 0) return sign * diff;
    return sign * ((Date.parse(a.createdAt || '') || 0) - (Date.parse(b.createdAt || '') || 0));
  });
}
