'use client';

import { RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';

/**
 * A small floating note while the API is waking up or unreachable: the curated spaces stay on screen and the
 * live catalogue replaces them as soon as a background retry gets through. Nothing is shown otherwise.
 */
export default function ReconnectingBadge() {
  const { t } = useI18n();
  const { spacesStatus } = useApp();
  if (spacesStatus !== 'fallback') return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="reconnecting-badge"
      className="fixed bottom-5 start-5 z-40 ui-glass rounded-full ps-3 pe-4 py-2 shadow-md flex items-center gap-2 text-xs text-soot animate-[reveal_0.35s_ease-out_both]"
    >
      <RefreshCw size={13} className="text-emerald-700 animate-spin" style={{ animationDuration: '2.4s' }} aria-hidden="true" />
      <span>{t('common.reconnecting')}</span>
    </div>
  );
}
