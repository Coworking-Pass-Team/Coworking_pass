'use client';

import { useI18n } from '@/i18n';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Check,
  Users,
  Calendar,
  ChevronRight,
  ChevronDown,
  MapPin,
  CreditCard,
  Clock,
  Info,
  Receipt,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import UnitPicker, { useUnitAvailability, isUnitSlotBooked } from '@/components/spaces/UnitPicker';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import { createPointsTransactionApi, getLoyaltyPointsApi } from '@/services/authApi';
import {
  BookingPlan,
  BookingType,
  Employee,
  Space,
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
  applyUnitToSpace,
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

const STEP_KEYS = ['tb.stepType', 'tb.stepTeam', 'tb.stepSchedule', 'tb.stepReview'] as const;
const STEPS = STEP_KEYS;
const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8];

export default function TeamBooking() {
  const { t, localizeTime } = useI18n();
  const { nav, goBack, spaces, bookings, currentUser, addBooking, navigate, showToast, addToCart, updateCurrentUser, withdrawFromWallet, companyWalletBalance, fetchCompanyWallet, withdrawFromCompanyWallet, checkSeatAvailability } = useApp();
  const spaceId = nav.params?.spaceId;
  const baseSpace = spaces.find((s: Space) => s.id === spaceId);

  // Rooms / sections of the hub: the selected room decides plans, pricing, capacity and the session grid
  const [startDate, setStartDate] = useState((nav?.params?.startDate as string) || new Date().toISOString().split('T')[0]);
  const { units: unitList } = useUnitAvailability(baseSpace, startDate, Boolean(baseSpace?.units && baseSpace.units.length > 0), bookings?.length || 0);
  const [unitId, setUnitId] = useState<string>((nav?.params?.unitId as string) || '');
  const selectedUnit = unitList.find((u) => u.id === unitId) || unitList[0];
  const space = useMemo(
    () => (baseSpace ? applyUnitToSpace(baseSpace, selectedUnit, unitList.length) : baseSpace),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseSpace, selectedUnit?.id, selectedUnit?.capacity, selectedUnit?.type, selectedUnit?.subType, selectedUnit?.hourlyRate, selectedUnit?.dailyRate, selectedUnit?.monthlyRate, selectedUnit?.yearlyRate, unitList.length]
  );

  const isHourlySpace = isHourlyAllowed(space);
  const isOffice = isOfficeSpace(space?.type);
  const allowedPlans = getAllowedPlansForSpace(space);

  const defaultInitialPlan: BookingPlan = (nav?.params?.plan as BookingPlan && allowedPlans.includes(nav?.params?.plan as BookingPlan))
    ? (nav.params.plan as BookingPlan)
    : (allowedPlans[0] || 'daily');
  const initialMonths = (nav?.params?.durationMonths as number) || 1;
  const initialHours = isHourlySpace ? FIXED_SESSION_HOURS : (Number(nav?.params?.durationHours) || 1);
  const initialStartDate = (nav?.params?.startDate as string) || new Date().toISOString().split('T')[0];
  const initialEndDate = (nav?.params?.endDate as string) || initialStartDate;

  const [selectedHours, setSelectedHours] = useState<number>(initialHours);
  const defaultAvailableStarts = isHourlySpace ? getFixedSessionSlots(space?.openHours, initialStartDate).map(sl => sl.start) : START_TIMES;
  const initialStartTime = (nav?.params?.startTime as string) || (defaultAvailableStarts.includes('09:00 AM') ? '09:00 AM' : (defaultAvailableStarts[0] || '09:00 AM'));
  const initialEndTime = (nav?.params?.endTime as string) || calculateEndTime(initialStartTime, initialHours);

  const [step, setStep] = useState(0);
  const [bookingType, setBookingType] = useState<BookingType>(space?.type || 'hot-desk');
  const [plan, setPlan] = useState<BookingPlan>(defaultInitialPlan);
  const [durationMonths, setDurationMonths] = useState<number>(initialMonths);
  const [dailyEndDate, setDailyEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>(initialEndTime);
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  const isHourly = isHourlySpace || plan === 'hourly';

  // Picking another room can change the booking category: keep the plan and booking type valid for it
  useEffect(() => {
    if (!space) return;
    if (!allowedPlans.includes(plan)) setPlan(allowedPlans[0] || 'daily');
    if (space.type) setBookingType(space.type as BookingType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.type]);
  const fixedSlots = isHourlySpace ? getFixedSessionSlots(space?.openHours, startDate) : [];

  const seatCap = selectedUnit ? selectedUnit.capacity : null;

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

  // Initialize seats from nav params (pre-selected in space detail page) or default to 2
  const initialSeats = Number(nav?.params?.seats) > 0 ? Number(nav.params.seats) : 2;
  const [seats, setSeats] = useState(initialSeats);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // Synchronous re-entry guard and idempotency key: state updates are async, so fast double clicks could otherwise charge twice
  const submittingRef = useRef(false);
  const checkoutKeyRef = useRef<string>(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `co-${Date.now()}-${Math.random().toString(36).slice(2)}`);

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

  // Loyalty Points State
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

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
    if (nav?.params?.bookingType) {
      setBookingType(nav.params.bookingType as BookingType);
    }
  }, [nav?.params?.spaceId, nav?.params?.plan, nav?.params?.startDate, nav?.params?.endDate, nav?.params?.startTime, nav?.params?.endTime, nav?.params?.durationHours, nav?.params?.durationMonths, nav?.params?.bookingType]);

  const employees = currentUser?.employees || [];

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

  const planInfo = getEffectiveSpacePrice(currentUser, space, plan, bookingType, durationHours, durationMonths, seats, durationDays);
  const pricePerSeat = planInfo.isCovered ? 0 : Math.round(planInfo.effectivePrice / seats);
  const rawTotalPrice = planInfo.effectivePrice;

  // منطق نقاط الولاء المكتسبة والمستخدمة
  const multiplier = space.loyaltyPointsMultiplier || 1;
  const earnedPoints = Math.floor(rawTotalPrice / 100) * 10 * multiplier;
  const availablePoints = currentUser.loyaltyPoints || 0;
  const usableUserPoints = Math.floor(availablePoints / 100) * 100;
  const pointsNeededToCover = Math.max(100, Math.ceil(rawTotalPrice / 25) * 100);
  const maxRedeemablePoints = Math.min(usableUserPoints, pointsNeededToCover);
  const rawPointsDiscount = useLoyaltyPoints && maxRedeemablePoints > 0 ? (maxRedeemablePoints / 100) * 25 : 0;
  const pointsDiscount = Math.min(rawTotalPrice, rawPointsDiscount);
  const finalPayablePrice = Math.max(0, rawTotalPrice - pointsDiscount);
  const isUsingCompanyWallet = (companyWalletBalance || 0) > 0;
  const userWalletBalance = isUsingCompanyWallet ? companyWalletBalance : (currentUser?.walletBalance || 0);
  const walletDeduction = useWalletBalance ? Math.min(userWalletBalance, finalPayablePrice) : 0;
  const totalPriceToPay = Math.max(0, finalPayablePrice - walletDeduction);

  const planLabel = isHourly
    ? t('bf.forHoursMany', { count: durationHours })
    : plan === 'monthly'
    ? t(durationMonths > 1 ? 'bf.forMonthsMany' : 'bf.forMonths', { count: durationMonths })
    : plan === 'daily'
    ? '/day'
    : '/year';

  const allEmployeesSelected = employees.length > 0 && selectedEmployees.length === employees.length;

  const toggleSelectAll = () => {
    if (allEmployeesSelected) {
      setSelectedEmployees([]);
      setSeats(1);
    } else {
      const allIds = employees.map(e => e.id);
      setSelectedEmployees(allIds);
      setSeats(Math.max(1, allIds.length));
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter(e => e !== id) : [...prev, id];
      if (next.length > 0) {
        setSeats(next.length);
      }
      return next;
    });
  };

  const validateStep = () => {
    if (step === 2) {
      if (!startDate) {
        showToast(t('tb.bookingDateReq'), 'error');
        return false;
      }
      if (plan === 'daily') {
        if (!dailyEndDate) {
          showToast(t('tb.endDateReq'), 'error');
          return false;
        }
        if (dailyEndDate < startDate) {
          showToast(t('tb.endSameOrLater'), 'error');
          return false;
        }
      }
      if (isHourlySpace || isHourly) {
        if (!startTime || !endTime) {
          showToast(t('bf.errTimes'), 'error');
          return false;
        }
        const hoursCheck = isTimeWithinOpenHours(startDate, startTime, endTime, space.openHours);
        if (!hoursCheck.valid) {
          showToast(hoursCheck.reason || t('bf.errOutsideHours'), 'error');
          return false;
        }
        const overlapCheck = selectedUnit
          ? { available: !isUnitSlotBooked(selectedUnit, startTime, endTime) && seats <= selectedUnit.capacity }
          : checkSpaceOverlap(bookings, space.id, startDate, startTime, endTime, space.totalCapacity);
        if (!overlapCheck.available) {
          showToast(t('tb.notEnoughCapacity', { seats, time: localizeTime(startTime) }), 'error');
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
        navigate('team-bookings');
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
        unitId: selectedUnit?.id,
      });
      if (!availability.ok) {
        showToast(availability.message || t('bf.errNoLongerAvailable'), 'error');
        submittingRef.current = false;
        setLoading(false);
        return;
      }

      // Charge the wallet first; only create the booking if the debit succeeded
      if (useWalletBalance && walletDeduction > 0) {
        const payment = isUsingCompanyWallet && withdrawFromCompanyWallet
          ? await withdrawFromCompanyWallet(walletDeduction, currentUser.companyId, `Team booking payment for ${space.name}`, checkoutKeyRef.current)
          : (!isUsingCompanyWallet && withdrawFromWallet
            ? await withdrawFromWallet(walletDeduction, `Team booking payment for ${space.name}`, checkoutKeyRef.current)
            : { success: true, message: '' });
        if (!payment.success) {
          submittingRef.current = false;
          setLoading(false);
          return;
        }
      }

      const isPassBooking = Boolean(
        currentUser.hasActivePass && (
          totalPriceToPay === 0 || 
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
        spaceImage: space.images[0],
        category: getSpaceCategory(space),
        type: bookingType,
        plan,
        unitId: selectedUnit?.id,
        unitName: selectedUnit?.name,
        startTime: (isHourlySpace || isHourly) ? startTime : undefined,
        endTime: (isHourlySpace || isHourly) ? endTime : undefined,
        durationHours: (isHourlySpace || isHourly) ? durationHours : undefined,
        durationDays: plan === 'daily' ? durationDays : undefined,
        durationMonths: plan === 'monthly' ? durationMonths : undefined,
        startDate,
        endDate,
        seats,
        employees: selectedEmployees,
        totalPrice: totalPriceToPay,
        status: 'active',
        paidWithPass: isPassBooking,
        coveredHours: planInfo.coveredHours,
        payableHours: planInfo.payableHours,
      }, useWalletBalance && walletDeduction > 0
        ? { amount: walletDeduction, key: checkoutKeyRef.current, target: isUsingCompanyWallet ? 'company' : 'personal' }
        : undefined);

      // Update loyalty points for organization / user
      const pointsUsed = useLoyaltyPoints ? maxRedeemablePoints : 0;
      const updatedPoints = Math.max(0, availablePoints - pointsUsed + earnedPoints);
      updateCurrentUser({ loyaltyPoints: updatedPoints });

      if (pointsUsed > 0 && currentUser) {
        createPointsTransactionApi({
          userId: currentUser.id,
          type: 'REDEEMED',
          points: pointsUsed,
          description: `Redeemed points for team booking discount (${space.name})`,
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

      setConfirmedBooking(booking);
      setStep(4);
      setLoading(false);
      showToast(
        pointsUsed > 0 ? t('tb.reservedToastRedeemed', { earned: earnedPoints, redeemed: pointsUsed }) : t('tb.reservedToastPlain', { earned: earnedPoints }),
        'success'
      );
    }, 1000);
  };

  // Success Screen
  if (step === 4 && confirmedBooking) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-eucalyptus/20 border border-eucalyptus/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Check size={28} className="text-moss" />
          </div>
          <h1 className="text-2xl sm:text-3xl text-soot mb-2 font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {t('tb.confirmedTitle')}
          </h1>
          <p className="text-moss text-xs sm:text-sm mb-8 font-normal">
            Your workspace for {seats} team member{seats > 1 ? 's' : ''} is reserved.
          </p>

          <div className="bg-white rounded-3xl border border-soot/8 p-6 text-start mb-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-soot/8">
              <img src={space.images[0]} alt={space.name} className="w-14 h-14 rounded-2xl object-cover" />
              <div>
                <div className="font-semibold text-soot text-base">{space.name}</div>
                <div className="flex items-center gap-1 text-xs text-moss mt-0.5">
                  <MapPin size={11} />
                  <span>{space.city}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-moss text-xs">{t('tb.type')}</span>
                <span className="text-soot font-medium text-xs">{bookingType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss text-xs">{t('tb.plan')}</span>
                <span className="text-soot font-medium text-xs">
                  {isHourly
                    ? t(durationHours === 1 ? 'tb.hourlyReservationHeader' : 'tb.hourlyReservationHeaderMany', { count: durationHours })
                    : plan === 'daily'
                    ? t(durationDays === 1 ? 'bf.dailyPassTitle' : 'bf.dailyPassTitleMany', { count: durationDays })
                    : `${plan} pass`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss text-xs">{isHourly ? t('qr.bookingDate') : plan === 'daily' ? 'Date Range' : t('spaceDetails.startDate')}</span>
                <span className="text-soot font-medium text-xs">{plan === 'daily' ? formatDateRange(startDate, endDate) : startDate}</span>
              </div>
              {plan === 'daily' && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">{t('qr.duration')}</span>
                  <span className="text-soot font-medium text-xs">{durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                </div>
              )}
              {(isHourlySpace || isHourly) && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">{isHourly ? 'Time Window' : 'Daily Allowed Hours'}</span>
                  <span className="text-soot font-medium text-xs">{startTime} – {endTime} ({durationHours} {durationHours === 1 ? 'hour' : 'hours'}{isHourly ? '' : '/day'})</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-moss text-xs">{t('bf.reservedSeats')}</span>
                <span className="text-soot font-medium text-xs">{seats} seats</span>
              </div>

              {/* تفاصيل نقاط الولاء في شاشة التأكيد */}
              {!hasActiveSubscription && pointsDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">{t('tb.pointsRedeemed')}</span>
                  <span className="text-emerald-700 font-semibold text-xs">-{maxRedeemablePoints} pts (SAR {pointsDiscount})</span>
                </div>
              )}
              {!hasActiveSubscription && earnedPoints > 0 && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">{t('tb.pointsEarned')}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                    <Sparkles size={12} className="text-amber-500" />
                    +{earnedPoints} pts
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-soot/8 flex justify-between items-center font-semibold text-base">
                <span className="text-soot">{hasActiveSubscription ? 'Corporate Plan Status' : 'Total Paid (incl. VAT)'}</span>
                {hasActiveSubscription ? (
                  <span className="text-moss font-bold text-xs sm:text-sm bg-eucalyptus/25 px-3 py-1 rounded-full border border-eucalyptus/30">
                    {t('tb.coveredCorporate')}
                  </span>
                ) : finalPayablePrice === 0 ? (
                  <span className="text-moss font-bold text-xs sm:text-sm bg-eucalyptus/25 px-3 py-1 rounded-full border border-eucalyptus/30">
                    {t('tb.includedPaid0')}
                  </span>
                ) : (
                  <span className="text-soot font-bold text-lg">{t('common.sar')} {finalPayablePrice.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('team-bookings')}
              className="flex-1 py-3 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] font-medium text-sm transition-all shadow-xs border border-soot/8 cursor-pointer"
            >
              {t('footer.teamBookings')}
            </button>
            <button
              onClick={() => navigate('browse')}
              className="flex-1 py-3 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              {t('nav.browseSpaces')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-soot/12 bg-white hover:bg-plaster-dark/40 text-soot text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group active:scale-98"
          title={step === 0 ? t('tb.backToWorkspaceDetails') : t('bf.backToStep', { step })}
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />
          <span>{step === 0 ? t('bf.backToWorkspace') : t('bf.previousStep')}</span>
        </button>

        <span className="text-xs font-semibold text-moss">
          {t('tb.stepOf', { step: step + 1, total: STEPS.length })}
        </span>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1.5 mb-8">
        {STEPS.map((sk, i) => (
          <div key={sk} className="flex items-center gap-1.5 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
              i < step ? 'bg-eucalyptus text-soot' : i === step ? 'bg-soot text-plaster' : 'bg-soot/8 text-moss/50'
            }`}>
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'font-medium text-soot' : 'text-moss'}`}>{t(sk)}</span>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-eucalyptus' : 'bg-soot/10'}`} />}
          </div>
        ))}
      </div>

      {/* Space & Live Price Summary Card */}
      <div className="bg-white rounded-3xl border border-soot/8 p-5 mb-6 flex items-center justify-between gap-3.5 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-soot text-sm truncate">{space.name}</div>
            <div className="text-xs text-moss flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              <span>{space.city} · {space.availableCapacity} seats available</span>
              {(space.loyaltyPointsMultiplier || 1) > 1 && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
                  <Sparkles size={10} className="text-amber-500" />
                  {space.loyaltyPointsMultiplier}× Points
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Price Box */}
        <div className="text-end shrink-0 bg-plaster-dark/40 px-3.5 py-2 rounded-2xl border border-soot/10">
          {hasActiveSubscription ? (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wider text-moss block">
                {t('tb.corporateSubscription')}
              </span>
              <div className="font-bold text-emerald-800 text-xs sm:text-sm mt-0.5">
                {t('tb.activeCorporatePass')}
              </div>
              <div className="text-[10px] text-moss">
                Included in your Plan ({seats} seats)
              </div>
            </>
          ) : (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wider text-moss block">
                Total ({seats} seats)
              </span>
              <div className="font-bold text-soot text-base">
                {planInfo.isCovered ? `${t('common.sar')} 0` : `${t('common.sar')} ${finalPayablePrice.toLocaleString()}`}
              </div>
              <div className="text-[10px] text-moss">
                {planInfo.isCovered ? t('tb.includedInPlanSar0') : t('tb.perSeat', { currency: t('common.sar'), amount: pricePerSeat.toLocaleString() })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step 0: Type & Plan */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-soot/8 p-6 shadow-sm space-y-5">
            <h2 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {isHourlySpace ? t('tb.configHourly') : isOffice ? t('tb.selectOfficePlan') : t('tb.selectTypePlan')}
            </h2>

            {!isHourlySpace && !isOffice && (
              <div className="space-y-2.5">
                {[
                  { type: 'hot-desk' as BookingType, label: t('tb.hotDesks'), desc: t('tb.hotDesksDesc') },
                  { type: 'meeting-room' as BookingType, label: t('tb.meetingRoom'), desc: t('tb.meetingRoomDesc') },
                  { type: 'private-office' as BookingType, label: t('tb.privateOffice'), desc: t('tb.privateOfficeDesc') },
                ].map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => setBookingType(opt.type)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-start cursor-pointer ${
                      bookingType === opt.type
                        ? 'border-eucalyptus bg-[#E5ECE9]/60 shadow-xs'
                        : 'border-soot/8 bg-white hover:border-soot/20'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-soot text-sm">{opt.label}</div>
                      <div className="text-xs text-moss mt-0.5">{opt.desc}</div>
                    </div>
                    {bookingType === opt.type && <Check size={16} className="text-moss shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Plan selector */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-moss mb-3">{t('tb.choosePlan')}</h3>
              <div className={`grid gap-2 ${allowedPlans.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                {allowedPlans.map(p => {
                  const pInfo = getEffectiveSpacePrice(currentUser, space, p, bookingType, durationHours, durationMonths);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlan(p)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        plan === p
                          ? 'bg-[#DDE6DF] text-soot border-soot/20 shadow-xs font-semibold ring-2 ring-soot/10'
                          : 'bg-[#F9F8F5] border-soot/8 text-moss hover:text-soot'
                      }`}
                    >
                      <div className="text-xs capitalize font-semibold">{p}</div>
                      <div className="text-[10px] text-moss mt-0.5">
                        {hasActiveSubscription || pInfo.isCovered ? t('tb.includedInPlanShort') : t('tb.perSeat', { currency: t('common.sar'), amount: pInfo.effectivePrice })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly duration selector */}
            {plan === 'monthly' && (
              <div className="p-4 rounded-2xl bg-[#F9F8F5] border border-soot/8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>{t('spaceDetails.selectMonths')}</span>
                  </span>
                  <span className="text-xs font-bold text-soot">
                    {t(durationMonths > 1 ? 'spaceDetails.monthsCountMany' : 'spaceDetails.monthsCount', { count: durationMonths })} ({hasActiveSubscription || planInfo.isCovered ? t('tb.includedInCorporate') : t('tb.perSeat', { currency: t('common.sar'), amount: getMonthlyPriceForDuration(space, durationMonths).toLocaleString() })})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        durationMonths === m
                          ? 'bg-[#DDE6DF] border-soot/20 text-soot shadow-2xs font-semibold ring-2 ring-soot/10'
                          : 'bg-white border-soot/10 text-moss hover:text-soot'
                      }`}
                    >
                      <div>{m} Mo{m > 1 ? 's' : ''}</div>
                      <div className="text-[10px] font-bold text-soot mt-0.5">
                        {hasActiveSubscription ? t('booking.included') : `${t('common.sar')} ${getMonthlyPriceForDuration(space, m).toLocaleString()}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly Booking Policy Notice for Theaters & Halls */}
            {isHourlySpace && (
              <div className="p-4 rounded-2xl bg-eucalyptus/20 border border-eucalyptus/30 text-xs flex items-start gap-2.5">
                <Clock size={16} className="text-moss shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-soot block">{t('tb.hourlyPolicy')}</span>
                  <span className="text-moss text-[11px] leading-relaxed">
                    {t('tb.hourlyNotice', { hours: localizeTime(space.openHours) || t('bf.operatingHoursApply') })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Team Members */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                {t('tb.assignMembers')}
              </h2>
              <p className="text-moss text-xs mt-0.5">{t('tb.selectMembersHint')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-moss">
                {selectedEmployees.length} of {employees.length} selected
              </span>
              {employees.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-plaster-dark/60 hover:bg-[#DDE6DF] text-soot border border-soot/10 transition-all cursor-pointer"
                >
                  {allEmployeesSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
          </div>

          {employees.length === 0 ? (
            <div className="p-4 rounded-2xl bg-plaster text-xs text-moss text-center">
              No employees registered. You can still book {seats} seats for unnamed team members.
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Select All Option Row */}
              <button
                type="button"
                onClick={toggleSelectAll}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                  allEmployeesSelected
                    ? 'border-eucalyptus bg-[#E5ECE9]/60 shadow-xs'
                    : 'border-soot/12 bg-plaster-dark/25 hover:border-soot/25'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition-colors ${
                    allEmployeesSelected
                      ? 'border-eucalyptus bg-eucalyptus text-white'
                      : selectedEmployees.length > 0
                      ? 'border-eucalyptus/60 bg-eucalyptus/20 text-soot'
                      : 'border-soot/25 bg-white'
                  }`}
                >
                  {allEmployeesSelected ? (
                    <Check size={12} />
                  ) : selectedEmployees.length > 0 ? (
                    <div className="w-2 h-0.5 bg-soot/70 rounded-full" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-soot">{t('tb.selectAll')}</div>
                  <div className="text-xs text-moss">
                    {allEmployeesSelected
                      ? t(seats > 1 ? 'tb.allSelectedMany' : 'tb.allSelected', { count: employees.length, seats })
                      : t('tb.assignAll', { count: employees.length })}
                  </div>
                </div>
              </button>

              <div className="pt-1 space-y-2">
                {employees.map(emp => {
                  const isSelected = selectedEmployees.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-eucalyptus bg-[#E5ECE9]/60 shadow-xs'
                          : 'border-soot/8 bg-white hover:border-soot/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${
                        isSelected ? 'border-eucalyptus bg-eucalyptus text-white' : 'border-soot/20'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-soot">{emp.name}</div>
                        <div className="text-xs text-moss">{emp.department} · {emp.email}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Schedule & Seats */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {t('tb.scheduleCapacity')}
            </h2>
            <p className="text-moss text-xs">{t('tb.setDatesSeats')}</p>
          </div>

          <div className="space-y-4">
            {/* Daily Date Range Selector (for standard office/desk spaces) */}
            {plan === 'daily' && !isHourlySpace ? (
              <div className="space-y-4 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{t('spaceDetails.startDate')}</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => handleStartDateChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus font-medium shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{t('spaceDetails.endDate')}</span>
                    </label>
                    <input
                      type="date"
                      value={dailyEndDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      onChange={e => handleEndDateChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus font-medium shadow-2xs"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-soot/8 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-moss block text-[10px] uppercase font-semibold">{t('bf.selectedRange')}</span>
                    <span className="font-semibold text-soot text-sm">{formatDateRange(startDate, effectiveDailyEndDate)}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-moss block text-[10px] uppercase font-semibold">{t('bf.totalDuration')}</span>
                    <span className="font-semibold text-soot text-sm">{durationDays} {durationDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-moss flex items-center gap-1.5">
                  <Info size={13} className="shrink-0 text-moss/80" />
                  <span>{t('tb.dailyContinuous')}</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>{isHourlySpace ? t('spaceDetails.reservationDate') : t('spaceDetails.startDate')}</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    handleStartDateChange(e.target.value);
                    setDailyEndDate(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus font-medium"
                />
              </div>
            )}

            {/* Hourly Duration & Session Selector for Theaters and Halls */}
            {isHourlySpace && (
              <div className="space-y-4 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{t('tb.hourlyDurationSession')}</span>
                    </h4>
                    <p className="text-xs text-moss mt-0.5">
                      {t('tb.sessionWithinHours', { hours: localizeTime(space.openHours) || t('spaceDetails.standardHours') })}
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
                    {[1, 2, 3, 4, 6, 8].map((h) => {
                      const isSelected = selectedHours === h;
                      const hPrice = getEffectiveSpacePrice(currentUser, space, 'hourly', bookingType, h, 1, seats);
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
                            {hasActiveSubscription && hPrice.isCovered ? t('tb.corporatePlan') : `${t('common.sar')} ${hPrice.effectivePrice.toLocaleString()}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                )}

                {unitList.length > 0 && (
                  <UnitPicker units={unitList} selectedId={selectedUnit?.id || ''} onSelect={setUnitId} />
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{t('spaceDetails.sessionStart')}</span>
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{t('spaceDetails.sessionEnd')}</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`${localizeTime(endTime)} (${t(durationHours === 1 ? 'bf.durationHourOne' : 'bf.durationHourMany', { count: durationHours })})`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-soot/5 border border-soot/10 text-moss text-sm font-medium cursor-not-allowed shadow-2xs"
                    />
                  </div>
                </div>

                  </>
                )}

                <div className="bg-white rounded-2xl p-4 border border-soot/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-moss block text-[10px] uppercase font-semibold">
                      {t('spaceDetails.reservationWindow')}
                    </span>
                    <span className="font-semibold text-soot text-sm">
                      {startDate} · {startTime} – {endTime} ({durationHours} {durationHours === 1 ? 'hour' : 'hours'})
                    </span>
                  </div>
                  <div className="text-start sm:text-end">
                    <span className="text-moss block text-[10px] uppercase font-semibold">{t('tb.operatingHours')}</span>
                    <span className="font-semibold text-soot text-sm">{space.openHours || 'Standard Operating Hours'}</span>
                  </div>
                </div>
                <div className="text-[11px] text-moss flex items-center gap-1.5">
                  <Info size={13} className="shrink-0 text-moss/80" />
                  <span>{t('tb.accessHours')}</span>
                </div>
              </div>
            )}

            {/* Seat Quantity Selector in Schedule Step */}
            <div className="space-y-3 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                    <Users size={13} />
                    <span>{t('tb.numTeamSeats')}</span>
                  </h4>
                  <p className="text-xs text-moss mt-0.5">
                    {t('tb.specifySeats')}
                  </p>
                </div>
                <span className="text-xs font-bold text-soot bg-white px-3 py-1 rounded-full border border-soot/10 shadow-2xs">
                  {seats} {seats === 1 ? 'Seat' : 'Seats'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSeats(s => Math.max(selectedEmployees.length || 1, s - 1))}
                  disabled={seats <= (selectedEmployees.length || 1)}
                  className="w-10 h-10 rounded-xl border border-soot/15 bg-white text-soot font-bold text-lg flex items-center justify-center hover:bg-plaster-dark/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  –
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-serif-display font-normal text-soot">{seats}</span>
                  <span className="text-xs text-moss ms-1">{seats === 1 ? 'seat' : 'seats'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSeats(s => Math.min((seatCap ?? (space.availableCapacity || 50)), s + 1))}
                  disabled={seats >= ((seatCap ?? (space.availableCapacity || 50)))}
                  className="w-10 h-10 rounded-xl border border-soot/15 bg-white text-soot font-bold text-lg flex items-center justify-center hover:bg-plaster-dark/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1, 2, 3, 5, 10, 15, 20].filter(n => n >= (selectedEmployees.length || 1) && n <= ((seatCap ?? (space.availableCapacity || 50)))).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeats(n)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      seats === n
                        ? 'bg-soot text-plaster border-soot'
                        : 'bg-white text-moss border-soot/15 hover:border-soot/40 hover:text-soot'
                    }`}
                  >
                    {n} {n === 1 ? 'Seat' : 'Seats'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Box in Schedule Step */}
            {hasActiveSubscription ? (
              <div className="p-4 rounded-2xl bg-[#E5ECE9]/60 border border-eucalyptus/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-soot block">{t('tb.corporateSubPlan')}</span>
                  <span className="text-[11px] text-moss">
                    All {seats} {seats === 1 ? 'seat' : 'seats'} fully covered under active corporate membership
                  </span>
                </div>
                <div className="text-end">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eucalyptus/40 text-soot font-semibold text-xs border border-eucalyptus/50">
                    <Check size={12} className="text-moss shrink-0" />
                    <span>{t('myBookings.coveredByPass')}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-soot block">{t('tb.calculatedTotal')}</span>
                  <span className="text-[11px] text-moss">
                    {plan === 'daily'
                      ? t('tb.seatsTimes', { seats, currency: t('common.sar'), amount: ((space.pricing?.daily ?? 150) * durationDays).toLocaleString(), rate: space.pricing?.daily ?? 150, days: durationDays, unit: durationDays === 1 ? t('bf.dayUnit') : t('bf.daysUnit') })
                      : t('tb.seatsTimesPlan', { seats, currency: t('common.sar'), amount: planInfo.originalPrice.toLocaleString(), label: planLabel })}
                  </span>
                </div>
                <div className="text-end">
                  <span className="text-lg font-bold text-soot">
                    {planInfo.isCovered ? `${t('common.sar')} 0` : `${t('common.sar')} ${finalPayablePrice.toLocaleString()}`}
                  </span>
                  {planInfo.isCovered && (
                    <span className="text-[10px] text-emerald-800 font-semibold block">{t('spaceDetails.includedInPass')}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Review & Payment */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {hasActiveSubscription ? t('tb.reviewTeam') : t('tb.reviewTeamPay')}
            </h2>
            <p className="text-moss text-xs">
              {hasActiveSubscription
                ? t('tb.confirmAllocation')
                : t('tb.confirmBreakdown')}
            </p>
          </div>

          <div className="space-y-4">
            {/* Details Box */}
            <div className="p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8 divide-y divide-soot/6 text-sm">
              <div className="pb-2.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-moss">{t('bf.workspace')}</span>
                  <span className="text-soot font-medium">{space.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-moss">{t('tb.type')}</span>
                  <span className="text-soot font-medium capitalize">{bookingType.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-moss">{t('tb.plan')}</span>
                  <span className="text-soot font-medium">
                    {isHourly
                      ? `Hourly Reservation (${durationHours} ${durationHours === 1 ? 'hour' : 'hours'})`
                      : plan === 'daily'
                      ? t(durationDays === 1 ? 'bf.dailyPassTitle' : 'bf.dailyPassTitleMany', { count: durationDays })
                      : `${plan} pass`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-moss">{isHourly ? t('qr.bookingDate') : plan === 'daily' ? 'Date Range' : t('spaceDetails.startDate')}</span>
                  <span className="text-soot font-medium">{plan === 'daily' ? formatDateRange(startDate, endDate) : startDate}</span>
                </div>
                {plan === 'daily' && (
                  <div className="flex justify-between">
                    <span className="text-moss">{t('qr.duration')}</span>
                    <span className="text-soot font-medium">{durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                  </div>
                )}
                {(isHourlySpace || isHourly) && (
                  <div className="flex justify-between">
                    <span className="text-moss">{isHourly ? 'Time Window' : 'Daily Allowed Hours'}</span>
                    <span className="text-soot font-medium">{startTime} – {endTime} ({durationHours} {durationHours === 1 ? 'hour' : 'hours'}{isHourly ? '' : '/day'})</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="text-moss block">{t('bf.reservedSeats')}</span>
                    <span className="text-[10px] text-moss/70">{t('tb.adjustQuantity')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSeats(s => Math.max(selectedEmployees.length || 1, s - 1))}
                      disabled={seats <= (selectedEmployees.length || 1)}
                      className="w-7 h-7 rounded-lg border border-soot/15 bg-white text-soot font-bold flex items-center justify-center hover:bg-plaster-dark/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-sm shadow-2xs"
                      title={t('tb.decrease')}
                    >
                      –
                    </button>
                    <span className="text-soot font-bold min-w-[2rem] text-center text-sm">{seats}</span>
                    <button
                      type="button"
                      onClick={() => setSeats(s => Math.min((seatCap ?? (space.availableCapacity || 50)), s + 1))}
                      disabled={seats >= ((seatCap ?? (space.availableCapacity || 50)))}
                      className="w-7 h-7 rounded-lg border border-soot/15 bg-white text-soot font-bold flex items-center justify-center hover:bg-plaster-dark/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-sm shadow-2xs"
                      title={t('tb.increase')}
                    >
                      +
                    </button>
                  </div>
                </div>
                {selectedEmployees.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-moss">{t('tb.assignedMembers')}</span>
                    <span className="text-soot font-medium">{selectedEmployees.length} members</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Seat Counter / Stepper in Checkout Summary */}
            <div className="p-4 rounded-2xl bg-[#F9F8F5] border border-soot/8 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-soot flex items-center gap-1.5">
                    <Users size={14} className="text-moss" />
                    <span>{t('tb.adjustSeats')}</span>
                  </h4>
                  <p className="text-[11px] text-moss">
                    {t('tb.recalc')}
                  </p>
                </div>
                <span className="text-xs font-bold text-soot bg-white px-2.5 py-0.5 rounded-full border border-soot/10 shadow-2xs">
                  {seats} {seats === 1 ? 'Seat' : 'Seats'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[1, 2, 3, 5, 10, 15, 20].filter(n => n >= (selectedEmployees.length || 1) && n <= ((seatCap ?? (space.availableCapacity || 50)))).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeats(n)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      seats === n
                        ? 'bg-soot text-plaster border-soot shadow-2xs'
                        : 'bg-white text-moss border-soot/12 hover:border-soot/40 hover:text-soot'
                    }`}
                  >
                    {n} {n === 1 ? 'Seat' : 'Seats'}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveSubscription ? (
              /* Corporate Subscription Plan Coverage Card (No Prices Displayed) */
              <div className="p-5 rounded-2xl bg-[#E5ECE9]/60 border-2 border-eucalyptus/40 space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-soot/8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-700" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-soot">
                      {t('tb.planCoverage')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                    {t('bf.activePass')}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-moss">{t('bf.coveredBy')}</span>
                    <span className="font-semibold text-soot">{currentUser?.orgName || currentUser?.businessName || currentUser?.membershipTier || 'Corporate Pass'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-moss">{t('tb.allocatedSeats')}</span>
                    <span className="font-semibold text-soot">{seats} {seats > 1 ? 'Seats' : 'Seat'} (Included)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-moss">{t('bf.paymentRequired')}</span>
                    <span className="font-semibold text-emerald-800">{t('tb.noneCorporate')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-soot/8 flex items-center gap-2 text-[11px] text-moss">
                  <Info size={13} className="shrink-0 text-emerald-700" />
                  <span>{t('tb.allCovered')}</span>
                </div>
              </div>
            ) : (
              <>
                {/* قسم نقاط الولاء (Redeem Loyalty Points) */}
                <div className="p-5 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-soot">{t('tb.loyaltyRewards')}</div>
                        <div className="text-xs text-moss mt-0.5">
                          You have <strong className="text-soot">{availablePoints}</strong> points. (100 pts = SAR 25 discount)
                        </div>
                      </div>
                    </div>

                    {availablePoints >= 100 && maxRedeemablePoints >= 100 && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useLoyaltyPoints}
                          onChange={e => setUseLoyaltyPoints(e.target.checked)}
                          className="w-4 h-4 rounded accent-soot cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-soot">
                          Use {maxRedeemablePoints} pts (-SAR {(maxRedeemablePoints / 100) * 25})
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="pt-2 border-t border-soot/8 flex items-center justify-between text-xs">
                    <span className="text-moss">{t('tb.pointsToEarn')}</span>
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" />
                      +{earnedPoints} points {multiplier > 1 ? `(${multiplier}× promotion)` : ''}
                    </span>
                  </div>
                </div>

                {/* Digital Wallet / Corporate Shared Wallet Redemption Widget */}
                {currentUser && userWalletBalance > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-emerald-700 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-soot">
                            {isUsingCompanyWallet ? t('tb.sharedWallet') : t('bf.walletBalance')}
                          </div>
                          <div className="text-[11px] text-moss">Available Balance: {t('common.sar')} {userWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      {userWalletBalance > 0 && finalPayablePrice > 0 && (
                        <label className="flex items-center gap-2 text-xs font-semibold text-soot cursor-pointer bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={useWalletBalance}
                            onChange={(e) => setUseWalletBalance(e.target.checked)}
                            className="rounded border-soot/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>{isUsingCompanyWallet ? t('tb.useShared', { currency: t('common.sar'), amount: walletDeduction.toLocaleString() }) : t('tb.useWalletTeam', { currency: t('common.sar'), amount: walletDeduction.toLocaleString() })}</span>
                        </label>
                      )}
                    </div>
                    {useWalletBalance && walletDeduction > 0 && (
                      <div className="text-[11px] font-medium text-emerald-950 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                        <span>{isUsingCompanyWallet ? t('tb.sharedApplied') : t('bf.walletApplied')}</span>
                        <span className="font-bold text-emerald-700">- {t('common.sar')} {walletDeduction.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Prominent Price Breakdown Box */}
                <div className="p-5 rounded-2xl bg-white border-2 border-soot/10 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
                    <Receipt size={16} className="text-moss" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-soot">
                      {t('bf.priceBreakdown')}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-moss">
                      {t('bf.ratePerSeat', { detail: isHourly ? `${localizeTime(startTime)} – ${localizeTime(endTime)} (${t('bf.unitHour', { count: durationHours })})` : plan === 'monthly' ? t('myBookings.monthlyMo', { count: durationMonths }) : plan === 'daily' ? t('tb.ratePerSeatDetail', { days: durationDays, unit: durationDays === 1 ? t('bf.dayUnit') : t('bf.daysUnit'), currency: t('common.sar'), rate: space.pricing?.daily ?? 150 }) : t(('booking.planPass.' + plan) as never) })}
                    </span>
                    <span className="text-soot font-medium">
                      {planInfo.isCovered ? t('bf.includedInPlan') : `${t('common.sar')} ${planInfo.originalPrice.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-moss">{t('qr.seats')}</span>
                    <span className="text-soot font-medium">× {seats}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-moss">{t('bf.subtotal')}</span>
                    <span className="text-soot font-medium">
                      {planInfo.isCovered ? t('bf.includedInPlan') : `${t('common.sar')} ${(planInfo.originalPrice * seats).toLocaleString()}`}
                    </span>
                  </div>
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-moss">Loyalty Points Discount ({maxRedeemablePoints} pts)</span>
                      <span className="text-emerald-700 font-semibold">-SAR {pointsDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {walletDeduction > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-moss">{t('bf.walletApplied')}</span>
                      <span className="text-emerald-700 font-semibold">-SAR {walletDeduction.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-moss">VAT (15% included)</span>
                    <span className="text-soot font-medium">
                      {planInfo.isCovered ? `${t('common.sar')} 0` : `${t('common.sar')} ${((finalPayablePrice) * 0.15).toFixed(0)}`}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-soot/10 flex justify-between items-center bg-plaster-dark/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                    <div>
                      <span className="text-sm font-bold text-soot block">{t('bf.totalPayable')}</span>
                      <span className="text-xs text-moss">{t('tb.corporateBilling')}</span>
                    </div>
                    <div className="text-end">
                      {totalPriceToPay === 0 ? (
                        <div>
                          <span className="text-2xl font-bold text-soot">{t('bf.zeroToPay')}</span>
                          <div className="text-xs text-moss font-semibold bg-eucalyptus/25 border border-eucalyptus/30 px-2.5 py-0.5 rounded-full inline-block ms-2">
                            {walletDeduction >= finalPayablePrice && finalPayablePrice > 0 ? t('tb.paidWithWallet') : 'Included in your Plan'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-soot">{t('common.sar')} {totalPriceToPay.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={back}
          className="py-3 px-6 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < 3 ? (
          <button
            onClick={next}
            className="flex-1 py-3 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer"
          >
            <span>{t('tb.continue')}</span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                if (!space) return;
                addToCart({
                  spaceId: space.id,
                  spaceName: space.name,
                  spaceCity: space.city,
                  spaceAddress: space.address || space.city,
                  spaceImage: space.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
                  type: bookingType,
                  plan: plan,
                  unitId: selectedUnit?.id,
                  unitName: selectedUnit?.name,
                  durationHours: isHourly ? durationHours : undefined,
                  durationDays: plan === 'daily' ? durationDays : undefined,
                  durationMonths: plan === 'monthly' ? durationMonths : undefined,
                  startTime: isHourly ? startTime : undefined,
                  endTime: isHourly ? endTime : undefined,
                  startDate: startDate,
                  endDate: endDate,
                  seats: seats,
                  employees: selectedEmployees,
                  pricePerSeat: hasActiveSubscription ? 0 : pricePerSeat,
                  itemTotal: hasActiveSubscription ? 0 : finalPayablePrice,
                });
                navigate('browse');
              }}
              className="py-3 px-5 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <ShoppingBag size={15} />
              <span>{hasActiveSubscription ? t('spaceDetails.addToCartCovered') : finalPayablePrice === 0 ? t('tb.addToCartIncluded') : t('bf.addToCart')}</span>
            </button>

            <button
              onClick={confirmBooking}
              disabled={loading}
              className="flex-1 py-3 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>{t('tb.confirming')}</span>
              ) : hasActiveSubscription ? (
                <>
                  <Check size={15} className="text-moss" />
                  <span>Confirm Reservation (Covered by Corporate Pass)</span>
                </>
              ) : finalPayablePrice === 0 ? (
                <>
                  <Check size={15} className="text-moss" />
                  <span>Confirm Reservation (Included in your Plan · SAR 0 to Pay)</span>
                </>
              ) : (
                <>
                  <CreditCard size={15} />
                  <span>Confirm Reservation (SAR {finalPayablePrice.toLocaleString()})</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
