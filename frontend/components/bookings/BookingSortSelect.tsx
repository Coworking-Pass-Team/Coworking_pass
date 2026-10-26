'use client';

import { ArrowDownWideNarrow, ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { BookingSortOrder } from '@/lib/booking-lifecycle';

/** "Newest first / Oldest first" control shown above every bookings list. */
export default function BookingSortSelect({ value, onChange }: { value: BookingSortOrder; onChange: (order: BookingSortOrder) => void }) {
  const { t } = useI18n();
  return (
    <label className="relative inline-flex items-center min-w-44">
      <span className="sr-only">{t('bookingsList.sortBy')}</span>
      <ArrowDownWideNarrow size={15} className="absolute start-3.5 text-moss pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BookingSortOrder)}
        aria-label={t('bookingsList.sortBy')}
        className="w-full appearance-none ps-10 pe-9 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-colors text-sm font-medium text-soot cursor-pointer focus:outline-none focus:border-soot/40"
      >
        <option value="newest">{t('bookingsList.newestFirst')}</option>
        <option value="oldest">{t('bookingsList.oldestFirst')}</option>
      </select>
      <ChevronDown size={15} className="absolute end-3.5 text-moss pointer-events-none" />
    </label>
  );
}
