'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck } from 'lucide-react';
import { Booking, getBookingPrice, Space } from '@/types/types';
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
  space,
}: BookingQrModalProps) {
  const { spaces } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Total Price Display
  const totalPrice = booking ? getBookingPrice(booking, spaces) : 0;
  const totalPriceDisplay = totalPrice === 0 ? 'Included' : `${totalPrice.toLocaleString()} SAR`;

  // Generate Scannable QR Code
  useEffect(() => {
    if (!booking) return;

    // Build real verification URL so scanning with mobile phone opens pass & connects to database
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const verifyUrl = `${origin}/pass?bookingId=${encodeURIComponent(booking.id)}&spaceId=${encodeURIComponent(booking.spaceId)}&userId=${encodeURIComponent(booking.userId)}&spaceName=${encodeURIComponent(booking.spaceName || '')}&seats=${booking.seats || 1}&plan=${encodeURIComponent(booking.plan || 'daily')}`;

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
  }, [booking]);

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
        className="relative w-full max-w-sm sm:max-w-md bg-[#FAF7F2] rounded-3xl sm:rounded-[32px] p-4 sm:p-5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-soot space-y-3 sm:space-y-3.5 border border-soot/10"
        style={{ fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)' }}
      >
        {/* Total Paid Header Card */}
        <div className="bg-white rounded-2xl px-5 py-3.5 flex items-center justify-between border border-soot/8 shadow-2xs">
          <span className="text-xs sm:text-sm text-moss font-normal">Total paid</span>
          <span className="text-sm sm:text-base font-bold text-soot font-sans tracking-tight">
            {totalPriceDisplay}
          </span>
        </div>

        {/* Central Entry QR Code Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-center border border-soot/8 shadow-2xs space-y-4">
          <div>
            <h3 className="text-lg sm:text-xl font-medium text-soot font-serif-display">
              Entry QR code
            </h3>
            <p className="text-xs text-moss mt-1">
              Show at the space entrance for verification.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex items-center justify-center py-1">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Entry QR Code"
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
              />
            ) : (
              <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-moss text-xs">
                Generating pass...
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-moss font-medium pt-1">
            <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
            <span>Encrypted &amp; Authorized by Coworking Pass</span>
          </div>
        </div>
      </div>
    </div>
  );
}
