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
  Sparkles
} from 'lucide-react';
import { useApp } from '@/app/store';
import {
  BookingPlan,
  BookingType,
  Employee,
  Space,
  getEffectiveSpacePrice,
  getHourlyPriceForDuration,
  calculateEndTime,
  isTimeWithinOpenHours,
  checkSpaceOverlap
} from '@/types/types';

const STEPS = ['Type & Plan', 'Team', 'Schedule', 'Review'];
const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8];

const START_TIMES = [
  '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM',
];

export default function TeamBooking() {
  const { nav, goBack, spaces, bookings, currentUser, addBooking, navigate, showToast, addToCart, updateCurrentUser } = useApp();
  const spaceId = nav.params?.spaceId;
  const space = spaces.find((s: Space) => s.id === spaceId);

  const initialPlan = (nav?.params?.plan as BookingPlan) || 'hourly';
  const initialDuration = (nav?.params?.durationHours as number) || 2;

  const [step, setStep] = useState(0);
  const [bookingType, setBookingType] = useState<BookingType>('hot-desk');
  const [plan, setPlan] = useState<BookingPlan>(initialPlan);
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

  const [seats, setSeats] = useState(2);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualEndDate, setManualEndDate] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Loyalty Points State
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  const employees = currentUser?.employees || [];

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

  const planInfo = getEffectiveSpacePrice(currentUser, space, plan, bookingType, durationHours);
  const pricePerSeat = planInfo.effectivePrice;
  const rawTotalPrice = pricePerSeat * seats;

  // منطق نقاط الولاء المكتسبة والمستخدمة
  const multiplier = space.loyaltyPointsMultiplier || 1;
  const earnedPoints = Math.floor(rawTotalPrice / 100) * 10 * multiplier;
  const availablePoints = currentUser.loyaltyPoints || 0;
  const maxRedeemablePoints = Math.min(
    Math.floor(availablePoints / 100) * 100,
    Math.floor(rawTotalPrice / 5) * 100
  );
  const pointsDiscount = useLoyaltyPoints && maxRedeemablePoints > 0 ? (maxRedeemablePoints / 100) * 5 : 0;
  const finalPayablePrice = Math.max(0, rawTotalPrice - pointsDiscount);

  const planLabel = isHourly
    ? `for ${durationHours} hours`
    : plan === 'daily' ? '/day' : plan === 'monthly' ? '/month' : '/year';

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const validateStep = () => {
    if (step === 2) {
      if (!startDate) {
        showToast('Please select a booking date.', 'error');
        return false;
      }
      if (isHourly) {
        if (!startTime) {
          showToast('Please select a start time.', 'error');
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
      goBack();
      return;
    }
    setStep(s => s - 1);
  };

  const confirmBooking = () => {
    setLoading(true);
    setTimeout(() => {
      const booking = addBooking({
        userId: currentUser.id,
        spaceId: space.id,
        spaceName: space.name,
        spaceCity: space.city,
        spaceAddress: space.address,
        spaceImage: space.images[0],
        type: bookingType,
        plan,
        startTime: isHourly ? startTime : undefined,
        endTime: isHourly ? endTime : undefined,
        durationHours: isHourly ? durationHours : undefined,
        startDate,
        endDate,
        seats,
        employees: selectedEmployees,
        totalPrice: finalPayablePrice,
        status: 'active',
      });

      // تحديث نقاط الولاء للمؤسسة / المستخدم
      const pointsUsed = useLoyaltyPoints ? maxRedeemablePoints : 0;
      const updatedPoints = Math.max(0, availablePoints - pointsUsed + earnedPoints);
      updateCurrentUser({ loyaltyPoints: updatedPoints });

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
                <span className="text-soot font-medium text-xs">{isHourly ? `Hourly (${durationHours} hours)` : `${plan} pass`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss text-xs">Date</span>
                <span className="text-soot font-medium text-xs">{startDate}</span>
              </div>
              {isHourly && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">Time Window</span>
                  <span className="text-soot font-medium text-xs">{startTime} – {endTime}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-moss text-xs">Reserved Seats</span>
                <span className="text-soot font-medium text-xs">{seats} seats</span>
              </div>

              {/* تفاصيل نقاط الولاء في شاشة التأكيد */}
              {pointsDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">Points Redeemed</span>
                  <span className="text-emerald-700 font-semibold text-xs">-{maxRedeemablePoints} pts (SAR {pointsDiscount})</span>
                </div>
              )}
              {earnedPoints > 0 && (
                <div className="flex justify-between">
                  <span className="text-moss text-xs">Points Earned</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                    <Sparkles size={12} className="text-amber-500" />
                    +{earnedPoints} pts
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-soot/8 flex justify-between items-center font-semibold text-base">
                <span className="text-soot">Total Paid (incl. VAT)</span>
                <span className="text-soot font-bold text-lg">SAR {finalPayablePrice.toLocaleString()}</span>
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
      <button
        onClick={back}
        className="flex items-center gap-2 text-moss hover:text-soot text-sm font-medium mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Back
      </button>

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
          <span className="text-[9px] font-bold uppercase tracking-wider text-moss block">
            Total ({seats} seats)
          </span>
          <div className="font-bold text-soot text-base">
            {planInfo.isCovered ? 'SAR 0' : `SAR ${finalPayablePrice.toLocaleString()}`}
          </div>
          <div className="text-[10px] text-moss">
            {planInfo.isCovered ? 'Enterprise Pass' : `SAR ${pricePerSeat}/seat`}
          </div>
        </div>
      </div>

      {/* Step 0: Type & Plan */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-soot/8 p-6 shadow-sm space-y-5">
            <h2 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Select Workspace Type
            </h2>
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

            {/* Plan selector */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-moss mb-3">Choose Plan</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['hourly', 'daily', 'monthly', 'yearly'] as BookingPlan[]).map(p => {
                  const pInfo = getEffectiveSpacePrice(currentUser, space, p, bookingType, durationHours);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlan(p)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        plan === p
                          ? 'bg-[#DDE6DF] text-soot border-soot/20 shadow-xs font-semibold'
                          : 'bg-[#F9F8F5] border-soot/8 text-moss hover:text-soot'
                      }`}
                    >
                      <div className="text-xs capitalize font-semibold">{p}</div>
                      <div className="text-[10px] text-moss mt-0.5">
                        {pInfo.isCovered ? 'Included' : `SAR ${pInfo.effectivePrice}/seat`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hourly duration selector */}
            {isHourly && (
              <div className="p-4 rounded-2xl bg-[#F9F8F5] border border-soot/8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Select Duration in Hours</span>
                  </span>
                  <span className="text-xs font-bold text-soot">{durationHours} Hours (SAR {getHourlyPriceForDuration(space, durationHours)}/seat)</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DURATION_OPTIONS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        durationHours === h
                          ? 'bg-[#DDE6DF] border-soot/20 text-soot shadow-2xs font-semibold ring-2 ring-soot/10'
                          : 'bg-white border-soot/10 text-moss hover:text-soot'
                      }`}
                    >
                      <div>{h}h</div>
                      <div className="text-[10px] font-bold text-soot mt-0.5">SAR {getHourlyPriceForDuration(space, h)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Number of seats */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-2 flex items-center gap-1.5">
                <Users size={13} />
                <span>Team Seats to Reserve</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSeats(s => Math.max(1, s - 1))}
                  className="w-10 h-10 rounded-xl border border-soot/12 text-soot hover:bg-soot/5 font-bold cursor-pointer"
                >
                  −
                </button>
                <span className="text-soot font-semibold w-8 text-center">{seats}</span>
                <button
                  type="button"
                  onClick={() => setSeats(s => Math.min(space.availableCapacity || 20, s + 1))}
                  className="w-10 h-10 rounded-xl border border-soot/12 text-soot hover:bg-soot/5 font-bold cursor-pointer"
                >
                  +
                </button>
                <span className="text-xs text-moss">{space.availableCapacity} seats available</span>
              </div>
            </div>

            {/* Total summary box */}
            <div className="p-3.5 rounded-2xl bg-plaster-dark/40 border border-soot/10 flex items-center justify-between">
              <span className="text-xs font-medium text-moss">
                Calculated Total ({seats} seats × SAR {pricePerSeat})
              </span>
              <span className="text-base font-bold text-soot">
                {planInfo.isCovered ? 'SAR 0 (Included)' : `SAR ${rawTotalPrice.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Team Members */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Assign Team Members (Optional)
          </h2>
          <p className="text-xs text-moss">Select up to {seats} employee{seats > 1 ? 's' : ''} ({selectedEmployees.length}/{seats} selected)</p>

          {employees.length === 0 ? (
            <div className="rounded-2xl border border-soot/8 p-8 text-center bg-[#F9F8F5]">
              <Users size={28} className="text-moss mx-auto mb-2" />
              <div className="text-xs text-moss">No employees listed in your team roster yet. You can still proceed with reservation.</div>
            </div>
          ) : (
            <div className="divide-y divide-soot/6 border border-soot/8 rounded-2xl overflow-hidden">
              {employees.map((emp: Employee) => {
                const sel = selectedEmployees.includes(emp.id);
                const disabled = !sel && selectedEmployees.length >= seats;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => { if (!disabled || sel) toggleEmployee(emp.id); }}
                    disabled={disabled && !sel}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                      sel ? 'bg-eucalyptus/15' : disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-soot/3'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      sel ? 'bg-soot text-plaster' : 'bg-eucalyptus/20 text-moss'
                    }`}>
                      {sel ? <Check size={14} /> : emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-soot">{emp.name}</div>
                      <div className="text-xs text-moss">{emp.department} · {emp.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Schedule */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 shadow-sm space-y-5">
          <h2 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Schedule & Time Window
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} />
              <span>Reservation Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-[#F9F8F5] text-soot text-sm outline-none focus:border-eucalyptus font-normal"
            />
          </div>

          {isHourly && (
            <div className="space-y-4 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative" ref={startTimeRef}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5 flex items-center gap-1.5">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5">
                    Duration
                  </label>
                  <button
                    type="button"
                    onClick={() => setDurationOpen(!durationOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none shadow-2xs"
                  >
                    <span className="truncate">
                      {durationHours} Hours (SAR {getHourlyPriceForDuration(space, durationHours)}/seat)
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
                                {h} Hours (SAR {getHourlyPriceForDuration(space, h)}/seat)
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

              <div className="bg-white rounded-2xl p-4 border border-soot/8 flex items-center justify-between text-xs">
                <div>
                  <span className="text-moss block text-[10px] uppercase font-semibold">Time Window</span>
                  <span className="font-semibold text-soot text-sm">{startTime} – {endTime}</span>
                </div>
                <div className="text-right">
                  <span className="text-moss block text-[10px] uppercase font-semibold">Duration</span>
                  <span className="font-semibold text-soot text-sm">{durationHours} Hours</span>
                </div>
              </div>

              <div className="text-[11px] text-moss flex items-center gap-1.5">
                <Info size={13} className="shrink-0 text-moss/80" />
                <span>Operating hours: {space.openHours || 'Daily: 8am–10pm'}</span>
              </div>
            </div>
          )}

          {!isHourly && plan === 'daily' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1.5">
                End Date (Optional for multi-day team booking)
              </label>
              <input
                type="date"
                value={manualEndDate}
                min={startDate}
                onChange={e => setManualEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-[#F9F8F5] text-soot text-sm outline-none focus:border-eucalyptus font-normal"
              />
            </div>
          )}

          {/* Pricing Box in Schedule Step */}
          <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-soot block">Calculated Total</span>
              <span className="text-[11px] text-moss">
                {seats} seats × SAR {pricePerSeat} {planLabel}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-soot">
                {planInfo.isCovered ? 'SAR 0' : `SAR ${rawTotalPrice.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Payment */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-soot/8 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Review Team Reservation & Payment
            </h2>
            <p className="text-moss text-xs">Confirm your reservation details and total price breakdown</p>
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
                  <span className="text-soot font-medium">{isHourly ? `Hourly (${durationHours} hours)` : `${plan} pass`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-moss">Date</span>
                  <span className="text-soot font-medium">{startDate}</span>
                </div>
                {isHourly && (
                  <div className="flex justify-between">
                    <span className="text-moss">Time Window</span>
                    <span className="text-soot font-medium">{startTime} – {endTime}</span>
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
                      You have <strong className="text-soot">{availablePoints}</strong> points. (100 pts = SAR 5 discount)
                    </div>
                  </div>
                </div>

                {maxRedeemablePoints >= 100 && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useLoyaltyPoints}
                      onChange={e => setUseLoyaltyPoints(e.target.checked)}
                      className="w-4 h-4 rounded accent-soot cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-soot">
                      Use {maxRedeemablePoints} pts (-SAR {(maxRedeemablePoints / 100) * 5})
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

            {/* Prominent Price Breakdown Box */}
            <div className="p-5 rounded-2xl bg-white border-2 border-soot/10 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
                <Receipt size={16} className="text-moss" />
                <span className="text-xs font-semibold uppercase tracking-wider text-soot">
                  Price Breakdown & Payment Receipt
                </span>
              </div>

              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-moss">Rate per Seat</span>
                <span className="text-soot font-medium">SAR {pricePerSeat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-moss">Seats</span>
                <span className="text-soot font-medium">× {seats}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-moss">Subtotal</span>
                <span className="text-soot font-medium">SAR {rawTotalPrice.toLocaleString()}</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-moss">Loyalty Points Discount ({maxRedeemablePoints} pts)</span>
                  <span className="text-emerald-700 font-semibold">-SAR {pointsDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-moss">VAT (15% included)</span>
                <span className="text-soot font-medium">SAR {(finalPayablePrice * 0.15).toFixed(0)}</span>
              </div>

              <div className="pt-3 border-t border-soot/10 flex justify-between items-center bg-plaster-dark/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                <div>
                  <span className="text-sm font-bold text-soot block">Total Payable Amount</span>
                  <span className="text-xs text-moss">Corporate billing</span>
                </div>
                <div className="text-right">
                  {planInfo.isCovered ? (
                    <span className="text-2xl font-bold text-soot">SAR 0 <span className="text-xs font-medium text-moss">(Enterprise Pass)</span></span>
                  ) : (
                    <span className="text-2xl font-bold text-soot">SAR {finalPayablePrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
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
                  startTime: isHourly ? startTime : undefined,
                  endTime: isHourly ? endTime : undefined,
                  startDate: startDate,
                  endDate: endDate,
                  seats: seats,
                  employees: selectedEmployees,
                  pricePerSeat: pricePerSeat,
                  itemTotal: finalPayablePrice,
                });
                navigate('browse');
              }}
              className="py-3 px-5 rounded-full border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5 transition-all bg-white flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <ShoppingBag size={15} />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={confirmBooking}
              disabled={loading}
              className="flex-1 py-3 px-6 rounded-full bg-[#DDE6DF] text-soot font-medium text-sm hover:bg-[#D0DDD3] transition-all flex items-center justify-center gap-2 shadow-xs border border-soot/8 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Confirming...</span>
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
