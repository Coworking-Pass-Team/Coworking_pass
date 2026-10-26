'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import Modal from '@/components/ui/Modal';
import { getFixedSessionSlots } from '@/types';
import type { Space } from '@/types';
import { rescheduleDirectBookingApi, rescheduleHourlyBookingApi } from '@/services/api';

export interface RescheduleTarget {
  kind: 'hourly' | 'direct';
  bookingId: string;
  /** The workspace, when it is in the loaded catalogue (gives opening hours and the rooms of the venue) */
  space?: Space;
  /** Current room (section) of the booking */
  sectionId?: string;
  /** Room type of the booking: only rooms of the same type are offered */
  sectionType?: string;
  /** Where the booking is now, for the dialog text, e.g. "2026-11-03 · 10:00 AM – 12:00 PM" */
  currentLabel: string;
  /** Hourly sessions keep their length; used to pick matching sessions */
  durationHours?: number;
}

interface Props {
  target: RescheduleTarget | null;
  onClose: () => void;
  /** Called after the server accepted the move, so the lists can reload */
  onMoved: () => void;
}

const todayKsa = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);

/**
 * Lets the booking owner move a booking once, for free. The server enforces the notice window, capacity, the
 * 30-day horizon and settles any price difference on the wallet that paid; this dialog only collects the new slot.
 */
export default function RescheduleModal({ target, onClose, onMoved }: Props) {
  const { t, translateMessage } = useI18n();
  const st = useSpaceText();
  const { showToast } = useApp();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [roomId, setRoomId] = useState('');
  const [saving, setSaving] = useState(false);

  const rooms = useMemo(
    () => (target?.space?.units ?? []).filter((u) => !target?.sectionType || !u.type || String(u.type).toUpperCase() === target.sectionType.toUpperCase()),
    [target]
  );
  const slots = useMemo(
    () => (target?.kind === 'hourly' && date ? getFixedSessionSlots(target.space?.openHours, date) : []),
    [target, date]
  );

  if (!target) return null;
  const hourly = target.kind === 'hourly';
  const canSubmit = !!date && (!hourly || !!slot) && !saving;

  const submit = async () => {
    setSaving(true);
    const sectionId = roomId && roomId !== target.sectionId ? roomId : undefined;
    const res = hourly
      ? await rescheduleHourlyBookingApi(target.bookingId, { startDate: date, startTime: slot, sectionId })
      : await rescheduleDirectBookingApi(target.bookingId, { bookingDate: date, sectionId });
    setSaving(false);
    if (!res.success) {
      const reason = res.code === 'RESCHEDULE_WINDOW' && res.requiredHours
        ? t('reschedule.errWindow', { hours: res.requiredHours })
        : translateMessage(res.error ?? '');
      showToast(reason, 'error');
      return;
    }
    const diff = res.priceDifference ?? 0;
    showToast(
      diff > 0
        ? t('reschedule.doneCharged', { currency: t('common.sar'), amount: diff.toLocaleString() })
        : diff < 0
          ? t('reschedule.doneRefunded', { currency: t('common.sar'), amount: Math.abs(diff).toLocaleString() })
          : t('reschedule.done'),
      'success'
    );
    setDate('');
    setSlot('');
    setRoomId('');
    onMoved();
    onClose();
  };

  const close = () => {
    setDate('');
    setSlot('');
    setRoomId('');
    onClose();
  };

  return (
    <Modal
      open
      onClose={close}
      title={t('reschedule.title')}
      size="md"
      footer={
        <>
          <button type="button" onClick={close} className="btn-secondary">{t('common.cancel')}</button>
          <button type="button" onClick={submit} disabled={!canSubmit} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <CalendarClock size={15} />}
            {t('reschedule.confirm')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-xs text-moss bg-soot/5 border border-soot/10 rounded-xl px-3.5 py-2.5">
          <span className="font-semibold text-soot">{t('reschedule.current')}</span> {target.currentLabel}
        </div>

        <div>
          <label htmlFor="reschedule-date" className="block text-xs font-semibold text-moss mb-1">{t('reschedule.newDate')}</label>
          <input
            id="reschedule-date"
            type="date"
            min={todayKsa()}
            value={date}
            onChange={(e) => { setDate(e.target.value); setSlot(''); }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
          />
        </div>

        {hourly && (
          <div>
            <label htmlFor="reschedule-slot" className="block text-xs font-semibold text-moss mb-1">{t('reschedule.newSession')}</label>
            <select
              id="reschedule-slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              disabled={!date}
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm outline-none focus:border-eucalyptus disabled:opacity-50"
            >
              <option value="">{date ? t('reschedule.pickSession') : t('reschedule.pickDateFirst')}</option>
              {slots.map((sl) => (
                <option key={sl.start} value={sl.start}>{sl.start} – {sl.end}</option>
              ))}
            </select>
          </div>
        )}

        {rooms.length > 1 && (
          <div>
            <label htmlFor="reschedule-room" className="block text-xs font-semibold text-moss mb-1">{t('reschedule.room')}</label>
            <select
              id="reschedule-room"
              value={roomId || target.sectionId || ''}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{st.roomName(r)}</option>
              ))}
            </select>
          </div>
        )}

        <ul className="text-[11px] text-moss space-y-1 list-disc ps-5 leading-relaxed">
          <li>{t('reschedule.ruleOnce')}</li>
          <li>{t('reschedule.ruleNotice')}</li>
          <li>{t('reschedule.rulePrice')}</li>
        </ul>
      </div>
    </Modal>
  );
}
