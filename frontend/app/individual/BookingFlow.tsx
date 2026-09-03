'use client';

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
  ShoppingBag
} from 'lucide-react';
import { useApp } from '@/app/store';
import {
  BookingPlan,
  BookingType,
  isUserPassHolder,
  getEffectiveSpacePrice,
  getHourlyPriceForDuration,
  calculateEndTime,
  isTimeWithinOpenHours,
  checkSpaceOverlap
} from '@/types/types';

const STEPS = ['Plan', 'Details', 'Review', 'Confirm'];

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8];

const START_TIMES = [
  '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM',
];

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
      <span className="text-soot font-medium text-sm text-right">{value}</span>
    </div>
  );
}

export default function BookingFlow() {
  const { nav, navigate, goBack, spaces, bookings, currentUser, addBooking, showToast, addToCart, updateCurrentUser } = useApp();
  
  const urlId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
  const spaceId = nav?.params?.spaceId || (urlId && urlId !== 'page' && urlId !== 'booking-flow' ? urlId : '') || 'space-1';
  const space = spaces.find(s => s.id === spaceId) || spaces[0];

  const initialPlan = (nav?.params?.plan as BookingPlan) || 'hourly';
  const initialDuration = (nav?.params?.durationHours as number) || 2;

  const [step, setStep] = useState(0); 
  const [plan, setPlan] = useState<BookingPlan>(initialPlan);
  const [deskType, setDeskType] = useState<BookingType>('hot-desk');
  
  // Hourly Booking Configuration State
  const [durationHours, setDurationHours] = useState<number>(initialDuration);
  const [startTime, setStartTime] = useState('10:00 AM');
  
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const startTimeRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (startTimeRef.current && !startTimeRef.current.contains(event.target as Node)) {
        setStartTimeOpen(false);
      }
      if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
        setDurationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualEndDate, setManualEndDate] = useState('');
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  if (!space || !currentUser) return null;

  const isHourly = plan === 'hourly';
  const endTime = isHourly ? calculateEndTime(startTime, durationHours) : '';

  const getEndDate = (start: string, p: BookingPlan) => {
    if (!start) return '';
    if (p === 'hourly') return start;
    const d = new Date(start);
    if (p === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (p === 'yearly') d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const endDate = isHourly ? startDate : plan === 'daily' ? manualEndDate || startDate : getEndDate(startDate, plan);

  // Price calculations
  const planInfo = getEffectiveSpacePrice(currentUser, space, plan, deskType, durationHours);
  const planPrice = planInfo.effectivePrice;
  const rawTotalPrice = planPrice * seats;

  // Loyalty calculations
  const multiplier = space.loyaltyPointsMultiplier || 1;
  const earnedPoints = Math.floor(rawTotalPrice / 100) * 10 * multiplier;
  const availablePoints = currentUser?.loyaltyPoints || 0;
  const maxRedeemablePoints = Math.min(
    Math.floor(availablePoints / 100) * 100,
    Math.floor(rawTotalPrice / 5) * 100
  );
  const pointsDiscount = useLoyaltyPoints && maxRedeemablePoints > 0 ? (maxRedeemablePoints / 100) * 5 : 0;
  const totalPrice = Math.max(0, rawTotalPrice - pointsDiscount);

  const priceLabel = isHourly
    ? `for ${durationHours} hour${durationHours > 1 ? 's' : ''}`
    : plan === 'daily' ? '/day' : plan === 'monthly' ? '/month' : '/year';

  // Validation
  const validateStep = () => {
    if (step === 1) {
      if (!startDate) {
        showToast('Please select a booking date.', 'error');
        return false;
      }

      if (isHourly) {
        if (!startTime) {
          showToast('Please select a start time.', 'error');
          return false;
        }
        // Validate operating hours
        const hoursCheck = isTimeWithinOpenHours(startDate, startTime, endTime, space.openHours);
        if (!hoursCheck.valid) {
          showToast(hoursCheck.reason || 'Requested time is outside space operating hours.', 'error');
          return false;
        }

        // Validate space overlap & capacity
        const overlapCheck = checkSpaceOverlap(bookings, space.id, startDate, startTime, endTime, space.totalCapacity);
        if (!overlapCheck.available) {
          showToast(`This space is fully reserved at ${startTime}. Please select a different time or date.`, 'error');
          return false;
        }
      } else if (plan === 'daily' && manualEndDate && manualEndDate < startDate) {
        showToast('End date cannot be before start date.', 'error');
        return false;
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
      goBack();
      return;
    }
    setStep(s => s - 1);
  };

  const confirmBooking = () => {
    setLoading(true);
    setTimeout(() => {
      const pointsUsed = useLoyaltyPoints ? maxRedeemablePoints : 0;
      if (pointsUsed > 0) {
        const updatedPoints = Math.max(0, availablePoints - pointsUsed);
        updateCurrentUser({ loyaltyPoints: updatedPoints });
      }

      const booking = addBooking({
        userId: currentUser.id,
        spaceId: space.id,
        spaceName: space.name,
        spaceCity: space.city,
        spaceAddress: space.address,
        spaceImage: space.images[0],
        type: deskType,
        plan,
        startTime: isHourly ? startTime : undefined,
        endTime: isHourly ? endTime : undefined,
        durationHours: isHourly ? durationHours : undefined,
        startDate,
        endDate: endDate || startDate,
        seats,
        employees: [],
        totalPrice,
        status: 'active',
        notes,
      });
      setConfirmedBooking(booking);
      setStep(3);
      setLoading(false);
      showToast('Workspace booked successfully!', 'success');
    }, 900);
  };

  // Confirmation screen
  if (step === 3 && confirmedBooking) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center">
          <div className="w-18 h-18 rounded-3xl bg-eucalyptus/20 border border-eucalyptus/30 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check size={32} className="text-moss" />
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal mb-2 font-serif-display">
            Booking Confirmed!
          </h1>
          <p className="text-moss text-sm mb-8 font-normal">
            Your pass is ready. We have saved all details in your My Bookings section.
          </p>

          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 text-left mb-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-soot/8">
              <img src={space.images[0]} alt={space.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
              <div>
                <div className="font-semibold text-soot text-lg">{space.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-moss mt-1">
                  <MapPin size={12} />
                  <span>{space.city}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <Row label="Booking Reference" value={`#${confirmedBooking.id.slice(-8).toUpperCase()}`} />
              <Row label="Desk Type" value={deskType.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} />
              <Row label="Plan / Mode" value={isHourly ? `Hourly Reservation (${durationHours} hrs)` : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Pass`} />
              <Row label="Reservation Date" value={startDate} />
              {isHourly && (
                <Row label="Time Window" value={`${startTime} – ${endTime}`} />
              )}
              {!isHourly && plan !== 'daily' && <Row label="End Date" value={endDate} />}
              <Row label="Reserved Seats" value={`${seats} seat${seats > 1 ? 's' : ''}`} />
              <div className="pt-3 border-t border-soot/8 flex justify-between items-center font-semibold text-base">
                <span className="text-soot">Total Paid (incl. VAT)</span>
                <span className="text-soot font-bold text-lg">SAR {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('my-bookings')}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all shadow-xs border border-soot/8 cursor-pointer"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('browse')}
              className="flex-1 py-3.5 px-6 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              Browse More Spaces
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10">
      <button
        onClick={back}
        className="flex items-center gap-2 text-moss hover:text-soot text-sm font-medium mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <StepIndicator current={step} />

      {/* Prominent Space & Live Price Header Bar */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-3xl border border-soot/8 p-5 mb-8 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <img src={space.images[0]} alt={space.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-soot text-base truncate">{space.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5">
              <MapPin size={12} />
              <span>{space.city} · <span className="capitalize">{deskType.replace('-', ' ')}</span></span>
            </div>
          </div>
        </div>

        {/* Live Dynamic Price Display */}
        <div className="text-right shrink-0 bg-plaster-dark/40 px-4 py-2.5 rounded-2xl border border-soot/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-moss block">
            {seats > 1 ? `Total (${seats} Seats)` : 'Total Price'}
          </span>
          <div className="font-bold text-soot text-lg sm:text-xl leading-tight">
            {planInfo.isCovered ? (
              <span className="text-moss">SAR 0</span>
            ) : (
              <span>SAR {totalPrice.toLocaleString()}</span>
            )}
          </div>
          <div className="text-[11px] text-moss mt-0.5">
            {planInfo.isCovered ? 'Included with Pass' : `SAR ${planPrice.toLocaleString()} ${priceLabel}`}
          </div>
        </div>
      </div>

      {/* Step 0: Choose Plan */}
      {step === 0 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl text-soot font-normal mb-1 font-serif-display">
              Choose Your Pass & Duration
            </h2>
            <p className="text-moss text-sm">Select hourly duration or flexible ongoing pass access</p>
          </div>

          {/* Workspace Desk Type Selector */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-moss mb-3">Workspace Type</h3>
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

          {/* Plan Choice List */}
          <div className="space-y-3">
            {(['hourly', 'daily', 'monthly', 'yearly'] as BookingPlan[]).map(p => {
              const isSelected = plan === p;
              const pInfo = getEffectiveSpacePrice(currentUser, space, p, deskType, durationHours);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-eucalyptus bg-[#E5ECE9]/60 shadow-sm'
                      : 'border-soot/8 bg-white hover:border-soot/20'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-soot text-base capitalize flex items-center gap-2">
                      <span>{p} Pass</span>
                      {p === 'hourly' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-eucalyptus/30 text-soot font-semibold uppercase tracking-wider">
                          Flexible Duration
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-moss mt-1">
                      {p === 'hourly'
                        ? `Reserve for ${durationHours} hours with instant confirmation`
                        : p === 'daily'
                        ? 'Full single day access with all standard desk perks'
                        : p === 'monthly'
                        ? 'Best for steady ongoing monthly coworking access'
                        : 'Dedicated full-year workspace with maximum annual savings'}
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-4">
                    {pInfo.isCovered ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eucalyptus/30 text-soot font-semibold text-xs border border-eucalyptus/40 shadow-2xs">
                        <Check size={11} className="text-moss shrink-0" />
                        <span>Included in Pass</span>
                      </span>
                    ) : pInfo.hasDiscount ? (
                      <div>
                        <div className="font-bold text-soot text-base">SAR {pInfo.effectivePrice.toLocaleString()}</div>
                        <div className="text-[10px] text-amber-900 font-semibold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full mt-0.5">
                          {pInfo.discountPercentage}% Pass Discount
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-soot text-lg">
                          SAR {pInfo.originalPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-moss">
                          /{p === 'hourly' ? `${durationHours}h` : p === 'daily' ? 'day' : p === 'monthly' ? 'month' : 'year'}
                        </div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hourly Duration Selector if Hourly plan is active */}
          {isHourly && (
            <div className="p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>Select Duration in Hours</span>
                  </h4>
                  <p className="text-xs text-moss mt-0.5">Price dynamically updates for selected duration</p>
                </div>
                <div className="text-sm font-bold text-soot">
                  {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'} · SAR {getHourlyPriceForDuration(space, durationHours)}
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {DURATION_OPTIONS.map(hours => {
                  const isActive = durationHours === hours;
                  const tierPrice = getHourlyPriceForDuration(space, hours);
                  return (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      className={`py-2.5 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#DDE6DF] text-soot border-soot/20 shadow-xs font-semibold ring-2 ring-soot/10'
                          : 'bg-white border-soot/10 text-moss hover:text-soot hover:border-soot/20'
                      }`}
                    >
                      <div className="text-xs font-semibold">{hours} {hours === 1 ? 'Hour' : 'Hours'}</div>
                      <div className="text-[11px] font-bold text-soot mt-0.5">SAR {tierPrice}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={next}
            className="w-full py-3.5 px-6 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer"
          >
            <span>Continue to Schedule & Details (SAR {totalPrice.toLocaleString()})</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 1: Schedule & Details */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl text-soot font-normal mb-1 font-serif-display">
              Schedule & Seats
            </h2>
            <p className="text-moss text-sm">Choose your date, time window, and required capacity</p>
          </div>

          <div className="space-y-6">
            {/* Booking Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2">
                Reservation Date
              </label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-soot/10 bg-[#F9F8F5] text-soot text-sm outline-none focus:border-eucalyptus focus:bg-white font-medium"
              />
            </div>

            {/* Hourly Start Time & Duration Controls */}
            {isHourly && (
              <div className="space-y-4 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative" ref={startTimeRef}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Start Time</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setStartTimeOpen(!startTimeOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none shadow-2xs"
                    >
                      <span className="truncate">{startTime}</span>
                      <ChevronDown
                        size={15}
                        className={`text-moss shrink-0 transition-transform duration-200 ${
                          startTimeOpen ? 'rotate-180 text-soot' : ''
                        }`}
                      />
                    </button>

                    {startTimeOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-52 overflow-y-auto">
                        <div className="space-y-0.5">
                          {START_TIMES.map((t) => {
                            const isSelected = startTime === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setStartTime(t);
                                  setStartTimeOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                                  isSelected
                                    ? 'bg-soot text-plaster font-semibold'
                                    : 'text-soot hover:bg-plaster-dark/60'
                                }`}
                              >
                                <span>{t}</span>
                                {isSelected && <Check size={14} className="text-eucalyptus" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={durationRef}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2">
                      Duration (Hours)
                    </label>
                    <button
                      type="button"
                      onClick={() => setDurationOpen(!durationOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none shadow-2xs"
                    >
                      <span className="truncate">
                        {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'} — SAR {getHourlyPriceForDuration(space, durationHours)}
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-moss shrink-0 transition-transform duration-200 ${
                          durationOpen ? 'rotate-180 text-soot' : ''
                        }`}
                      />
                    </button>

                    {durationOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-52 overflow-y-auto">
                        <div className="space-y-0.5">
                          {DURATION_OPTIONS.map((h) => {
                            const isSelected = durationHours === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => {
                                  setDurationHours(h);
                                  setDurationOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                                  isSelected
                                    ? 'bg-soot text-plaster font-semibold'
                                    : 'text-soot hover:bg-plaster-dark/60'
                                }`}
                              >
                                <span>
                                  {h} {h === 1 ? 'Hour' : 'Hours'} — SAR {getHourlyPriceForDuration(space, h)}
                                </span>
                                {isSelected && <Check size={14} className="text-eucalyptus" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time Dynamic Schedule & Price Summary Card */}
                <div className="bg-white rounded-2xl p-4 border border-soot/8 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-moss block text-[10px] uppercase font-semibold">Start</span>
                      <span className="font-semibold text-soot text-sm">{startTime}</span>
                    </div>
                    <span className="text-soot/20 font-bold">→</span>
                    <div>
                      <span className="text-moss block text-[10px] uppercase font-semibold">End</span>
                      <span className="font-semibold text-soot text-sm">{endTime}</span>
                    </div>
                    <div className="border-l border-soot/8 pl-4">
                      <span className="text-moss block text-[10px] uppercase font-semibold">Duration</span>
                      <span className="font-semibold text-soot text-sm">{durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-moss block text-[10px] uppercase font-semibold">Rate per Seat</span>
                    <span className="font-bold text-soot text-base">SAR {planPrice}</span>
                  </div>
                </div>

                {/* Space Operating Hours Helper */}
                <div className="text-[11px] text-moss flex items-center gap-1.5">
                  <Info size={13} className="shrink-0 text-moss/80" />
                  <span>Operating hours: {space.openHours || 'Daily: 8am–10pm'}</span>
                </div>
              </div>
            )}

            {/* End Date for Daily plan */}
            {!isHourly && plan === 'daily' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2">
                  End Date (Optional for multi-day)
                </label>
                <input
                  type="date"
                  value={manualEndDate}
                  min={startDate}
                  onChange={e => setManualEndDate(e.target.value)}
                  placeholder={startDate}
                  className="w-full px-4 py-3 rounded-2xl border border-soot/10 bg-[#F9F8F5] text-soot text-sm outline-none focus:border-eucalyptus focus:bg-white font-medium"
                />
              </div>
            )}

            {/* Number of Seats */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2">
                Number of Reserved Desks / Seats
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
                  onClick={() => setSeats(Math.min(space.availableCapacity || 10, seats + 1))}
                  className="w-11 h-11 rounded-2xl border border-soot/10 bg-plaster/50 hover:bg-plaster flex items-center justify-center text-soot font-bold text-lg cursor-pointer"
                >
                  +
                </button>
                <span className="text-xs text-moss font-normal">
                  {space.availableCapacity} seats currently open
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2">
                Special Requests or Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special setup or desk requirements..."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl border border-soot/10 bg-[#F9F8F5] text-soot text-sm outline-none focus:border-eucalyptus focus:bg-white resize-none font-normal"
              />
            </div>

            {/* Live Pricing Summary Box in Step 1 */}
            <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-soot block">Calculated Total</span>
                <span className="text-[11px] text-moss">
                  {seats} {seats > 1 ? 'seats' : 'seat'} × SAR {planPrice.toLocaleString()} {priceLabel}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-soot">
                  SAR {totalPrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-moss block">VAT included</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={back}
              className="flex-1 py-3.5 px-6 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={next}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer"
            >
              <span>Proceed to Review & Payment</span>
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
              Review & Payment
            </h2>
            <p className="text-moss text-sm">Review your booking summary and confirm payment</p>
          </div>

          <div className="space-y-4">
            {/* Booking Details Summary */}
            <div className="p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8 divide-y divide-soot/6">
              <Row label="Workspace" value={space.name} />
              <Row label="Location" value={`${space.address}, ${space.city}`} />
              <Row label="Desk Type" value={deskType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
              <Row label="Plan / Mode" value={isHourly ? `Hourly Reservation (${durationHours} hours)` : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Pass`} />
              <Row label="Date" value={startDate} />
              {isHourly ? (
                <Row label="Time Window" value={`${startTime} – ${endTime} (${durationHours} hrs)`} />
              ) : plan !== 'daily' ? (
                <Row label="End Date" value={endDate} />
              ) : null}
              <Row label="Reserved Seats" value={`${seats} seat${seats > 1 ? 's' : ''}`} />
            </div>

            {/* Loyalty Rewards Program Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-soot">Loyalty Rewards Program</div>
                    <div className="text-[11px] text-moss">Balance: {availablePoints} points</div>
                  </div>
                </div>
                {availablePoints >= 100 && rawTotalPrice > 0 && maxRedeemablePoints > 0 && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-soot cursor-pointer bg-white/80 px-3 py-1.5 rounded-xl border border-amber-500/30 hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={useLoyaltyPoints}
                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      className="rounded border-soot/20 text-eucalyptus focus:ring-eucalyptus cursor-pointer"
                    />
                    <span>Use {maxRedeemablePoints} pts (-SAR {(maxRedeemablePoints / 100) * 5})</span>
                  </label>
                )}
              </div>
              {earnedPoints > 0 && (
                <div className="text-[11px] font-medium text-amber-900 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
                  <span>🎉 You will earn <strong>+{earnedPoints} loyalty points</strong> upon booking completion!</span>
                  {multiplier > 1 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-full ml-2">
                      {multiplier}× Points
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Clear Itemized Price Breakdown */}
            <div className="p-5 rounded-2xl bg-white border-2 border-soot/10 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
                <Receipt size={16} className="text-moss" />
                <span className="text-xs font-semibold uppercase tracking-wider text-soot">
                  Price Breakdown & Payment Receipt
                </span>
              </div>

              <Row
                label={`Rate per Seat (${isHourly ? `${durationHours}h` : plan})`}
                value={`SAR ${planPrice.toLocaleString()}`}
              />
              <Row
                label={`Number of Reserved Seats`}
                value={`× ${seats}`}
              />
              <Row
                label={`Subtotal`}
                value={`SAR ${totalPrice.toLocaleString()}`}
              />
              <Row
                label="VAT (15% included in price)"
                value={`SAR ${(totalPrice * 0.15).toFixed(0)}`}
              />

              {/* Highlighted Final Payable Amount */}
              <div className="pt-3 border-t border-soot/10 flex justify-between items-center bg-plaster-dark/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                <div>
                  <span className="text-sm font-bold text-soot block">Total Payable Amount</span>
                  <span className="text-xs text-moss">Instant confirmation & access</span>
                </div>

                <div className="text-right">
                  {planInfo.isCovered ? (
                    <div>
                      <span className="text-2xl font-bold text-soot">SAR 0</span>
                      <div className="text-xs text-moss font-semibold bg-eucalyptus/25 border border-eucalyptus/30 px-2.5 py-0.5 rounded-full inline-block ml-2">
                        Included in Pass
                      </div>
                    </div>
                  ) : planInfo.hasDiscount ? (
                    <div>
                      <span className="text-2xl font-bold text-soot">SAR {totalPrice.toLocaleString()}</span>
                      <div className="text-xs text-amber-900 font-semibold bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full block mt-0.5">
                        {planInfo.discountPercentage}% Pass Discount
                      </div>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-soot">
                      SAR {totalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={back}
              className="py-3.5 px-6 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                addToCart({
                  spaceId: space.id,
                  spaceName: space.name,
                  spaceCity: space.city,
                  spaceAddress: space.address || space.city,
                  spaceImage: space.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
                  type: deskType,
                  plan: plan,
                  durationHours: isHourly ? durationHours : undefined,
                  startTime: isHourly ? startTime : undefined,
                  endTime: isHourly ? endTime : undefined,
                  startDate: startDate,
                  endDate: endDate,
                  seats: seats,
                  notes: notes,
                  pricePerSeat: planPrice,
                  itemTotal: totalPrice,
                });
                navigate('browse');
              }}
              className="py-3.5 px-5 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <ShoppingBag size={16} />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={confirmBooking}
              disabled={loading}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Pay Now (SAR {totalPrice.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
