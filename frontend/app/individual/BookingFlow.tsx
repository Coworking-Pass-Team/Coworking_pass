'use client';

import { useI18n } from '@/i18n';
import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  Calendar,
  Users,
  CreditCard,
  MapPin,
  ChevronRight,
  ChevronDown,
  Clock,
  AlertCircle,
  Sparkles,
  Info,
  ShieldCheck,
  Receipt,
  ShoppingBag,
  QrCode,
  Wallet
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import BookingQrModal from '@/components/BookingQrModal';
import UnitPicker, { useUnitAvailability, isUnitSlotBooked } from '@/components/spaces/UnitPicker';
import { createDirectBookingApi, createHourlyBookingApi, createPaymentApi, createPointsTransactionApi, getLoyaltyPointsApi } from '@/services/authApi';
import {
  BookingPlan,
  BookingType,
  isUserPassHolder,
  getEffectiveSpacePrice,
  getHourlyPriceForDuration,
  getMonthlyPriceForDuration,
  calculateEndTime,
  calculateEndDate,
  calculateDailyDurationDays,
  formatDateRange,
  isTimeWithinOpenHours,
  checkSpaceOverlap,
  isHourlyOnlySpace,
  isHourlyAllowed,
  isOfficeSpace,
  getAllowedPlansForSpace,
  getSpaceTypeLabel,
  getSpaceCategory,
  START_TIMES,
  END_TIMES,
  calculateDurationHours,
  getAvailableEndTimes,
  getFilteredStartTimes,
  getFixedSessionSlots,
  FIXED_SESSION_HOURS,
  getFilteredEndTimes,
  formatHourlyTimeRange,
  timeStringToMinutes
} from '@/types/types';

const FALLBACK_SPACE_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';

const STEPS = ['Plan', 'Details', 'Review', 'Confirm'];

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2.5 ${
              i < current ? 'text-moss' : i === current ? 'text-soot font-semibold' : 'text-moss/40'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                i < current
                  ? 'bg-soot text-plaster'
                  : i === current
                  ? 'bg-eucalyptus text-soot ring-4 ring-eucalyptus/20'
                  : 'bg-plaster-dark text-moss'
              }`}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className="text-sm hidden sm:inline">{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className="w-8 h-px bg-soot/15" />}
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2.5">
      <span className="text-moss text-sm font-normal">{label}</span>
      <span className="text-soot font-medium text-sm text-end">{value}</span>
    </div>
  );
}

export default function BookingFlow() {
  const { t, localizeTime, translateMessage } = useI18n();
  const st = useSpaceText();
  const { nav, navigate, goBack, spaces, bookings, currentUser, addBooking, showToast, addToCart, updateCurrentUser, withdrawFromWallet, checkSeatAvailability } = useApp();
  
  const urlId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
  const spaceId = nav?.params?.spaceId || (urlId && urlId !== 'page' && urlId !== 'booking-flow' ? urlId : '') || 'space-1';
  const space = (spaces && spaces.length > 0 ? spaces.find(s => s.id === spaceId) || spaces[0] : null) as any;

  const isHourlySpace = Boolean(space && isHourlyAllowed(space));
  const isOffice = Boolean(space && isOfficeSpace(space?.type));
  const allowedPlans = space ? getAllowedPlansForSpace(space) : (['daily'] as BookingPlan[]);

  const defaultInitialPlan: BookingPlan = allowedPlans.includes(nav?.params?.plan as BookingPlan)
    ? (nav?.params?.plan as BookingPlan)
    : (allowedPlans[0] || 'daily');
  const initialStartDate = (nav?.params?.startDate as string) || new Date().toISOString().split('T')[0];
  const initialEndDate = (nav?.params?.endDate as string) || initialStartDate;
  const initialMonths = (nav?.params?.durationMonths as number) || 1;
  const initialHours = isHourlySpace ? FIXED_SESSION_HOURS : (Number(nav?.params?.durationHours) || 1);

  const [selectedHours, setSelectedHours] = useState<number>(initialHours);
  const defaultAvailableStarts = isHourlySpace ? getFixedSessionSlots(space?.openHours, initialStartDate).map(sl => sl.start) : START_TIMES;
  const initialStartTime = (nav?.params?.startTime as string) || (defaultAvailableStarts[0] || '09:00 AM');
  const initialEndTime = (nav?.params?.endTime as string) || calculateEndTime(initialStartTime, initialHours);

  const [step, setStep] = useState(0); 
  const [plan, setPlan] = useState<BookingPlan>(defaultInitialPlan);
  const [deskType, setDeskType] = useState<BookingType>(space?.type || 'hot-desk');
  
  // Duration & Exact Time State
  const [durationMonths, setDurationMonths] = useState<number>(initialMonths);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [dailyEndDate, setDailyEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>(initialEndTime);

  const isHourly = isHourlySpace || plan === 'hourly';
  const fixedSlots = isHourlySpace ? getFixedSessionSlots(space?.openHours, startDate) : [];

  // Individual halls / theaters: sessions and seat limits follow the selected unit
  const { units: unitList } = useUnitAvailability(space, startDate, isHourlySpace);
  const [unitId, setUnitId] = useState<string>((nav?.params?.unitId as string) || '');
  const selectedUnit = unitList.find((u) => u.id === unitId) || unitList[0];
  const unitKind: 'hall' | 'theater' = space && getSpaceCategory(space) === 'theater' ? 'theater' : 'hall';
  const seatCap = isHourlySpace && selectedUnit ? selectedUnit.capacity : null;
  useEffect(() => {
    if (unitList.length > 0 && !unitList.some((u) => u.id === unitId)) setUnitId(unitList[0].id);
  }, [unitList, unitId]);

  const availableStartTimes = isHourlySpace ? fixedSlots.filter(sl => !isUnitSlotBooked(selectedUnit, sl.start, sl.end)).map(sl => sl.start) : (isHourly ? getFilteredStartTimes(space?.openHours, startDate, selectedHours) : START_TIMES);
  const availableEndTimes = isHourlySpace ? [calculateEndTime(startTime, selectedHours)] : getAvailableEndTimes(startTime);

  const durationHours = isHourly ? selectedHours : calculateDurationHours(startTime, endTime);

  // Keep the session valid for the venue: fixed 2-hour sessions for halls/theaters, start time always inside operating hours
  useEffect(() => {
    if (!space || !isHourly) return;
    if (isHourlySpace && selectedHours !== FIXED_SESSION_HOURS) {
      setSelectedHours(FIXED_SESSION_HOURS);
      return;
    }
    if (!availableStartTimes.includes(startTime)) {
      const first = availableStartTimes[0];
      if (first) {
        setStartTime(first);
        setEndTime(calculateEndTime(first, selectedHours));
      }
      return;
    }
    const expectedEnd = calculateEndTime(startTime, selectedHours);
    if (expectedEnd !== endTime) setEndTime(expectedEnd);
  }, [space?.id, space?.openHours, isHourly, isHourlySpace, startDate, selectedHours, startTime, endTime]);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (isHourly) {
      setEndTime(calculateEndTime(newStart, selectedHours));
    } else {
      const validEnds = getAvailableEndTimes(newStart);
      const startMin = timeStringToMinutes(newStart);
      const endMin = timeStringToMinutes(endTime);
      if (endMin <= startMin || !validEnds.includes(endTime)) {
        setEndTime(validEnds[0] || calculateEndTime(newStart, 1));
      }
    }
  };

  const handleHoursChange = (hours: number) => {
    setSelectedHours(hours);
    setEndTime(calculateEndTime(startTime, hours));
  };

  const handleEndTimeChange = (newEnd: string) => {
    if (!isHourlySpace) {
      setEndTime(newEnd);
    }
  };
  const [seats, setSeats] = useState(1);
  useEffect(() => {
    if (seatCap !== null && seats > seatCap) setSeats(Math.max(1, seatCap));
  }, [seatCap, seats]);
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [confirmationQrDataUrl, setConfirmationQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  // Synchronous re-entry guard: state updates are async, so fast double clicks could otherwise charge twice
  const submittingRef = useRef(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (dailyEndDate && newStart > dailyEndDate) {
      setDailyEndDate(newStart);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    if (newEnd < startDate) {
      showToast(t('bf.errEndEarlier'), 'error');
      setDailyEndDate(startDate);
      return;
    }
    setDailyEndDate(newEnd);
  };

  useEffect(() => {
    if (confirmedBooking) {
      const qrPayload = JSON.stringify({
        app: 'CoworkingPass',
        passType: 'ENTRY_PASS',
        bookingId: confirmedBooking.id,
        userId: confirmedBooking.userId,
        spaceId: confirmedBooking.spaceId,
        spaceName: confirmedBooking.spaceName,
        startDate: confirmedBooking.startDate,
        endDate: confirmedBooking.endDate,
        durationDays: confirmedBooking.durationDays,
        plan: confirmedBooking.plan,
        seats: confirmedBooking.seats,
        signature: `CP-VALID-${confirmedBooking.id}-${confirmedBooking.spaceId}`,
        timestamp: Date.now(),
      });
      QRCode.toDataURL(qrPayload, {
        width: 220,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#181C1B', light: '#FFFFFF' },
      })
        .then((url: string) => setConfirmationQrDataUrl(url))
        .catch((err: any) => console.error('Error creating confirmation QR:', err));
    }
  }, [confirmedBooking]);

  // Sync state if navigation params change
  useEffect(() => {
    if (nav?.params?.plan) {
      setPlan(nav.params.plan as BookingPlan);
    }
    if (nav?.params?.startDate) {
      setStartDate(nav.params.startDate as string);
    }
    if (nav?.params?.endDate) {
      setDailyEndDate(nav.params.endDate as string);
    }
    if (nav?.params?.startTime) {
      setStartTime(nav.params.startTime as string);
    }
    if (nav?.params?.endTime) {
      setEndTime(nav.params.endTime as string);
    } else if (nav?.params?.durationHours && nav?.params?.startTime) {
      setEndTime(calculateEndTime(nav.params.startTime as string, nav.params.durationHours as number));
    }
    if (nav?.params?.durationMonths) {
      setDurationMonths(nav.params.durationMonths as number);
    }
    if (nav?.params?.deskType) {
      setDeskType(nav.params.deskType as BookingType);
    }
  }, [nav?.params?.spaceId, nav?.params?.plan, nav?.params?.startDate, nav?.params?.endDate, nav?.params?.startTime, nav?.params?.endTime, nav?.params?.durationHours, nav?.params?.durationMonths, nav?.params?.deskType]);

  if (!space || !currentUser) return null;

  // Block non-admin users from booking a hidden space
  if (!space.isVisible && currentUser.role !== 'admin') {
    navigate('browse');
    return null;
  }

  // Blocked users cannot proceed with any booking
  if (currentUser.isBlocked) {
    navigate('login');
    return null;
  }


  const hasActiveSubscription = Boolean(currentUser?.hasActivePass);

  const effectiveDailyEndDate = dailyEndDate && dailyEndDate >= startDate ? dailyEndDate : startDate;
  const durationDays = plan === 'daily' ? calculateDailyDurationDays(startDate, effectiveDailyEndDate) : 1;

  const endDate = isHourly
    ? startDate
    : plan === 'daily'
    ? effectiveDailyEndDate
    : calculateEndDate(startDate, plan, durationMonths);

  // Price calculations
  const planInfo = getEffectiveSpacePrice(currentUser, space, plan, deskType, durationHours, durationMonths, seats, durationDays);
  const planPrice = planInfo.effectivePrice;
  const rawTotalPrice = planInfo.effectivePrice;

  // Loyalty calculations
  const multiplier = space.loyaltyPointsMultiplier || 1;
  const earnedPoints = Math.floor(rawTotalPrice / 100) * 10 * multiplier;
  const availablePoints = currentUser?.loyaltyPoints || 0;
  const usableUserPoints = Math.floor(availablePoints / 100) * 100;
  const pointsNeededToCover = Math.max(100, Math.ceil(rawTotalPrice / 25) * 100);
  const maxRedeemablePoints = Math.min(usableUserPoints, pointsNeededToCover);
  const rawPointsDiscount = useLoyaltyPoints && maxRedeemablePoints > 0 ? (maxRedeemablePoints / 100) * 25 : 0;
  const pointsDiscount = Math.min(rawTotalPrice, rawPointsDiscount);
  const totalPrice = Math.max(0, rawTotalPrice - pointsDiscount);
  const userWalletBalance = currentUser?.walletBalance || 0;
  const walletDeduction = useWalletBalance ? Math.min(userWalletBalance, totalPrice) : 0;
  const finalPayablePrice = Math.max(0, totalPrice - walletDeduction);

  const priceLabel = isHourly
    ? t(durationHours > 1 ? 'bf.forHoursMany' : 'bf.forHours', { count: durationHours })
    : plan === 'monthly'
    ? t(durationMonths > 1 ? 'bf.forMonthsMany' : 'bf.forMonths', { count: durationMonths })
    : plan === 'daily'
    ? durationDays > 1 ? t('bf.forDays', { count: durationDays }) : t('bf.perDay')
    : t('bf.perYear');

  // Validation
  const validateStep = () => {
    if (step === 1) {
      if (!startDate) {
        showToast(t('bf.errStartDate'), 'error');
        return false;
      }

      if (plan === 'daily') {
        if (!dailyEndDate) {
          showToast(t('bf.errEndDate'), 'error');
          return false;
        }
        if (dailyEndDate < startDate) {
          showToast(t('bf.errEndSameOrLater'), 'error');
          return false;
        }
      }

      if (isHourlySpace || isHourly) {
        if (!startTime || !endTime) {
          showToast(t('bf.errTimes'), 'error');
          return false;
        }
        // Validate operating hours
        const hoursCheck = isTimeWithinOpenHours(startDate, startTime, endTime, space.openHours);
        if (!hoursCheck.valid) {
          showToast(translateMessage(hoursCheck.reason || '') || t('bf.errOutsideHours'), 'error');
          return false;
        }

        // Validate space overlap & capacity
        const overlapCheck = selectedUnit
          ? { available: !isUnitSlotBooked(selectedUnit, startTime, endTime) }
          : checkSpaceOverlap(bookings, space.id, startDate, startTime, endTime, space.totalCapacity);
        if (!overlapCheck.available) {
          showToast(t('bf.errFullyReserved', { time: localizeTime(startTime) }), 'error');
          return false;
        }
      }
    }

    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, 3));
  };

  const back = () => {
    if (step === 0) {
      if (nav?.params?.fromScreen) {
        navigate(nav.params.fromScreen, nav.params.fromParams || {});
      } else if (space?.id) {
        navigate('space-details', { spaceId: space.id });
      } else {
        goBack();
      }
      return;
    }
    setStep(s => s - 1);
  };

  const confirmBooking = () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setTimeout(async () => {
      // Make sure the venue can still take this booking before anything is charged
      const availability = await checkSeatAvailability({
        spaceId: space.id,
        plan: isHourly ? 'hourly' : plan,
        date: startDate,
        startTime: isHourly ? startTime : undefined,
        endTime: isHourly ? endTime : undefined,
        days: plan === 'daily' ? durationDays : undefined,
        months: plan === 'monthly' ? durationMonths : undefined,
        seats,
        unitId: isHourlySpace ? selectedUnit?.id : undefined,
      });
      if (!availability.ok) {
        showToast(availability.message || t('bf.errNoLongerAvailable'), 'error');
        submittingRef.current = false;
        setLoading(false);
        return;
      }

      // Charge the wallet first; only create the booking if the debit succeeded
      if (useWalletBalance && walletDeduction > 0 && withdrawFromWallet) {
        const payment = await withdrawFromWallet(walletDeduction, `Booking payment for ${space.name}`);
        if (!payment.success) {
          submittingRef.current = false;
          setLoading(false);
          return;
        }
      }

      const pointsUsed = useLoyaltyPoints ? maxRedeemablePoints : 0;
      if (pointsUsed > 0) {
        const updatedPoints = Math.max(0, availablePoints - pointsUsed);
        updateCurrentUser({ loyaltyPoints: updatedPoints });

        if (currentUser) {
          createPointsTransactionApi({
            userId: currentUser.id,
            type: 'REDEEMED',
            points: pointsUsed,
            description: `Redeemed points for booking discount at ${space.name}`,
          }).then(res => {
            if (res.success) {
              getLoyaltyPointsApi(currentUser.id).then(ptsRes => {
                if (ptsRes.success && Array.isArray(ptsRes.data)) {
                  const uPts = ptsRes.data.find((p: any) => p.userId === currentUser.id);
                  if (uPts && typeof uPts.availableBalance === 'number') {
                    updateCurrentUser({ loyaltyPoints: uPts.availableBalance });
                  }
                }
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      }

      const computedDurationDays = plan === 'daily'
        ? (durationDays || calculateDailyDurationDays(startDate, effectiveDailyEndDate))
        : undefined;

      const durationDetailsText = isHourly
        ? `${durationHours} ${durationHours === 1 ? 'Hour' : 'Hours'}`
        : plan === 'daily'
        ? `${computedDurationDays} ${computedDurationDays === 1 ? 'Day' : 'Days'}`
        : plan === 'monthly'
        ? `${durationMonths} ${durationMonths === 1 ? 'Month' : 'Months'}`
        : '1 Year';

      const isPassBooking = Boolean(
        currentUser.hasActivePass && (
          totalPrice === 0 || 
          (planInfo.coveredHours || 0) > 0 || 
          planInfo.isCovered
        )
      );

      const booking = addBooking({
        userId: currentUser.id,
        spaceId: space.id,
        spaceName: space.name,
        spaceCity: space.city,
        spaceAddress: space.address,
        spaceImage: space.images?.[0] || FALLBACK_SPACE_IMAGE,
        category: getSpaceCategory(space),
        type: deskType,
        plan,
        unitId: isHourlySpace ? selectedUnit?.id : undefined,
        unitName: isHourlySpace ? selectedUnit?.name : undefined,
        startTime: (isHourlySpace || isHourly) ? startTime : undefined,
        endTime: (isHourlySpace || isHourly) ? endTime : undefined,
        durationHours: (isHourlySpace || isHourly) ? durationHours : undefined,
        durationMonths: plan === 'monthly' ? durationMonths : undefined,
        durationDays: computedDurationDays,
        durationDetails: durationDetailsText,
        startDate,
        endDate: endDate || startDate,
        seats,
        employees: [],
        totalPrice,
        status: 'active',
        notes,
        paidWithPass: isPassBooking,
        coveredHours: planInfo.coveredHours,
        payableHours: planInfo.payableHours,
      });

      setConfirmedBooking(booking);
      setStep(3);
      setLoading(false);
      showToast(t('bf.bookedToast'), 'success');
    }, 900);
  };

  // Confirmation screen
  if (step === 3 && confirmedBooking) {
    const durationSummaryText = isHourly
      ? t(durationHours === 1 ? 'bf.hourlyReservation' : 'bf.hourlyReservationMany', { start: localizeTime(startTime), end: localizeTime(endTime), count: durationHours })
      : isHourlySpace
      ? `${plan.toUpperCase()} RESERVATION (${plan === 'daily' ? `${durationDays} ${durationDays === 1 ? 'Day' : 'Days'}` : plan === 'monthly' ? `${durationMonths} Month${durationMonths > 1 ? 's' : ''}` : '1 Year'} · Allowed Hours: ${startTime} – ${endTime})`
      : plan === 'monthly'
      ? t(durationMonths > 1 ? 'bf.monthlyPassTitleMany' : 'bf.monthlyPassTitle', { count: durationMonths })
      : plan === 'daily'
      ? t(durationDays === 1 ? 'bf.dailyPassTitle' : 'bf.dailyPassTitleMany', { count: durationDays })
      : t('bf.yearlyPassTitle');

    return (
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center">
          <div className="w-18 h-18 rounded-3xl bg-eucalyptus/20 border border-eucalyptus/30 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check size={32} className="text-moss" />
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal mb-2 font-serif-display">
            {t('bf.confirmedTitle')}
          </h1>
          <p className="text-moss text-sm mb-8 font-normal">
            {t('bf.confirmedBody')}
          </p>

          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 text-start mb-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-soot/8">
              <img
                src={space.images?.[0] || FALLBACK_SPACE_IMAGE}
                alt={st.name(space) || 'Workspace'}
                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
              />
              <div>
                <div className="font-semibold text-soot text-lg">{space.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-moss mt-1">
                  <MapPin size={12} />
                  <span>{space.city} · <span className="capitalize">{getSpaceCategory(space)}</span></span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <Row label={t('bf.bookingReference')} value={`#${confirmedBooking.id.slice(-8).toUpperCase()}`} />
              <Row label={t('bf.spaceCategory')} value={getSpaceCategory(space).toUpperCase()} />
              <Row label={t('bf.workspaceType')} value={deskType.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} />
              <Row label={t('bf.planDuration')} value={durationSummaryText} />
              <Row label={isHourly ? t('qr.bookingDate') : t('spaceDetails.startDate')} value={startDate} />
              {isHourly ? (
                <Row label={t('qr.timeWindow')} value={`${startTime} – ${endTime} (${durationHours} ${durationHours === 1 ? 'hour' : 'hours'})`} />
              ) : (
                <Row label={t('spaceDetails.endDate')} value={endDate} />
              )}
              {plan === 'daily' && (
                <>
                  <Row label={t('bf.selectedRange')} value={formatDateRange(startDate, endDate)} />
                  <Row label={t('bf.reservationDuration')} value={`${durationDays} ${durationDays === 1 ? 'Day' : 'Days'}`} />
                </>
              )}
              <Row label={t('bf.reservedSeats')} value={`${seats} seat${seats > 1 ? 's' : ''}`} />
              <div className="pt-3 border-t border-soot/8 flex justify-between items-center font-semibold text-base">
                <span className="text-soot">{totalPrice === 0 ? 'Reservation Status' : 'Total Paid (incl. VAT)'}</span>
                {totalPrice === 0 ? (
                  <span className="text-moss font-bold text-xs sm:text-sm bg-eucalyptus/25 px-3 py-1 rounded-full border border-eucalyptus/30">
                    {t('bf.includedSubscription')}
                  </span>
                ) : (
                  <span className="text-soot font-bold text-lg">{t('common.sar')} {totalPrice.toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Entry QR Code Pass Card Matching Mockup */}
            <div className="mt-6 pt-6 border-t border-soot/8 bg-[#FAF7F2] -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 rounded-b-3xl text-center space-y-3">
              <div>
                <h3 className="text-base font-semibold text-soot font-serif-display">{t('qr.entryQr')}</h3>
                <p className="text-xs text-moss mt-0.5">{t('bf.qrHint')}</p>
              </div>

              <div className="inline-flex p-3 bg-white rounded-2xl border border-soot/12 shadow-2xs mx-auto">
                {confirmationQrDataUrl ? (
                  <img
                    src={confirmationQrDataUrl}
                    alt={t('bf.qrAlt')}
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-moss text-xs">
                    {t('qr.generating')}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-soot text-plaster text-xs font-semibold hover:bg-black transition-colors cursor-pointer shadow-2xs"
                >
                  <QrCode size={14} />
                  <span>{t('bf.openFullPass')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('my-bookings')}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all shadow-xs border border-soot/8 cursor-pointer"
            >
              {t('bf.viewMyBookings')}
            </button>
            <button
              onClick={() => navigate('browse')}
              className="flex-1 py-3.5 px-6 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              {t('bf.browseMore')}
            </button>
          </div>
        </div>

        {/* Interactive Entry QR Pass Modal */}
        {showQrModal && confirmedBooking && (
          <BookingQrModal
            booking={confirmedBooking}
            space={space}
            onClose={() => setShowQrModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-soot/12 bg-white hover:bg-plaster-dark/40 text-soot text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group active:scale-98"
          title={step === 0 ? t('bf.backToDetails') : t('bf.backToStep', { step })}
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />
          <span>{step === 0 ? t('bf.backToWorkspace') : t('bf.previousStep')}</span>
        </button>

        <span className="text-xs font-semibold text-moss">
          {t('bf.stepOf', { step: step + 1 })}
        </span>
      </div>

      <StepIndicator current={step} />

      {/* Prominent Space & Live Price Header Bar */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-3xl border border-soot/8 p-5 mb-8 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={space.images?.[0] || FALLBACK_SPACE_IMAGE}
            alt={space.name || 'Workspace'}
            className="w-14 h-14 rounded-2xl object-cover shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold text-soot text-base truncate">{space.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5">
              <MapPin size={12} />
              <span>{space.city} · <span className="capitalize">{getSpaceCategory(space)}</span></span>
            </div>
          </div>
        </div>

        {/* Live Dynamic Price Display */}
        <div className="text-end shrink-0 bg-plaster-dark/40 px-4 py-2.5 rounded-2xl border border-soot/10">
          {planInfo.effectivePrice === 0 ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-moss block">
                {t('bf.subscriptionStatus')}
              </span>
              <div className="font-bold text-emerald-800 text-sm sm:text-base leading-tight mt-0.5">
                {t('bf.activePass')}
              </div>
              <div className="text-[11px] text-moss mt-0.5">
                {t('bf.includedInPlan')}
              </div>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-moss block">
                {seats > 1 ? `Total (${seats} Seats)` : 'Total Price'}
              </span>
              <div className="font-bold text-soot text-lg sm:text-xl leading-tight">
                {t('common.sar')} {(planInfo.effectivePrice * seats).toLocaleString()}
              </div>
              <div className="text-[11px] text-moss mt-0.5">
                {(planInfo.coveredHours || 0) > 0
                  ? t('bf.coveredExtra', { covered: planInfo.coveredHours ?? 0, extra: planInfo.payableHours ?? 0 })
                  : planInfo.isCovered
                  ? t('bf.includedWithPass')
                  : `${t('common.sar')} ${planPrice.toLocaleString()} ${priceLabel}`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step 0: Choose Plan */}
      {step === 0 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl text-soot font-normal mb-1 font-serif-display">
              {isHourlySpace
                ? t('bf.selectHourlyPlan')
                : isOffice
                ? t('bf.chooseOfficePlan')
                : t('bf.chooseYourPass')}
            </h2>
            <p className="text-moss text-sm">
              {isHourlySpace
                ? t('bf.hallsHourly')
                : t('bf.officesPlans')}
            </p>
          </div>

          {/* Workspace Desk Type Selector */}
          {!isHourlySpace && !isOffice && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-moss mb-3">{t('bf.workspaceType')}</h3>
              <div className="grid grid-cols-3 gap-3">
                {(['hot-desk', 'private-office', 'meeting-room'] as BookingType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setDeskType(t)}
                    className={`py-3 px-3 rounded-2xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      deskType === t
                        ? 'bg-soot text-plaster border-soot shadow-sm'
                        : 'border-soot/10 text-moss hover:border-soot/30 bg-plaster/30'
                    }`}
                  >
                    {t.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan Choice List */}
          <div className="space-y-3">
            {allowedPlans.map(p => {
              const isSelected = plan === p;
              const pInfo = getEffectiveSpacePrice(currentUser, space, p, deskType, durationHours, durationMonths);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={`w-full p-4 sm:p-5 rounded-2xl border text-start transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-eucalyptus bg-[#E5ECE9]/60 shadow-sm'
                      : 'border-soot/8 bg-white hover:border-soot/20'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-soot text-base capitalize flex items-center gap-2">
                      <span>{t('bf.planLabel', { plan: t(('bf.planName.' + p) as never) })}</span>
                      {p === 'hourly' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-eucalyptus/30 text-soot font-semibold uppercase tracking-wider">
                          {t('bf.hourlyBooking')}
                        </span>
                      )}
                      {p === 'monthly' && durationMonths > 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-soot/10 text-soot font-semibold uppercase tracking-wider">
                          {durationMonths} Months
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-moss mt-1">
                      {p === 'hourly'
                        ? t('bf.hourlyDesc')
                        : p === 'daily'
                        ? t('bf.planDailyDesc')
                        : p === 'monthly'
                        ? t('bf.planMonthlyDesc')
                        : t('bf.planYearlyDesc')}
                    </div>
                  </div>

                  <div className="text-end shrink-0 ps-4">
                    {hasActiveSubscription || pInfo.isCovered ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eucalyptus/30 text-soot font-semibold text-xs border border-eucalyptus/40 shadow-2xs">
                        <Check size={11} className="text-moss shrink-0" />
                        <span>{t('spaceDetails.includedInYourPass')}</span>
                      </span>
                    ) : pInfo.hasDiscount ? (
                      <div>
                        <div className="font-bold text-soot text-base">{t('common.sar')} {pInfo.effectivePrice.toLocaleString()}</div>
                        <div className="text-[10px] text-amber-900 font-semibold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full mt-0.5">
                          {pInfo.discountPercentage}% Pass Discount
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-soot text-lg">
                          {t('common.sar')} {pInfo.originalPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-moss">
                          /{p === 'hourly' ? t('bf.unitHour', { count: durationHours }) : p === 'daily' ? t('bf.unitDay') : p === 'monthly' ? t('bf.unitMonth', { count: durationMonths }) : t('bf.unitYear')}
                        </div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Multi-Month Duration Selector when Monthly is selected */}
          {plan === 'monthly' && (
            <div className="p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>{t('spaceDetails.selectMonths')}</span>
                  </h4>
                  <p className="text-xs text-moss mt-0.5">{t('bf.chooseMonths')}</p>
                </div>
                <div className="text-sm font-bold text-soot">
                  {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'} {hasActiveSubscription ? '· Included in Pass' : `· ${t('common.sar')} ${((space.pricing?.monthly ?? 1800) * durationMonths).toLocaleString()}`}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 6, 12].map(m => {
                  const isActive = durationMonths === m;
                  const priceForM = getMonthlyPriceForDuration(space, m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-3 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#DDE6DF] text-soot border-soot/20 shadow-xs font-semibold ring-2 ring-soot/10'
                          : 'bg-white border-soot/10 text-moss hover:text-soot hover:border-soot/20'
                      }`}
                    >
                      <div className="text-xs font-semibold">{m} Mo{m > 1 ? 's' : ''}</div>
                      <div className="text-[10px] font-bold text-soot mt-0.5">
                        {hasActiveSubscription ? 'Included' : `${t('common.sar')} ${priceForM.toLocaleString()}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hourly Exact Time Range Selector for Halls, Theaters, and Hourly Plan */}
          {isHourly && (
            <div className="p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>{t('bf.specifyDateTime')}</span>
                  </h4>
                  <p className="text-xs text-moss mt-0.5">{t('bf.selectDateTimeHint')}</p>
                </div>
                <div className="text-sm font-bold text-soot whitespace-nowrap shrink-0 text-end">
                  {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'} {planInfo.effectivePrice === 0 ? '· Included in Pass' : (planInfo.coveredHours || 0) > 0 ? `· ${planInfo.coveredHours}h Covered · ${t('common.sar')} ${(planInfo.effectivePrice * seats).toLocaleString()}` : `· ${t('common.sar')} ${getHourlyPriceForDuration(space, durationHours)}`}
                </div>
              </div>

              {/* Booking Date Input */}
              <div>
                <label className="block text-[11px] font-semibold text-moss mb-1 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{t('spaceDetails.reservationDate')}</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-moss mb-1">{t('bf.startTime')}</label>
                  <select
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                  >
                    {getFilteredStartTimes(space?.openHours, startDate, 1).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-moss mb-1">{t('bf.endTime')}</label>
                  <select
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                  >
                    {getFilteredEndTimes(startTime, space?.openHours, startDate).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-soot/8 flex items-center justify-between text-xs">
                <div>
                  <span className="text-moss block text-[10px] uppercase font-semibold">{t('bf.selectedSchedule')}</span>
                  <span className="font-semibold text-soot">{startDate} · {startTime} – {endTime}</span>
                </div>
                <div className="text-end">
                  <span className="text-moss block text-[10px] uppercase font-semibold">{t('bf.totalDuration')}</span>
                  <span className="font-bold text-soot">{durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Daily Hours Notice for Theaters & Halls */}
          {isHourlySpace && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs flex items-start gap-2.5">
              <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-soot block">{t('bf.dailyHoursPolicy')}</span>
                <span className="text-moss text-[11px] leading-relaxed">
                  {t('bf.hallDailyNotice', { hours: localizeTime(space.openHours) || t('bf.operatingHoursApply') })}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={back}
              className="py-3.5 px-6 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              onClick={next}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer"
            >
              <span>{planInfo.effectivePrice === 0 ? t('bf.continueSchedule') : t('bf.continueSchedulePrice', { currency: t('common.sar'), amount: (planInfo.effectivePrice * seats).toLocaleString() })}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Schedule & Details */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl text-soot font-normal mb-1 font-serif-display">
              {t('bf.scheduleSeats')}
            </h2>
            <p className="text-moss text-sm">{t('bf.chooseDateDuration')}</p>
          </div>

          <div className="space-y-6">
            {/* Daily Date Range Selector */}
            {plan === 'daily' && !isHourlySpace ? (
              <div className="space-y-4 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{t('bf.dailyRange')}</span>
                    </h4>
                    <p className="text-xs text-moss mt-0.5">{t('bf.specifyRange')}</p>
                  </div>
                  <div className="text-xs font-bold text-soot bg-white px-3 py-1 rounded-full border border-soot/10 shadow-2xs whitespace-nowrap">
                    {durationDays} {durationDays === 1 ? 'Day' : 'Days'} Duration
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2 flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{t('spaceDetails.startDate')}</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => handleStartDateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2 flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{t('spaceDetails.endDate')}</span>
                    </label>
                    <input
                      type="date"
                      value={dailyEndDate}
                      min={startDate}
                      onChange={e => handleEndDateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                    />
                    <span className="text-[10px] text-moss mt-1 block">
                      {t('bf.endAfterStart')}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-soot/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-moss block text-[10px] uppercase font-semibold">{t('bf.selectedRange')}</span>
                    <span className="font-semibold text-soot text-sm">{formatDateRange(startDate, endDate)}</span>
                  </div>
                  <div className="text-start sm:text-end">
                    <span className="text-moss block text-[10px] uppercase font-semibold">
                      {hasActiveSubscription ? 'Pass Coverage' : 'Daily Rate Calculation'}
                    </span>
                    <span className="font-bold text-soot">
                      {hasActiveSubscription ? (
                        <span className="text-emerald-800">Included in your Pass ({durationDays} {durationDays === 1 ? 'day' : 'days'})</span>
                      ) : (
                        t('bf.dailyTotalLine', { currency: t('common.sar'), rate: (space.pricing?.daily ?? 150).toLocaleString(), days: durationDays, unit: durationDays === 1 ? t('bf.dayUnit') : t('bf.daysUnit'), total: ((space.pricing?.daily ?? 150) * durationDays).toLocaleString() })
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2 flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>{isHourlySpace ? t('spaceDetails.reservationDate') : isHourly ? t('qr.bookingDate') : t('spaceDetails.startDate')}</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    setStartDate(e.target.value);
                    setDailyEndDate(e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-soot/10 bg-[#F9F8F5] text-soot text-sm outline-none focus:border-eucalyptus focus:bg-white font-medium cursor-pointer"
                />
              </div>
            )}

            {/* Time Controls for Halls and Theaters */}
            {(isHourlySpace || isHourly) && (
              <div className="space-y-4 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{t('bf.hourlyDurationTime')}</span>
                    </h4>
                    <p className="text-xs text-moss mt-0.5">
                      {`Operating hours: ${space.openHours || 'Standard Operating Hours'}`}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap">
                    {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'} Duration
                  </div>
                </div>

                {!isHourlySpace && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-moss block">
                    {t('bf.durationHours')}
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 6, 8].map(h => {
                      const isSelected = selectedHours === h;
                      const hPrice = getEffectiveSpacePrice(currentUser, space, 'hourly', deskType, h, 1, seats);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleHoursChange(h)}
                          className={`py-2 px-1.5 rounded-xl text-center border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-soot text-plaster border-soot shadow-2xs font-semibold'
                              : 'bg-white border-soot/10 text-moss hover:text-soot hover:border-soot/30'
                          }`}
                        >
                          <div className="font-bold text-xs">{h} {h === 1 ? 'Hour' : 'Hours'}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-plaster/80 font-medium' : 'text-moss'}`}>
                            {hasActiveSubscription && hPrice.isCovered ? 'Pass Quota' : `${t('common.sar')} ${hPrice.effectivePrice.toLocaleString()}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                )}

                {isHourlySpace && (
                  <UnitPicker units={unitList} selectedId={selectedUnit?.id || ''} onSelect={setUnitId} kind={unitKind} />
                )}

                {isHourlySpace ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-moss block">
                      {t('spaceDetails.sessions2h')}
                    </span>
                    {fixedSlots.length === 0 ? (
                      <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                        {t('spaceDetails.noSessions')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {fixedSlots.map((slot) => {
                          const isSelected = startTime === slot.start;
                          const taken = isUnitSlotBooked(selectedUnit, slot.start, slot.end);
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              disabled={taken}
                              onClick={() => handleStartTimeChange(slot.start)}
                              className={`py-2.5 px-3 rounded-xl text-center border transition-all text-xs font-semibold ${
                                taken
                                  ? 'bg-plaster-dark/40 border-soot/8 text-moss/50 line-through cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-soot text-plaster border-soot shadow-2xs cursor-pointer'
                                  : 'bg-white border-soot/10 text-moss hover:text-soot hover:border-soot/30 cursor-pointer'
                              }`}
                            >
                              {slot.start} – {slot.end}{taken ? ` · ${t('units.slotTaken')}` : ''}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{isHourlySpace ? t('spaceDetails.sessionStart') : t('bf.startTime')}</span>
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                    >
                      {availableStartTimes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{isHourlySpace ? t('spaceDetails.sessionEnd') : t('bf.endTime')}</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${endTime} (${durationHours} ${durationHours === 1 ? 'Hour' : 'Hours'})`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-soot/5 border border-soot/12 text-soot text-sm font-semibold cursor-not-allowed shadow-2xs"
                    />
                  </div>
                </div>

                  </>
                )}

                <div className="bg-white p-3 rounded-xl border border-soot/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-moss block text-[10px] uppercase font-semibold">
                      {t('spaceDetails.reservationWindow')}
                    </span>
                    <span className="font-semibold text-soot">
                      {startDate} · {startTime} – {endTime} ({durationHours} {durationHours === 1 ? 'hour' : 'hours'})
                    </span>
                  </div>
                  <div className="text-start sm:text-end">
                    <span className="text-moss block text-[10px] uppercase font-semibold">{t('spaceDetails.venueHours')}</span>
                    <span className="font-semibold text-soot">{space.openHours || 'Standard Operating Hours'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Schedule Summary */}
            {plan === 'monthly' && (
              <div className="p-4 rounded-2xl bg-[#F9F8F5] border border-soot/8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-moss">
                    {t('bf.monthlyDuration')}
                  </span>
                  <span className="text-xs font-bold text-soot">{durationMonths} Months</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        durationMonths === m
                          ? 'bg-soot text-plaster font-semibold'
                          : 'bg-white border-soot/10 text-moss hover:text-soot'
                      }`}
                    >
                      {m} Mo{m > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <div className="bg-white p-3 rounded-xl border border-soot/8 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-moss block text-[10px] uppercase font-semibold">{t('bf.period')}</span>
                    <span className="font-semibold text-soot">{startDate} → {endDate}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-moss block text-[10px] uppercase font-semibold">
                      {hasActiveSubscription ? 'Plan Coverage' : 'Months Total'}
                    </span>
                    <span className="font-bold text-soot">
                      {hasActiveSubscription ? (
                        <span className="text-emerald-800">{t('spaceDetails.includedInPass')}</span>
                      ) : (
                        `${t('common.sar')} ${getMonthlyPriceForDuration(space, durationMonths).toLocaleString()}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Number of Seats */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2">
                {t('bf.numReserved')}
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSeats(Math.max(1, seats - 1))}
                  className="w-11 h-11 rounded-2xl border border-soot/10 bg-plaster/50 hover:bg-plaster flex items-center justify-center text-soot font-bold text-lg cursor-pointer"
                >
                  -
                </button>
                <span className="font-semibold text-soot text-lg w-10 text-center">{seats}</span>
                <button
                  type="button"
                  onClick={() => setSeats(Math.min(seatCap ?? (space.availableCapacity || 10), seats + 1))}
                  className="w-11 h-11 rounded-2xl border border-soot/10 bg-plaster/50 hover:bg-plaster flex items-center justify-center text-soot font-bold text-lg cursor-pointer"
                >
                  +
                </button>
                <span className="text-xs text-moss font-normal">
                  {seatCap !== null ? t('units.seatCap', { count: seatCap }) : `${space.availableCapacity ?? 0} seats currently open`}
                </span>
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2">
                {t('bf.notes')}
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('bf.notesPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-soot/10 bg-[#F9F8F5] text-soot text-sm outline-none focus:border-eucalyptus focus:bg-white resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={back}
              className="py-3.5 px-6 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              {t('common.back')}
            </button>
            <button
              onClick={next}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer"
            >
              <span>{totalPrice === 0 ? t('bf.reviewReservation') : t('bf.reviewBookingPrice')}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Payment */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl text-soot font-normal mb-1 font-serif-display">
              {totalPrice === 0 ? 'Review & Confirm Reservation' : 'Review & Payment'}
            </h2>
            <p className="text-moss text-sm">
              {totalPrice === 0
                ? t('bf.reviewHintCovered')
                : t('bf.reviewHintPay')}
            </p>
          </div>

          <div className="space-y-4">
            {/* Booking Details Summary */}
            <div className="p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8 divide-y divide-soot/6">
              <Row label={t('bf.workspace')} value={space.name} />
              <Row label={t('bf.location')} value={`${space.address}, ${space.city}`} />
              <Row label={t('bf.deskType')} value={deskType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
              <Row label={t('bf.planMode')} value={isHourly ? `Hourly Reservation (${durationHours} hours)` : plan === 'daily' ? `Daily Pass (${durationDays} ${durationDays === 1 ? 'day' : 'days'})` : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Pass`} />
              <Row label={isHourly ? t('qr.bookingDate') : t('spaceDetails.startDate')} value={startDate} />
              {isHourly ? (
                <Row label={t('qr.timeWindow')} value={`${startTime} – ${endTime} (${durationHours} ${durationHours === 1 ? 'hour' : 'hours'})`} />
              ) : (
                <Row label={t('spaceDetails.endDate')} value={endDate} />
              )}
              {plan === 'daily' && (
                <>
                  <Row label={t('bf.selectedRange')} value={formatDateRange(startDate, endDate)} />
                  <Row label={t('bf.reservationDuration')} value={`${durationDays} ${durationDays === 1 ? 'Day' : 'Days'}`} />
                </>
              )}
              {isHourlySpace && (
                <Row label={t('qr.dailyHours')} value={`${startTime} – ${endTime} (${durationHours} ${durationHours === 1 ? 'hour' : 'hours'}/day)`} />
              )}
              <Row label={t('bf.reservedSeats')} value={`${seats} seat${seats > 1 ? 's' : ''}`} />
            </div>

            {totalPrice === 0 ? (
              /* Subscription Plan Coverage Card */
              <div className="p-5 rounded-2xl bg-[#E5ECE9]/60 border-2 border-eucalyptus/40 space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-soot/8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-700" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-soot">
                      {t('bf.planCoverage')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                    {t('bf.activePass')}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-moss">{t('bf.coveredBy')}</span>
                    <span className="font-semibold text-soot">{currentUser.membershipTier || 'All-Access Pass'}</span>
                  </div>
                  {(planInfo.coveredHours || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-moss">{t('bf.planHoursApplied')}</span>
                      <span className="font-semibold text-emerald-800">
                        {planInfo.coveredHours} {planInfo.coveredHours === 1 ? 'Hour' : 'Hours'} ({currentUser.remainingHours !== undefined ? currentUser.remainingHours : 0} hrs remaining in monthly quota)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-moss">{t('bf.reservedSeats')}</span>
                    <span className="font-semibold text-soot">{seats} {seats > 1 ? 'Seats' : 'Seat'} (Included)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-moss">{t('bf.paymentRequired')}</span>
                    <span className="font-semibold text-emerald-800">{t('bf.noneCovered')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-soot/8 flex items-center gap-2 text-[11px] text-moss">
                  <Info size={13} className="shrink-0 text-emerald-700" />
                  <span>{t('bf.coveredBody')}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Quota breakdown banner */}
                {hasActiveSubscription && (planInfo.coveredHours || 0) > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                      <Info size={14} className="text-amber-700 shrink-0" />
                      <span>{t('bf.partialQuota')}</span>
                    </div>
                    <p className="text-xs text-amber-800/90 leading-relaxed">
                      {planInfo.coveredHours} free {planInfo.coveredHours === 1 ? 'hour is' : 'hours are'} covered by your {currentUser.membershipTier || 'Pass'} quota ({currentUser.remainingHours !== undefined ? currentUser.remainingHours : 0} hrs remaining). The remaining {planInfo.payableHours} {planInfo.payableHours === 1 ? 'hour is' : 'hours are'} charged at {t('common.sar')} {space.pricing?.hourly ?? 0}/hour.
                    </p>
                  </div>
                )}
                {hasActiveSubscription && (planInfo.coveredHours || 0) === 0 && (currentUser.remainingHours || 0) === 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                      <Info size={14} className="text-amber-700 shrink-0" />
                      <span>{t('bf.quotaDepleted')}</span>
                    </div>
                    <p className="text-xs text-amber-800/90 leading-relaxed">
                      {t('bf.quotaDepletedBody')}
                    </p>
                  </div>
                )}

                {/* Loyalty Rewards Program Card */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-600 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-soot">{t('bf.loyaltyProgram')}</div>
                        <div className="text-[11px] text-moss">Balance: {availablePoints} points</div>
                      </div>
                    </div>
                    {availablePoints >= 100 && maxRedeemablePoints >= 100 && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-soot cursor-pointer bg-white/80 px-3 py-1.5 rounded-xl border border-amber-500/30 hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={useLoyaltyPoints}
                          onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                          className="rounded border-soot/20 text-eucalyptus focus:ring-eucalyptus cursor-pointer"
                        />
                        <span>{t('bf.usePoints', { points: maxRedeemablePoints, currency: t('common.sar'), amount: (maxRedeemablePoints / 100) * 25 })}</span>
                      </label>
                    )}
                  </div>
                  {earnedPoints > 0 && (
                    <div className="text-[11px] font-medium text-amber-900 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-600 shrink-0 animate-pulse" />
                        <span>{t('bf.willEarn')} <strong>{t('bf.loyaltyPointsPlus', { points: earnedPoints })}</strong> {t('bf.uponCompletion')}</span>
                      </span>
                      {multiplier > 1 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-full ms-2">
                          {multiplier}× Points
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Digital Wallet Payment Widget */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-emerald-700 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-soot">{t('bf.walletBalance')}</div>
                        <div className="text-[11px] text-moss">Available Balance: {t('common.sar')} {userWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                    {userWalletBalance > 0 && totalPrice > 0 && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-soot cursor-pointer bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={useWalletBalance}
                          onChange={(e) => setUseWalletBalance(e.target.checked)}
                          className="rounded border-soot/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>{t('bf.useWallet', { currency: t('common.sar'), amount: walletDeduction.toLocaleString() })}</span>
                      </label>
                    )}
                  </div>
                  {useWalletBalance && walletDeduction > 0 && (
                    <div className="text-[11px] font-medium text-emerald-950 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                      <span>{t('bf.walletApplied')}</span>
                      <span className="font-bold text-emerald-700">- {t('common.sar')} {walletDeduction.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Clear Itemized Price Breakdown */}
                <div className="p-5 rounded-2xl bg-white border-2 border-soot/10 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
                    <Receipt size={16} className="text-moss" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-soot">
                      {t('bf.priceBreakdown')}
                    </span>
                  </div>

                  {(planInfo.coveredHours || 0) > 0 ? (
                    <>
                      <Row
                        label={t('bf.quotaHoursApplied')}
                        value={`-${planInfo.coveredHours} hrs (SAR 0 · Covered)`}
                      />
                      <Row
                        label={t('bf.extraPayable', { hours: planInfo.payableHours ?? 0, currency: t('common.sar'), rate: space.pricing?.hourly ?? 0 })}
                        value={`${t('common.sar')} ${(planInfo.effectivePrice * seats).toLocaleString()}`}
                      />
                    </>
                  ) : (
                    <>
                      <Row
                        label={t('bf.ratePerSeat', { detail: isHourly ? `${localizeTime(startTime)} – ${localizeTime(endTime)} (${t('bf.unitHour', { count: durationHours })})` : plan === 'monthly' ? t('myBookings.monthlyMo', { count: durationMonths }) : plan === 'daily' ? t('bf.rateDaily', { count: durationDays, unit: durationDays === 1 ? t('bf.dayUnit') : t('bf.daysUnit') }) : t(('booking.planPass.' + plan) as never) })}
                        value={planInfo.isCovered ? 'Included in your Plan' : `${t('common.sar')} ${planInfo.originalPrice.toLocaleString()}`}
                      />
                      <Row
                        label={t('bf.numberSeats')}
                        value={`× ${seats}`}
                      />
                      <Row
                        label={t('bf.subtotal')}
                        value={planInfo.isCovered ? 'Included in your Plan' : `${t('common.sar')} ${(planInfo.originalPrice * seats).toLocaleString()}`}
                      />
                    </>
                  )}
                  {pointsDiscount > 0 && (
                    <Row
                      label={t('bf.loyaltyDiscount')}
                      value={`- ${t('common.sar')} ${pointsDiscount.toLocaleString()}`}
                    />
                  )}
                  {walletDeduction > 0 && (
                    <Row
                      label={t('bf.walletApplied')}
                      value={`- ${t('common.sar')} ${walletDeduction.toLocaleString()}`}
                    />
                  )}
                  <Row
                    label={t('bf.vat')}
                    value={planInfo.effectivePrice === 0 ? 'SAR 0' : `${t('common.sar')} ${((planInfo.effectivePrice * seats) * 0.15).toFixed(0)}`}
                  />

                  {/* Highlighted Final Payable Amount */}
                  <div className="pt-3 border-t border-soot/10 flex justify-between items-center bg-plaster-dark/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                    <div>
                      <span className="text-sm font-bold text-soot block">{t('bf.totalPayable')}</span>
                      <span className="text-xs text-moss">{t('bf.instantConfirm')}</span>
                    </div>

                    <div className="text-end">
                      {finalPayablePrice === 0 ? (
                        <div>
                          <span className="text-2xl font-bold text-soot">{t('bf.zeroToPay')}</span>
                          <div className="text-xs text-moss font-semibold bg-eucalyptus/25 border border-eucalyptus/30 px-2.5 py-0.5 rounded-full inline-block ms-2">
                            {walletDeduction >= totalPrice && totalPrice > 0 ? 'Paid with Wallet' : 'Included in your Plan'}
                          </div>
                        </div>
                      ) : planInfo.isPartiallyCovered ? (
                        <div>
                          <span className="text-2xl font-bold text-soot">{t('common.sar')} {finalPayablePrice.toLocaleString()} to Pay</span>
                          <div className="text-xs text-amber-900 font-semibold bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full block mt-0.5">
                            {(planInfo.coveredSeats || 0) > 0 ? `${planInfo.coveredSeats} Seat Included in Plan` : `${planInfo.coveredHours || 0}h Included in Plan`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-soot">
                          {t('common.sar')} {finalPayablePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={back}
              className="py-3.5 px-6 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              onClick={() => {
                addToCart({
                  spaceId: space.id,
                  spaceName: space.name,
                  spaceCity: space.city,
                  spaceAddress: space.address || space.city,
                  spaceImage: space.images?.[0] || FALLBACK_SPACE_IMAGE,
                  type: deskType,
                  plan: plan,
                  unitId: isHourlySpace ? selectedUnit?.id : undefined,
                  unitName: isHourlySpace ? selectedUnit?.name : undefined,
                  durationHours: isHourly ? durationHours : undefined,
                  durationMonths: plan === 'monthly' ? durationMonths : undefined,
                  durationDays: plan === 'daily' ? durationDays : undefined,
                  startTime: isHourly ? startTime : undefined,
                  endTime: isHourly ? endTime : undefined,
                  startDate: startDate,
                  endDate: endDate,
                  seats: seats,
                  notes: notes,
                  pricePerSeat: planInfo.effectivePrice === 0 ? 0 : Math.round(totalPrice / seats),
                  itemTotal: planInfo.effectivePrice === 0 ? 0 : totalPrice,
                });
                navigate('browse');
              }}
              className="py-3.5 px-5 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <ShoppingBag size={16} />
              <span>{totalPrice === 0 ? t('spaceDetails.addToCartCovered') : t('bf.addToCart')}</span>
            </button>
            <button
              onClick={confirmBooking}
              disabled={loading}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>{t('bf.confirming')}</span>
              ) : totalPrice === 0 ? (
                <>
                  <Check size={16} className="text-moss" />
                  <span>Confirm Reservation (Covered by your Pass)</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>{t('bf.payNow', { currency: t('common.sar'), amount: totalPrice.toLocaleString() })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
