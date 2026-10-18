type Translate = (key: never, params?: Record<string, string | number>) => string;

/** "1 Month", "2 Months", "6 Months" / "شهر واحد", "شهران", "6 أشهر", "12 شهرًا": the plural form follows Arabic grammar. */
export function durationLabel(t: Translate, unit: 'hour' | 'month', n: number): string {
  const base = unit === 'hour' ? 'common.duration.hour' : 'common.duration.month';
  const form = n === 1 ? 'one' : n === 2 ? 'two' : n >= 3 && n <= 10 ? 'few' : 'many';
  return t(`${base}.${form}` as never, { count: n });
}
