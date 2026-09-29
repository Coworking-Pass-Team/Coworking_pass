'use client';

import { useI18n } from '@/i18n';

/**
 * Display labels for stored enum-like values (booking status, plan, account role).
 * The stored values stay English; only what is shown changes. Unknown values are shown as-is.
 */
export function useLabels() {
  const { t } = useI18n();

  const lookup = (prefix: string, value?: string | null) => {
    if (!value) return '';
    const key = `${prefix}.${String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const translated = t(key as never);
    return translated === key ? String(value) : translated;
  };

  return {
    status: (value?: string | null) => lookup('booking.status', value),
    plan: (value?: string | null) => lookup('booking.plan', value),
    role: (value?: string | null) => lookup('role', value),
    payment: (value?: string | null) => lookup('payment.status', value),
  };
}
