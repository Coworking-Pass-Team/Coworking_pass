import type { Lang } from '@/i18n';

/**
 * "just now" / "5 minutes ago" / "منذ 5 دقائق" for recent timestamps, then a date with the time.
 * Values that are not real timestamps (entries saved as plain text by older versions) are returned through `fallback`.
 */
export function formatRelativeTime(
  value: string,
  lang: Lang,
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string,
  fallback: (text: string) => string = (text) => text
): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return fallback(value);
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en', { numeric: 'auto' });
  if (seconds < 60) return rtf.format(0, 'second');
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour');
  if (seconds < 7 * 86400) return rtf.format(-Math.floor(seconds / 86400), 'day');
  return formatDate(date, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
