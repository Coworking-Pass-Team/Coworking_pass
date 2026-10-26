'use client';

import { useState } from 'react';
import { Ban, Trash2, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import Modal from '@/components/ui/Modal';

export interface BulkAction {
  key: string;
  /** Text of the button in the bar */
  label: string;
  kind: 'cancel' | 'delete';
  /** Runs once the user confirms; receives how many bookings are affected */
  run: () => Promise<void> | void;
}

/**
 * Appears while rows are selected: shows how many, and offers the bulk actions. Every action goes through one
 * confirmation dialog that names the number of bookings before anything is changed.
 */
export default function BulkActionBar({ count, actions, onClear }: { count: number; actions: BulkAction[]; onClear: () => void }) {
  const { t } = useI18n();
  const [pending, setPending] = useState<BulkAction | null>(null);
  const [busy, setBusy] = useState(false);

  if (count === 0 && !pending) return null;

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await pending.run();
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <>
      {count > 0 && (
        <div role="region" aria-label={t('bookingsList.bulkBar')} className="flex flex-wrap items-center gap-3 rounded-2xl border border-soot/15 bg-white px-4 py-3 shadow-xs">
          <span className="text-sm font-semibold text-soot">{t('bookingsList.selectedCount', { count })}</span>
          <div className="flex flex-wrap items-center gap-2 ms-auto">
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setPending(a)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  a.kind === 'delete' ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {a.kind === 'delete' ? <Trash2 size={14} /> : <Ban size={14} />}
                {a.label}
              </button>
            ))}
            <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-moss hover:text-soot hover:bg-soot/5 cursor-pointer">
              <X size={14} />
              {t('bookingsList.clearSelection')}
            </button>
          </div>
        </div>
      )}

      <Modal
        open={!!pending}
        onClose={() => !busy && setPending(null)}
        title={pending ? (pending.kind === 'delete' ? t('bookingsList.bulkDeleteTitle') : t('bookingsList.bulkCancelTitle')) : ''}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => setPending(null)} className="px-4 py-2 rounded-xl border border-soot/15 text-sm font-medium text-soot hover:bg-soot/5 cursor-pointer disabled:opacity-50">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={confirm}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60 ${pending?.kind === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {busy ? t('bookingsList.working') : t('bookingsList.confirmCount', { count })}
            </button>
          </div>
        }
      >
        <p className="text-sm text-moss leading-relaxed">
          {pending?.kind === 'delete' ? t('bookingsList.bulkDeleteBody', { count }) : t('bookingsList.bulkCancelBody', { count })}
        </p>
      </Modal>
    </>
  );
}
