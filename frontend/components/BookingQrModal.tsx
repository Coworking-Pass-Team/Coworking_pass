'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, MapPin, Calendar, Users, Clock, X } from 'lucide-react';
import { Booking, getBookingPrice, Space, calculateDailyDurationDays, formatDateRange } from '@/types/types';
import { useApp } from '@/app/store';

interface BookingQrModalProps {
  booking: Booking | null;
  onClose: () => void;
  onCancelClick?: (booking: Booking) => void;
  space?: Space | null;
}

export default function BookingQrModal({
  booking,
  onClose,
  space: propSpace,
}: BookingQrModalProps) {
  const { spaces, currentUser } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const targetSpace = propSpace || (booking ? spaces.find(s => s.id === booking.spaceId) : null);

  const hasActiveSubscription = Boolean(currentUser?.hasActivePass);

  // Total Price Display
  const totalPrice = booking ? getBookingPrice(booking, spaces) : 0;
  const totalPriceDisplay = (hasActiveSubscription || totalPrice === 0) ? 'Covered by Pass' : `${totalPrice.toLocaleString()} SAR`;

  const durationDays = booking?.durationDays || (booking?.plan === 'daily' && booking?.startDate && booking?.endDate ? calculateDailyDurationDays(booking.startDate, booking.endDate) : 1);

  // Generate Scannable QR Code
  useEffect(() => {
    if (!booking) return;

    // Build real verification URL so scanning with mobile phone opens pass & connects to database
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const timeParams = booking.startTime ? `&startTime=${encodeURIComponent(booking.startTime)}&endTime=${encodeURIComponent(booking.endTime || '')}` : '';
    const verifyUrl = `${origin}/pass?bookingId=${encodeURIComponent(booking.id)}&spaceId=${encodeURIComponent(booking.spaceId)}&userId=${encodeURIComponent(booking.userId)}&spaceName=${encodeURIComponent(booking.spaceName || '')}&seats=${booking.seats || 1}&plan=${encodeURIComponent(booking.plan || 'daily')}&startDate=${encodeURIComponent(booking.startDate || '')}&endDate=${encodeURIComponent(booking.endDate || booking.startDate || '')}&durationDays=${durationDays}${timeParams}`;

    QRCode.toDataURL(verifyUrl, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#181C1B',
        light: '#FFFFFF',
      },
    })
      .then((url: string) => {
        setQrDataUrl(url);
      })
      .catch((err: any) => {
        console.error('Error generating booking QR code:', err);
      });
  }, [booking, durationDays]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!booking) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soot/55 backdrop-blur-xs animate-in fade-in-50 duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md bg-[#FAF7F2] rounded-3xl sm:rounded-[32px] p-4 sm:p-5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-soot space-y-3 sm:space-y-3.5 border border-soot/10 max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)' }}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-semibold text-soot">Reservation Pass</h3>
            <p className="text-[11px] text-moss">Ref: {booking.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-soot/10 text-moss hover:text-soot transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reservation Details Card */}
        <div className="bg-white rounded-2xl p-4 border border-soot/8 shadow-2xs space-y-2.5 text-xs">
          <div className="flex items-start justify-between pb-2.5 border-b border-soot/8">
            <div>
              <div className="font-bold text-soot text-sm">{booking.spaceName}</div>
              <div className="flex items-center gap-1 text-moss text-[11px] mt-0.5">
                <MapPin size={11} />
                <span>{booking.spaceCity || targetSpace?.city || 'Saudi Arabia'}</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {booking.plan === 'daily'
                ? `Daily (${durationDays} ${durationDays === 1 ? 'Day' : 'Days'})`
                : booking.plan === 'hourly'
                ? `Hourly (${booking.durationHours || 1}h)`
                : `${booking.plan} pass`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-moss block">
                {booking.plan === 'daily' ? 'Date Range' : booking.plan === 'hourly' ? 'Booking Date' : 'Start Date'}
              </span>
              <span className="font-semibold text-soot block">
                {booking.plan === 'daily'
                  ? formatDateRange(booking.startDate, booking.endDate || booking.startDate)
                  : booking.startDate}
              </span>
              {booking.plan !== 'daily' && booking.endDate && booking.endDate !== booking.startDate && (
                <span className="text-[10px] text-moss block">to {booking.endDate}</span>
              )}
            </div>

            <div>
              <span className="text-moss block">
                {booking.plan === 'daily' ? 'Duration' : booking.plan === 'hourly' ? 'Time Window' : 'Seats'}
              </span>
              <span className="font-semibold text-soot block">
                {booking.plan === 'daily'
                  ? `${durationDays} ${durationDays === 1 ? 'Calendar Day' : 'Calendar Days'}`
                  : booking.plan === 'hourly'
                  ? `${booking.startTime || ''} – ${booking.endTime || ''}`
                  : `${booking.seats} Seat(s)`}
              </span>
            </div>
          </div>

          {booking.startTime && booking.endTime && booking.plan !== 'hourly' && (
            <div className="flex items-center justify-between pt-2 border-t border-soot/8 text-[11px]">
              <span className="text-moss flex items-center gap-1">
                <Clock size={11} /> Daily Allowed Hours
              </span>
              <span className="font-semibold text-emerald-800">
                {booking.startTime} – {booking.endTime} ({booking.durationHours || 1} hrs/day)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-soot/8 text-xs font-semibold">
            <span className="text-moss font-normal flex items-center gap-1">
              <Users size={12} /> {booking.seats} Seat{booking.seats > 1 ? 's' : ''} Reserved
            </span>
            <span className="text-soot font-bold">
              {hasActiveSubscription || totalPrice === 0 ? 'Status: Covered by Pass' : `Total: ${totalPriceDisplay}`}
            </span>
          </div>
        </div>

        {/* Central Entry QR Code Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center border border-soot/8 shadow-2xs space-y-3">
          <div>
            <h4 className="text-base sm:text-lg font-medium text-soot font-serif-display">
              Entry QR code
            </h4>
            <p className="text-xs text-moss mt-0.5">
              Show at the space entrance for authorized verification.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex items-center justify-center py-1">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Entry QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-moss text-xs">
                Generating pass...
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-moss font-medium pt-1">
            <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
            <span>Encrypted &amp; Authorized by Coworking Pass</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-2xl bg-soot text-plaster text-xs sm:text-sm font-semibold hover:bg-moss transition-all cursor-pointer shadow-xs"
        >
          Close Pass
        </button>
      </div>
    </div>
  );
}
