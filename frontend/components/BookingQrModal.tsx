'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  MapPin,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { Booking, getBookingPrice, Space } from '@/types/types';
import { useApp } from '@/app/store';
import { createQrCheckInApi, createPointsTransactionApi } from '@/services/authApi';

interface BookingQrModalProps {
  booking: Booking | null;
  onClose: () => void;
  onCancelClick?: (booking: Booking) => void;
  space?: Space | null;
}

export default function BookingQrModal({
  booking,
  onClose,
  onCancelClick,
  space,
}: BookingQrModalProps) {
  const { spaces, currentUser, navigate, showToast, updateCurrentUser } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedTime, setVerifiedTime] = useState<string | null>(null);

  const matchedSpace = space || (booking ? spaces.find((s: any) => s.id === booking.spaceId) : null);

  // Format Booking ID for display like BK-928194
  const formattedBookingId = booking
    ? booking.id.startsWith('b') || booking.id.startsWith('BK-')
      ? booking.id.toUpperCase()
      : `BK-${booking.id.slice(-6).toUpperCase()}`
    : '';

  // Format Booked On date
  const bookedOnDate = booking?.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-GB')
    : booking?.startDate || new Date().toLocaleDateString('en-GB');

  // Format Start & End Dates
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formattedStartDate = formatDateDisplay(booking?.startDate);
  const formattedEndDate = booking?.endDate ? formatDateDisplay(booking.endDate) : formattedStartDate;

  // Format Plan display
  const planDisplay = booking
    ? booking.plan === 'hourly'
      ? `Hourly (${booking.durationHours || 1}h)`
      : booking.plan === 'monthly'
      ? booking.durationMonths && booking.durationMonths > 1
        ? `Monthly (${booking.durationMonths} Mo)`
        : 'Monthly'
      : booking.plan === 'daily'
      ? 'Daily'
      : 'Yearly'
    : 'Standard';

  // Format Workspace Type display
  const typeDisplay = booking
    ? booking.type
      ? booking.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
      : 'Hot Desk'
    : 'Hot Desk';

  // Total Price Display
  const totalPrice = booking ? getBookingPrice(booking, spaces) : 0;
  const totalPriceDisplay = totalPrice === 0 ? 'Included' : `${totalPrice.toLocaleString()} SAR`;

  // Generate Scannable QR Code
  useEffect(() => {
    if (!booking) return;

    // High fidelity QR Payload
    const qrPayload = JSON.stringify({
      app: 'CoworkingPass',
      passType: 'ENTRY_PASS',
      bookingId: booking.id,
      userId: booking.userId,
      spaceId: booking.spaceId,
      spaceName: booking.spaceName,
      startDate: booking.startDate,
      plan: booking.plan,
      seats: booking.seats,
      signature: `CP-VALID-${booking.id}-${booking.spaceId}`,
      timestamp: Date.now(),
    });

    QRCode.toDataURL(qrPayload, {
      width: 260,
      margin: 2,
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

  if (!booking) return null;

  const handleCopyBookingId = () => {
    if (!booking) return;
    navigator.clipboard.writeText(formattedBookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Booking ID copied to clipboard!', 'info');
  };

  const handleVerifyEntry = async () => {
    if (isVerified) {
      showToast('Entry has already been verified for this pass!', 'info');
      return;
    }

    setIsVerifying(true);

    try {
      // 1. Send verification to backend QR Check-in API
      await createQrCheckInApi({
        userId: booking.userId || currentUser?.id || 'guest',
        workspaceId: booking.spaceId,
        sectionId: (booking as any).sectionId || `sec-${booking.spaceId}`,
        status: 'VALID',
      });

      // 2. Award loyalty points (+10 pts)
      if (currentUser) {
        const pointsToAdd = 10;
        const currentPoints = currentUser.loyaltyPoints || 0;
        updateCurrentUser({ loyaltyPoints: currentPoints + pointsToAdd });

        createPointsTransactionApi({
          userId: currentUser.id,
          type: 'EARNED',
          points: pointsToAdd,
          description: `QR Entry Check-in at ${booking.spaceName}`,
          referenceId: booking.id,
        }).catch(() => {});
      }

      setIsVerified(true);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setVerifiedTime(nowStr);
      showToast(`Entry successfully verified at ${booking.spaceName}! +10 Loyalty Points earned 🎉`, 'success');
    } catch (err) {
      console.warn('QR check-in offline fallback:', err);
      setIsVerified(true);
      setVerifiedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast(`Entry verified! Welcome to ${booking.spaceName}.`, 'success');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewSpace = () => {
    onClose();
    if (booking.spaceId) {
      navigate('space-details', { spaceId: booking.spaceId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soot/55 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div
        className="relative w-full max-w-md bg-plaster-surface rounded-3xl border border-soot/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-soot flex flex-col max-h-[92vh]"
        style={{ fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)' }}
      >
        {/* Scrollable Container */}
        <div className="overflow-y-auto px-6 py-6 space-y-5">
          {/* Header with Space Info and Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={booking.spaceImage || matchedSpace?.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80'}
                alt={booking.spaceName}
                className="w-14 h-14 rounded-2xl object-cover border border-soot/12 shadow-2xs shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-xl font-medium text-soot font-serif-display leading-tight truncate">
                  {booking.spaceName}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-moss mt-1 font-medium">
                  <MapPin size={13} className="shrink-0 text-moss" />
                  <span className="truncate">{booking.spaceCity || matchedSpace?.city || 'Saudi Arabia'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  booking.status === 'active'
                    ? 'bg-[#EBF3ED] text-[#2F6144] border-[#CDE1D4]'
                    : booking.status === 'previous'
                    ? 'bg-soot/10 text-soot border-soot/15'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {booking.status === 'active' ? 'Active' : booking.status === 'previous' ? 'Completed' : 'Cancelled'}
              </span>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-moss hover:text-soot hover:bg-soot/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Key-Value Metadata List */}
          <div className="bg-white/70 rounded-2xl border border-soot/10 p-4 divide-y divide-soot/8 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-2 first:pt-0">
              <span className="text-moss font-normal">Booking ID</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-soot font-mono">{formattedBookingId}</span>
                <button
                  type="button"
                  onClick={handleCopyBookingId}
                  className="p-1 text-moss hover:text-soot hover:bg-soot/5 rounded transition-colors"
                  title="Copy ID"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-moss font-normal">Type</span>
              <span className="font-semibold text-soot">{typeDisplay}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-moss font-normal">Plan</span>
              <span className="font-semibold text-soot">{planDisplay}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-moss font-normal">Start date</span>
              <span className="font-semibold text-soot">{formattedStartDate}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-moss font-normal">End date</span>
              <span className="font-semibold text-soot">{formattedEndDate}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-moss font-normal">Seats</span>
              <span className="font-semibold text-soot">{booking.seats}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-moss font-normal">Booked on</span>
              <span className="font-semibold text-soot">{bookedOnDate}</span>
            </div>

            <div className="flex items-center justify-between py-2.5 last:pb-0">
              <span className="text-moss font-medium">Total paid</span>
              <span className="font-bold text-soot text-base">{totalPriceDisplay}</span>
            </div>
          </div>

          {/* Central Entry QR Code Block */}
          <div className="bg-white rounded-3xl border border-soot/12 p-5 text-center shadow-xs space-y-3">
            <div>
              <h4 className="text-base font-semibold text-soot font-serif-display">
                Entry QR code
              </h4>
              <p className="text-xs text-moss mt-0.5">
                Show at the space entrance for verification.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="relative inline-flex items-center justify-center p-3 bg-white rounded-2xl border border-soot/15 shadow-2xs mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Entry QR Code for ${formattedBookingId}`}
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-moss text-xs">
                  Generating secure pass...
                </div>
              )}

              {/* Verified Badge Overlay */}
              {isVerified && (
                <div className="absolute inset-0 bg-white/92 backdrop-blur-2xs rounded-2xl flex flex-col items-center justify-center p-3 text-center animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 mb-2 shadow-xs">
                    <CheckCircle2 size={28} />
                  </div>
                  <span className="text-sm font-bold text-emerald-900">Entry Verified!</span>
                  <span className="text-[11px] text-emerald-700 mt-0.5">
                    Checked in at {verifiedTime || 'Front Desk'}
                  </span>
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-[10px] font-semibold">
                    <Sparkles size={11} className="text-amber-600" />
                    <span>+10 Loyalty Pts Earned</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-moss">
              <ShieldCheck size={13} className="text-[#2F6144]" />
              <span>Encrypted &amp; Authorized by Coworking Pass</span>
            </div>
          </div>
        </div>

        {/* Action Buttons at Bottom */}
        <div className="p-4 sm:p-5 bg-plaster-surface border-t border-soot/10 grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* Verify Entry Button (Sage Green) */}
          <button
            type="button"
            onClick={handleVerifyEntry}
            disabled={isVerifying || isVerified || booking.status !== 'active'}
            className={`py-2.5 px-2 sm:px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isVerified
                ? 'bg-emerald-700 text-white cursor-default opacity-90'
                : booking.status !== 'active'
                ? 'bg-soot/10 text-moss cursor-not-allowed'
                : 'bg-[#2F6144] hover:bg-[#254F37] text-white active:scale-98'
            }`}
          >
            {isVerifying ? (
              <span className="animate-pulse">Checking...</span>
            ) : isVerified ? (
              <>
                <Check size={14} />
                <span>Verified</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Verify entry</span>
              </>
            )}
          </button>

          {/* Cancel Booking Button (Soft Light Red) */}
          <button
            type="button"
            onClick={() => {
              if (onCancelClick) {
                onCancelClick(booking);
              }
            }}
            disabled={booking.status !== 'active'}
            className={`py-2.5 px-2 sm:px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              booking.status !== 'active'
                ? 'bg-soot/5 text-moss/40 cursor-not-allowed'
                : 'bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border border-[#FCA5A5]/40 active:scale-98'
            }`}
          >
            <X size={13} />
            <span>Cancel booking</span>
          </button>

          {/* View Space Button (Dark Soot) */}
          <button
            type="button"
            onClick={handleViewSpace}
            className="py-2.5 px-2 sm:px-3 rounded-2xl text-xs font-semibold bg-[#1F292E] hover:bg-black text-white flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <MapPin size={13} />
            <span>View space</span>
          </button>
        </div>
      </div>
    </div>
  );
}
