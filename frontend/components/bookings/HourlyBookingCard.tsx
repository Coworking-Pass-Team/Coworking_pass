'use client';

import React from 'react';
import { Building2, Calendar, CalendarClock, Clock, MapPin, QrCode, Users, Wallet } from 'lucide-react';
import { useI18n } from '@/i18n';
import { durationLabel } from '@/i18n/duration';
import { useSpaceText } from '@/i18n/space-text';
import type { Space } from '@/types';
import type { HourlyBookingItemApi } from '@/services/api';

const FALLBACK_SPACE_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-white/95 text-soot border-soot/20',
  EXPIRED: 'bg-white/95 text-soot border-soot/20',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
  REFUNDED: 'bg-amber-100 text-amber-800 border-amber-200',
};

interface Props {
  booking: HourlyBookingItemApi;
  /** The workspace this booking belongs to, when it is in the loaded catalogue (gives the Arabic name and photo). */
  space?: Space;
  onViewQr: () => void;
  onCancel: () => void;
  /** Shown only when the booking can still be moved (owner, not started, free reschedule left) */
  onReschedule?: () => void;
  /** Booked for this person by their company: they can view it and check in, but not change or cancel it */
  bookedByCompany?: boolean;
  /** When set, the card shows a selection checkbox for bulk actions */
  selected?: boolean;
  onToggleSelect?: () => void;
}

/** One hourly booking: where (venue, room, city), when (date, time range, hours), how much, and the actions. */
export default function HourlyBookingCard({ booking: hb, space, onViewQr, onCancel, onReschedule, bookedByCompany = false, selected = false, onToggleSelect }: Props) {
  const { t, formatDate, localizeTime } = useI18n();
  const st = useSpaceText();

  const venueName = space ? st.name(space) : hb.workspace?.name || hb.section?.workspace?.name || '';
  const city = space ? st.city(space) : st.cityName(hb.workspace?.city || hb.section?.workspace?.city);
  const image = space?.images?.[0] || hb.workspace?.images?.[0] || FALLBACK_SPACE_IMAGE;
  const room = st.roomName(hb.section);

  // Booking times are Saudi wall-clock values stored in UTC fields, so they are read back as UTC
  const start = hb.startDate ? new Date(hb.startDate) : null;
  const end = hb.endDate ? new Date(hb.endDate) : null;
  const validRange = !!start && !!end && !isNaN(start.getTime()) && !isNaN(end.getTime());
  const clock = (d: Date) => localizeTime(new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(d));
  const hours = validRange ? Math.round(((end!.getTime() - start!.getTime()) / 3600000) * 100) / 100 : hb.hoursUsed || hb.package?.hoursAmount || 0;

  const statusKey = String(hb.status).toUpperCase();
  const statusLabelKey = `booking.status.${String(hb.status).toLowerCase()}`;
  const translatedStatus = t(statusLabelKey as never);
  const statusLabel = translatedStatus === statusLabelKey ? hb.status : translatedStatus;
  const price = hb.paidAmount ?? hb.package?.price ?? null;
  const seats = hb.seats && hb.seats > 0 ? hb.seats : 1;
  const ref = hb.id.replace(/-/g, '').slice(-8).toUpperCase();

  return (
    <div className="bg-white rounded-3xl border border-soot/10 shadow-xs overflow-hidden flex flex-col">
      <div className="relative h-36 bg-plaster-dark/40">
        <img src={image} alt={venueName} className="w-full h-full object-cover" loading="lazy" />
        <span className={`absolute top-3 start-3 text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_STYLES[statusKey] || STATUS_STYLES.COMPLETED}`}>
          {statusLabel}
        </span>
        {onToggleSelect && (
          <input
            type="checkbox"
            aria-label={t('bookingsList.selectRow')}
            checked={selected}
            onChange={onToggleSelect}
            className="absolute bottom-3 start-3 w-5 h-5 rounded border-soot/30 accent-soot cursor-pointer bg-white shadow-xs"
          />
        )}
        <span className="absolute top-3 end-3 text-[11px] font-mono text-white bg-soot/70 backdrop-blur-sm px-2 py-1 rounded-lg"><bdi dir="ltr">#{ref}</bdi></span>
      </div>

      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div>
          <h4 className="text-lg font-semibold text-soot font-serif-display leading-snug">{venueName || t('myBookings.hourlyPackageFallback')}</h4>
          {room && (
            <div className="flex items-center gap-1.5 text-xs text-moss mt-1">
              <Building2 size={13} className="shrink-0" />
              <span className="font-medium text-soot">{room}</span>
            </div>
          )}
          {city && (
            <div className="flex items-center gap-1.5 text-xs text-moss mt-1">
              <MapPin size={13} className="shrink-0" />
              <span>{city}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-soot/8">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-moss"><Calendar size={13} />{t('myBookings.dateLabel')}</div>
            <div className="font-semibold text-soot">{validRange ? formatDate(start!, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : t('myBookings.na')}</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-moss"><Clock size={13} />{t('myBookings.timeLabel')}</div>
            <div className="font-semibold text-soot">{validRange ? (<><bdi>{clock(start!)}</bdi> – <bdi>{clock(end!)}</bdi></>) : t('myBookings.na')}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-moss">{t('myBookings.durationLabel')}</div>
            <div className="font-semibold text-soot">{hours > 0 ? durationLabel(t, 'hour', hours) : t('myBookings.na')}</div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-moss"><Users size={13} />{t('myBookings.seatsLabel')}</div>
            <div className="font-semibold text-soot">{seats}</div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-plaster-dark/30 px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs text-moss"><Wallet size={14} />{t('myBookings.paidLabel')}</span>
          <span className="text-base font-semibold text-soot">
            {price === null ? t('myBookings.na') : price === 0 ? t('myBookings.includedInPass') : `${t('common.sar')} ${Number(price).toLocaleString()}`}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <button
            type="button"
            onClick={onViewQr}
            className="flex-1 py-2.5 px-3 rounded-xl bg-soot text-plaster text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black transition-colors cursor-pointer"
          >
            <QrCode size={14} />
            <span>{t('myBookings.viewQr')}</span>
          </button>
          {onReschedule && !bookedByCompany && (
            <button
              type="button"
              onClick={onReschedule}
              title={t('reschedule.action')}
              aria-label={t('reschedule.action')}
              className="py-2.5 px-3 rounded-xl border border-soot/15 bg-white text-soot text-xs font-semibold hover:bg-soot/5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <CalendarClock size={14} />
              <span className="hidden sm:inline">{t('reschedule.action')}</span>
            </button>
          )}
          {!bookedByCompany && statusKey !== 'CANCELLED' && statusKey !== 'REFUNDED' && statusKey !== 'EXPIRED' && statusKey !== 'COMPLETED' && (
            <button
              type="button"
              onClick={onCancel}
              className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
