import { directBookingEnd } from "@/lib/capacity";
import { getKsaNow } from "@/lib/time-utils";

/**
 * The status a booking should be shown with right now. Stored statuses are left alone (revenue reports and
 * capacity counts rely on them), so a booking whose time has passed is reported as COMPLETED / EXPIRED here.
 */
export function directBookingEffectiveStatus(
  b: { status: string; bookingDate: Date; durationType: string; durationDetails: string | null },
  now: Date = getKsaNow()
): string {
  if (b.status !== "CONFIRMED") return b.status;
  return directBookingEnd(b).getTime() <= now.getTime() ? "COMPLETED" : b.status;
}

export function hourlyBookingEffectiveStatus(b: { status: string; endDate: Date }, now: Date = getKsaNow()): string {
  if (b.status !== "ACTIVE") return b.status;
  return b.endDate.getTime() <= now.getTime() ? "EXPIRED" : b.status;
}
