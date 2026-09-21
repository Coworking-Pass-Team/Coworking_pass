'use client';

import { useState, useRef, useEffect } from 'react';
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
import { useApp } from '@/app/store';
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
  START_TIMES,
  END_TIMES,
  calculateDurationHours,
  getAvailableEndTimes,
  getFilteredStartTimes,
  getFilteredEndTimes,
  formatHourlyTimeRange,
  timeStringToMinutes
} from '@/types/types';

const STEPS = ['Type & Plan', 'Team', 'Schedule', 'Review'];
const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8];

export default function TeamBooking() {
  const { nav, goBack, spaces, bookings, currentUser, addBooking, navigate, showToast, addToCart, updateCurrentUser, withdrawFromWallet, companyWalletBalance, fetchCompanyWallet } = useApp();
  const spaceId = nav.params?.spaceId;
  const space = spaces.find((s: Space) => s.id === spaceId);

  const isHourlySpace = isHourlyAllowed(space);
  const isOffice = isOfficeSpace(space?.type);
  const allowedPlans = getAllowedPlansForSpace(space);

  const defaultInitialPlan: BookingPlan = (nav?.params?.plan as BookingPlan && allowedPlans.includes(nav?.params?.plan as BookingPlan))
    ? (nav.params.plan as BookingPlan)
    : (allowedPlans[0] || 'daily');
  const initialMonths = (nav?.params?.durationMonths as number) || 1;
  const initialStartDate = (nav?.params?.startDate as string) || new Date().toISOString().split('T')[0];
  const initialEndDate = (nav?.params?.endDate as string) || initialStartDate;

  const defaultAvailableStarts = isHourlySpace ? getFilteredStartTimes(space?.openHours, initialStartDate, 2) : START_TIMES;
  const initialStartTime = (nav?.params?.startTime as string) || (defaultAvailableStarts.includes('09:00 AM') ? '09:00 AM' : (defaultAvailableStarts[0] || '09:00 AM'));
  const defaultAvailableEnds = isHourlySpace ? [calculateEndTime(initialStartTime, 2)] : getAvailableEndTimes(initialStartTime);
  const initialEndTime = isHourlySpace
    ? calculateEndTime(initialStartTime, 2)
    : (nav?.params?.endTime as string) || (nav?.params?.durationHours
      ? calculateEndTime(initialStartTime, Math.min(4, nav.params.durationHours as number))
      : (defaultAvailableEnds.includes('05:00 PM') ? '05:00 PM' : (defaultAvailableEnds[0] || '05:00 PM')));

  const [step, setStep] = useState(0);
  const [bookingType, setBookingType] = useState<BookingType>(space?.type || 'hot-desk');
  const [plan, setPlan] = useState<BookingPlan>(defaultInitialPlan);
  const [durationMonths, setDurationMonths] = useState<number>(initialMonths);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [dailyEndDate, setDailyEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>(initialEndTime);
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  const availableStartTimes = isHourlySpace ? getFilteredStartTimes(space?.openHours, startDate, 2) : START_TIMES;
  const availableEndTimes = isHourlySpace ? [calculateEndTime(startTime, 2)] : getAvailableEndTimes(startTime);

  const durationHours = isHourlySpace ? 2 : calculateDurationHours(startTime, endTime);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (isHourlySpace) {
      setEndTime(calculateEndTime(newStart, 2));
    } else {
      const validEnds = getAvailableEndTimes(newStart);
      const startMin = timeStringToMinutes(newStart);
      const endMin = timeStringToMinutes(endTime);
      if (endMin <= startMin || !validEnds.includes(endTime)) {
        setEndTime(validEnds[0] || calculateEndTime(newStart, 1));
      }
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    if (!isHourlySpace) {
      setEndTime(newEnd);
    }
  };

  const [seats, setSeats] = useState(2);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (dailyEndDate && newStart > dailyEndDate) {
      setDailyEndDate(newStart);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    if (newEnd < startDate) {
      showToast('End date cannot be earlier than start date.', 'error');
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

  const isHourly = isHourlySpace && plan === 'hourly';
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
    ? `for ${durationHours} hours`
    : plan === 'monthly'
    ? `for ${durationMonths} month${durationMonths > 1 ? 's' : ''}`
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
        showToast('Please select a booking date.', 'error');
        return false;
      }
      if (plan === 'daily') {
        if (!dailyEndDate) {
          showToast('Please select an end date.', 'error');
          return false;
        }
        if (dailyEndDate < startDate) {
          showToast('End date must be the same day or later than start date.', 'error');
          return false;
        }
      }
      if (isHourlySpace || isHourly) {
        if (!startTime || !endTime) {
          showToast('Please select both a start time and an end time.', 'error');
          return false;
        }
        const hoursCheck = isTimeWithinOpenHours(startDate, startTime, endTime, space.openHours);
        if (!hoursCheck.valid) {
          showToast(hoursCheck.reason || 'Requested time is outside space operating hours.', 'error');
          return false;
        }
        const overlapCheck = checkSpaceOverlap(bookings, space.id, startDate, startTime, endTime, space.totalCapacity);
        if (!overlapCheck.available) {
          showToast(`This space does not have enough capacity for ${seats} seats at ${startTime}.`, 'error');
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
        navigate('company-bookings');
      }
      return;
    }
    setStep(s => s - 1);
  };

  const confirmBooking = () => {
    setLoading(true);
    setTimeout(() => {
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
      });

      if (useWalletBalance && walletDeduction > 0) {
        if (!isUsingCompanyWallet && withdrawFromWallet) {
          withdrawFromWallet(walletDeduction, `Team booking payment for ${space.name}`);
        } else if (fetchCompanyWallet) {
          setTimeout(() => fetchCompanyWallet(currentUser.companyId), 1200);
        }
      }

      // تحديث نقاط الولاء للمؤسسة / المستخدم
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
        `Team workspace reserved! Earned ${earnedPoints} points${pointsUsed > 0 ? ` and redeemed ${pointsUsed} points` : ''}.`,
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
            Team booking confirmed!
          </h1>
          <p className="text-moss text-xs sm:text-sm mb-8 font-normal">
            Your workspace for {seats} team member{seats > 1 ? 's' : ''} is reserved.
          </p>

          <div className="bg-white rounded-3xl border border-soot/8 p-6 text-left mb-6 shadow-sm">
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
                <span className="text-moss text-xs">Type</span>
                <span className="text-soot font-medium text-xs">{bookingType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss text-xs">Plan</span>
                <span className="text-soot font-medium text-xs">
                  {isHourly
                    ? `Hourly Reservation (${durationHours} ${durationHours === 1 ? 'hour' : 'hours'})`
                    : plan === 'daily'
                    ? `Daily Pass (${durationDays} ${durationDays === 1 ? 'Day' : 'Days'})`
                    : `${plan} pass`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss text-xs">{isHourly ? 'Booking Date' : plan === 'daily' ? 'Date Range' : 'Start Date'}</span>
                <span className="text-soot font-medium text-xs">{plan === 'daily' ? formatDateRange(startDate, endDate) : startDate}</span>
              </div>
              {plan === 'daily' && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">Duration</span>
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
                <span className="text-moss text-xs">Reserved Seats</span>
                <span className="text-soot font-medium text-xs">{seats} seats</span>
              </div>

              {/* تفاصيل نقاط الولاء في شاشة التأكيد */}
              {!hasActiveSubscription && pointsDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">Points Redeemed</span>
                  <span className="text-emerald-700 font-semibold text-xs">-{maxRedeemablePoints} pts (SAR {pointsDiscount})</span>
                </div>
              )}
              {!hasActiveSubscription && earnedPoints > 0 && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">Points Earned</span>
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
                    Covered by Corporate Subscription Pass
                  </span>
                ) : finalPayablePrice === 0 ? (
                  <span className="text-moss font-bold text-xs sm:text-sm bg-eucalyptus/25 px-3 py-1 rounded-full border border-eucalyptus/30">
                    Included in your Plan · SAR 0 Paid
                  </span>
                ) : (
                  <span className="text-soot font-bold text-lg">SAR {finalPayablePrice.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('team-bookings')}
              className="flex-1 py-3 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] font-medium text-sm transition-all shadow-xs border border-soot/8 cursor-pointer"
            >
              Team Bookings
            </button>
            <button
              onClick={() => navigate('browse')}
              className="flex-1 py-3 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              Browse Spaces
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
          title={step === 0 ? 'Back to Workspace Details' : `Back to Step ${step}`}
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>{step === 0 ? 'Back to Workspace' : 'Previous Step'}</span>
        </button>

        <span className="text-xs font-semibold text-moss">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
              i < step ? 'bg-eucalyptus text-soot' : i === step ? 'bg-soot text-plaster' : 'bg-soot/8 text-moss/50'
            }`}>
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'font-medium text-soot' : 'text-moss'}`}>{s}</span>
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
        <div className="text-right shrink-0 bg-plaster-dark/40 px-3.5 py-2 rounded-2xl border border-soot/10">
          {hasActiveSubscription ? (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wider text-moss block">
                Corporate Subscription
              </span>
              <div className="font-bold text-emerald-800 text-xs sm:text-sm mt-0.5">
                Active Corporate Pass
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
                {planInfo.isCovered ? 'SAR 0' : `SAR ${finalPayablePrice.toLocaleString()}`}
              </div>
              <div className="text-[10px] text-moss">
                {planInfo.isCovered ? 'Included in Pass · SAR 0 to Pay' : `SAR ${pricePerSeat.toLocaleString()}/seat`}
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
              {isHourlySpace ? 'Configure Hourly Reservation' : isOffice ? 'Select Office Pass Plan' : 'Select Workspace Type & Plan'}
            </h2>

            {!isHourlySpace && !isOffice && (
              <div className="space-y-2.5">
                {[
                  { type: 'hot-desk' as BookingType, label: 'Hot Desks', desc: 'Flexible open seating for your team' },
                  { type: 'meeting-room' as BookingType, label: 'Meeting Room', desc: 'Private room for client presentations and collaborative sessions' },
                  { type: 'private-office' as BookingType, label: 'Private Office', desc: 'Dedicated lockable office space for team focus' },
                ].map(t => (
                  <button
                    key={t.type}
                    onClick={() => setBookingType(t.type)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                      bookingType === t.type
                        ? 'border-eucalyptus bg-[#E5ECE9]/60 shadow-xs'
                        : 'border-soot/8 bg-white hover:border-soot/20'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-soot text-sm">{t.label}</div>
                      <div className="text-xs text-moss mt-0.5">{t.desc}</div>
                    </div>
                    {bookingType === t.type && <Check size={16} className="text-moss shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Plan selector */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-moss mb-3">Choose Plan</h3>
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
                        {hasActiveSubscription || pInfo.isCovered ? 'Included in Plan' : `SAR ${pInfo.effectivePrice}/seat`}
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
                    <span>Select Number of Months</span>
                  </span>
                  <span className="text-xs font-bold text-soot">
                    {durationMonths} Month{durationMonths > 1 ? 's' : ''} ({hasActiveSubscription || planInfo.isCovered ? 'Included in Corporate Plan' : `SAR ${getMonthlyPriceForDuration(space, durationMonths).toLocaleString()}/seat`})
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
                        {hasActiveSubscription ? 'Included' : `SAR ${getMonthlyPriceForDuration(space, m).toLocaleString()}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Hours Policy Notice for Theaters & Halls */}
            {isHourlySpace && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs flex items-start gap-2.5">
                <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-soot block">Allowed Daily Hours Policy for Theaters & Halls</span>
                  <span className="text-moss text-[11px] leading-relaxed">
                    Reservations for this venue are booked on a Daily Pass basis with a 2-hour session within the venue operating hours ({space.openHours || 'Operating hours apply'}). You will select your 2-hour time slot in the Schedule step.
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
                Assign Team Members
              </h2>
              <p className="text-moss text-xs mt-0.5">Select members to assign or use Select All</p>
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
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
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
                  <div className="text-sm font-semibold text-soot">Select All Team Members</div>
                  <div className="text-xs text-moss">
                    {allEmployeesSelected
                      ? `All ${employees.length} members selected (${seats} seat${seats > 1 ? 's' : ''})`
                      : `Assign all ${employees.length} team members at once`}
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
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
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
              Schedule & Team Capacity
            </h2>
            <p className="text-moss text-xs">Set booking dates and total seats for your team</p>
          </div>

          <div className="space-y-4">
            {/* Daily Date Range Selector (for standard office/desk spaces) */}
            {plan === 'daily' && !isHourlySpace ? (
              <div className="space-y-4 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>Start Date</span>
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
                      <span>End Date</span>
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
                    <span className="text-moss block text-[10px] uppercase font-semibold">Selected Date Range</span>
                    <span className="font-semibold text-soot text-sm">{formatDateRange(startDate, effectiveDailyEndDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-moss block text-[10px] uppercase font-semibold">Total Duration</span>
                    <span className="font-semibold text-soot text-sm">{durationDays} {durationDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-moss flex items-center gap-1.5">
                  <Info size={13} className="shrink-0 text-moss/80" />
                  <span>Daily passes apply continuously across all selected calendar days.</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>{isHourlySpace ? 'Reservation Date' : 'Start Date'}</span>
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

            {/* 2-Hour Daily Session Selector for Theaters and Halls within Operating Hours */}
            {isHourlySpace && (
              <div className="space-y-4 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Select 2-Hour Daily Session</span>
                    </h4>
                    <p className="text-xs text-moss mt-0.5">
                      Session within workspace operating hours: {space.openHours || 'Standard Operating Hours'}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap">
                    2 Hours Session (Fixed)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Session Start Time</span>
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                    >
                      {availableStartTimes.map((t) => (
                        <option key={t} value={t}>
                          {t} – {calculateEndTime(t, 2)} (2 Hours)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Session End Time</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`${endTime} (2 Hours Fixed)`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-soot/5 border border-soot/10 text-moss text-sm font-medium cursor-not-allowed shadow-2xs"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-soot/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-moss block text-[10px] uppercase font-semibold">
                      Daily Session Window
                    </span>
                    <span className="font-semibold text-soot text-sm">
                      {startDate} · {startTime} – {endTime}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-moss block text-[10px] uppercase font-semibold">Workspace Operating Hours</span>
                    <span className="font-semibold text-soot text-sm">{space.openHours || 'Standard Operating Hours'}</span>
                  </div>
                </div>
                <div className="text-[11px] text-moss flex items-center gap-1.5">
                  <Info size={13} className="shrink-0 text-moss/80" />
                  <span>Access is granted strictly during your selected hours for each day of the reservation period.</span>
                </div>
              </div>
            )}

            {/* Pricing Box in Schedule Step */}
            {hasActiveSubscription ? (
              <div className="p-4 rounded-2xl bg-[#E5ECE9]/60 border border-eucalyptus/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-soot block">Corporate Subscription Plan</span>
                  <span className="text-[11px] text-moss">
                    All {seats} {seats === 1 ? 'seat' : 'seats'} fully covered under active corporate membership
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eucalyptus/40 text-soot font-semibold text-xs border border-eucalyptus/50">
                    <Check size={12} className="text-moss shrink-0" />
                    <span>Covered by Pass</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-soot block">Calculated Total</span>
                  <span className="text-[11px] text-moss">
                    {plan === 'daily'
                      ? `${seats} seats × SAR ${((space.pricing?.daily ?? 150) * durationDays).toLocaleString()} (SAR ${space.pricing?.daily ?? 150}/day × ${durationDays} ${durationDays === 1 ? 'day' : 'days'})`
                      : `${seats} seats × SAR ${planInfo.originalPrice.toLocaleString()} ${planLabel}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-soot">
                    {planInfo.isCovered ? 'SAR 0' : `SAR ${finalPayablePrice.toLocaleString()}`}
                  </span>
                  {planInfo.isCovered && (
                    <span className="text-[10px] text-emerald-800 font-semibold block">Included in Pass</span>
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
              {hasActiveSubscription ? 'Review Team Reservation' : 'Review Team Reservation & Payment'}
            </h2>
            <p className="text-moss text-xs">
              {hasActiveSubscription
                ? 'Confirm your reservation details and team workspace allocation'
                : 'Confirm your reservation details and total price breakdown'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Details Box */}
            <div className="p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8 divide-y divide-soot/6 text-sm">
              <div className="pb-2.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-moss">Workspace</span>
                  <span className="text-soot font-medium">{space.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-moss">Type</span>
                  <span className="text-soot font-medium capitalize">{bookingType.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-moss">Plan</span>
                  <span className="text-soot font-medium">
                    {isHourly
                      ? `Hourly Reservation (${durationHours} ${durationHours === 1 ? 'hour' : 'hours'})`
                      : plan === 'daily'
                      ? `Daily Pass (${durationDays} ${durationDays === 1 ? 'Day' : 'Days'})`
                      : `${plan} pass`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-moss">{isHourly ? 'Booking Date' : plan === 'daily' ? 'Date Range' : 'Start Date'}</span>
                  <span className="text-soot font-medium">{plan === 'daily' ? formatDateRange(startDate, endDate) : startDate}</span>
                </div>
                {plan === 'daily' && (
                  <div className="flex justify-between">
                    <span className="text-moss">Duration</span>
                    <span className="text-soot font-medium">{durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                  </div>
                )}
                {(isHourlySpace || isHourly) && (
                  <div className="flex justify-between">
                    <span className="text-moss">{isHourly ? 'Time Window' : 'Daily Allowed Hours'}</span>
                    <span className="text-soot font-medium">{startTime} – {endTime} ({durationHours} {durationHours === 1 ? 'hour' : 'hours'}{isHourly ? '' : '/day'})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-moss">Reserved Seats</span>
                  <span className="text-soot font-medium">{seats} seats</span>
                </div>
                {selectedEmployees.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-moss">Assigned Members</span>
                    <span className="text-soot font-medium">{selectedEmployees.length} members</span>
                  </div>
                )}
              </div>
            </div>

            {hasActiveSubscription ? (
              /* Corporate Subscription Plan Coverage Card (No Prices Displayed) */
              <div className="p-5 rounded-2xl bg-[#E5ECE9]/60 border-2 border-eucalyptus/40 space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-soot/8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-700" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-soot">
                      Corporate Subscription Plan Coverage
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                    Active Pass
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-moss">Covered by</span>
                    <span className="font-semibold text-soot">{currentUser?.orgName || currentUser?.businessName || currentUser?.membershipTier || 'Corporate Pass'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-moss">Allocated Team Seats</span>
                    <span className="font-semibold text-soot">{seats} {seats > 1 ? 'Seats' : 'Seat'} (Included)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-moss">Payment Required</span>
                    <span className="font-semibold text-emerald-800">None · Covered by Corporate Plan</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-soot/8 flex items-center gap-2 text-[11px] text-moss">
                  <Info size={13} className="shrink-0 text-emerald-700" />
                  <span>All team seats are fully covered under your active corporate subscription pass. No billing will occur.</span>
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
                        <div className="text-sm font-semibold text-soot">Loyalty Points Rewards</div>
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
                    <span className="text-moss">Points to be earned from this booking:</span>
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
                            {isUsingCompanyWallet ? 'Corporate Shared Wallet' : 'Digital Wallet Balance'}
                          </div>
                          <div className="text-[11px] text-moss">Available Balance: SAR {userWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
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
                          <span>Use {isUsingCompanyWallet ? 'Shared Wallet' : 'Wallet'} (SAR {walletDeduction.toLocaleString()})</span>
                        </label>
                      )}
                    </div>
                    {useWalletBalance && walletDeduction > 0 && (
                      <div className="text-[11px] font-medium text-emerald-950 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                        <span>{isUsingCompanyWallet ? 'Corporate Shared Wallet Applied' : 'Wallet Balance Applied'}</span>
                        <span className="font-bold text-emerald-700">- SAR {walletDeduction.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Prominent Price Breakdown Box */}
                <div className="p-5 rounded-2xl bg-white border-2 border-soot/10 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
                    <Receipt size={16} className="text-moss" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-soot">
                      Price Breakdown & Payment Receipt
                    </span>
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-moss">
                      Rate per Seat ({isHourly ? `${startTime} – ${endTime} (${durationHours}h)` : plan === 'monthly' ? `${durationMonths} Mo Monthly` : plan === 'daily' ? `${durationDays} ${durationDays === 1 ? 'day' : 'days'} (SAR ${space.pricing?.daily ?? 150}/day)` : `${plan} pass`})
                    </span>
                    <span className="text-soot font-medium">
                      {planInfo.isCovered ? 'Included in your Plan' : `SAR ${planInfo.originalPrice.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-moss">Seats</span>
                    <span className="text-soot font-medium">× {seats}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-moss">Subtotal</span>
                    <span className="text-soot font-medium">
                      {planInfo.isCovered ? 'Included in your Plan' : `SAR ${(planInfo.originalPrice * seats).toLocaleString()}`}
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
                      <span className="text-moss">Wallet Balance Applied</span>
                      <span className="text-emerald-700 font-semibold">-SAR {walletDeduction.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-moss">VAT (15% included)</span>
                    <span className="text-soot font-medium">
                      {planInfo.isCovered ? 'SAR 0' : `SAR ${((finalPayablePrice) * 0.15).toFixed(0)}`}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-soot/10 flex justify-between items-center bg-plaster-dark/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                    <div>
                      <span className="text-sm font-bold text-soot block">Total Payable Amount</span>
                      <span className="text-xs text-moss">Corporate billing</span>
                    </div>
                    <div className="text-right">
                      {totalPriceToPay === 0 ? (
                        <div>
                          <span className="text-2xl font-bold text-soot">SAR 0 to Pay</span>
                          <div className="text-xs text-moss font-semibold bg-eucalyptus/25 border border-eucalyptus/30 px-2.5 py-0.5 rounded-full inline-block ml-2">
                            {walletDeduction >= finalPayablePrice && finalPayablePrice > 0 ? 'Paid with Wallet' : 'Included in your Plan'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-soot">SAR {totalPriceToPay.toLocaleString()}</span>
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
            <span>Continue</span>
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
              <span>{hasActiveSubscription ? 'Add to Cart (Covered by Pass)' : finalPayablePrice === 0 ? 'Add to Cart (Included · SAR 0)' : 'Add to Cart'}</span>
            </button>

            <button
              onClick={confirmBooking}
              disabled={loading}
              className="flex-1 py-3 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Confirming...</span>
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
