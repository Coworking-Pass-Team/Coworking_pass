'use client';

import { useI18n } from '@/i18n';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Star,
  Users,
  Clock,
  Calendar,
  Phone,
  Mail,
  Heart,
  Bell,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import {
  BookingPlan,
  isUserPassHolder,
  getEffectiveSpacePrice,
  getMonthlyPriceForDuration,
  isHourlyAllowed,
  getAllowedPlansForSpace,
  START_TIMES,
  calculateDurationHours,
  getAvailableEndTimes,
  getFilteredStartTimes,
  getFixedSessionSlots,
  getSpaceCategory,
  FIXED_SESSION_HOURS,
  calculateEndTime,
  calculateEndDate,
  calculateDailyDurationDays,
  formatDateRange
} from '@/types/types';
import UnitPicker, { useUnitAvailability, isUnitSlotBooked } from '@/components/spaces/UnitPicker';
import Modal from '@/components/ui/Modal';
import App from '@/app/app';

/**
 * Route entry for /spaces/[id]. This page is rendered by Next directly (outside the SPA router in app.tsx),
 * so once the user navigates to another screen (booking flow, login, ...) the SPA router must take over,
 * otherwise navigate() would only change state that nothing renders.
 */
export default function SpaceDetails() {
  const { nav } = useApp();
  const screen = nav?.screen;
  if (screen && screen !== 'landing' && screen !== 'space-details') {
    return <App />;
  }
  return <SpaceDetailsView />;
}

function SpaceDetailsView() {
  const { t, translateMessage, localizeTime } = useI18n();
  const st = useSpaceText();
  const {
    nav,
    navigate,
    spaces,
    currentUser,
    favorites,
    toggleFavorite,
    waitlist,
    autobooking,
    joinWaitlist,
    leaveWaitlist,
    enableAutoBooking,
    addToCart,
    getSpaceCrowding,
    showToast
  } = useApp();

  const passActive = isUserPassHolder(currentUser);

  const urlId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
  const spaceId = nav?.params?.spaceId || (urlId && urlId !== 'page' && urlId !== '[id]' ? urlId : '') || '';
  const space = spaces && spaces.length > 0 ? spaces.find(s => s.id === spaceId) || null : null;

  const allowedPlans: BookingPlan[] = space ? getAllowedPlansForSpace(space) : (['daily'] as BookingPlan[]);
  const defaultPlan: BookingPlan = allowedPlans[0] || 'daily';

  const [imgIndex, setImgIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<BookingPlan>(defaultPlan);
  const [bookingDate, setBookingDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [bookingEndDate, setBookingEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const isHourlySpace = Boolean(space && isHourlyAllowed(space));
  const [selectedHours, setSelectedHours] = useState<number>(() => (space && isHourlyAllowed(space) ? FIXED_SESSION_HOURS : 1));
  const defaultAvailableStarts = isHourlySpace && space ? getFixedSessionSlots(space.openHours, bookingDate).map(sl => sl.start) : START_TIMES;
  const initialStartTime = defaultAvailableStarts[0] || '09:00 AM';
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>(() => isHourlySpace ? calculateEndTime(initialStartTime, 1) : '05:00 PM');
  const [durationMonths, setDurationMonths] = useState(1);
  // Number of seats for organization booking (min 1, max availableCapacity)
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [waitlistModal, setWaitlistModal] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  const effectiveDailyEndDate = bookingEndDate >= bookingDate ? bookingEndDate : bookingDate;
  const dailyDurationDays = calculateDailyDurationDays(bookingDate, effectiveDailyEndDate);

  const handleBookingDateChange = (newStart: string) => {
    setBookingDate(newStart);
    if (bookingEndDate && newStart > bookingEndDate) {
      setBookingEndDate(newStart);
    }
  };

  const handleBookingEndDateChange = (newEnd: string) => {
    if (newEnd < bookingDate) {
      setBookingEndDate(bookingDate);
      return;
    }
    setBookingEndDate(newEnd);
  };

  const fixedSlots = isHourlySpace && space ? getFixedSessionSlots(space.openHours, bookingDate) : [];

  // Individual halls / theaters: the selected unit decides which sessions are free and how many seats fit
  const { units: unitList } = useUnitAvailability(space, bookingDate, isHourlySpace);
  const [unitId, setUnitId] = useState('');
  const selectedUnit = unitList.find((u) => u.id === unitId) || unitList[0];
  const unitKind: 'hall' | 'theater' = space && getSpaceCategory(space) === 'theater' ? 'theater' : 'hall';
  const seatCap = isHourlySpace && selectedUnit ? selectedUnit.capacity : null;
  useEffect(() => {
    if (unitList.length > 0 && !unitList.some((u) => u.id === unitId)) setUnitId(unitList[0].id);
  }, [unitList, unitId]);
  useEffect(() => {
    if (seatCap !== null && selectedSeats > seatCap) setSelectedSeats(Math.max(1, seatCap));
  }, [seatCap, selectedSeats]);
  const availableStartTimes = isHourlySpace && space ? fixedSlots.filter(sl => !isUnitSlotBooked(selectedUnit, sl.start, sl.end)).map(sl => sl.start) : (space && selectedPlan === 'hourly' ? getFilteredStartTimes(space.openHours, bookingDate, selectedHours) : START_TIMES);
  const durationHours = isHourlySpace || selectedPlan === 'hourly' ? selectedHours : calculateDurationHours(startTime, endTime);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (isHourlySpace || selectedPlan === 'hourly') {
      setEndTime(calculateEndTime(newStart, selectedHours));
    } else {
      const validEnds = getAvailableEndTimes(newStart);
      setEndTime(validEnds[0] || calculateEndTime(newStart, 1));
    }
  };

  const handleHoursChange = (hours: number) => {
    setSelectedHours(hours);
    setEndTime(calculateEndTime(startTime, hours));
  };

  const handleBack = () => {
    if (nav?.params?.fromScreen && navigate) {
      navigate(nav.params.fromScreen, nav.params.fromParams || {});
    } else if (navigate) {
      navigate('browse');
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  useEffect(() => {
    setImgIndex(0);
    if (space) {
      const allowed = getAllowedPlansForSpace(space);
      setSelectedPlan(allowed[0] || 'daily');
      if (isHourlyAllowed(space)) setSelectedHours(FIXED_SESSION_HOURS);
    }
  }, [spaceId, space]);

  // Keep the session window valid for hourly bookings: the initial state is computed before the space
  // data has loaded, and changing date or duration can invalidate the selected start time.
  useEffect(() => {
    if (!space || !(isHourlySpace || selectedPlan === 'hourly')) return;
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
  }, [space, isHourlySpace, selectedPlan, bookingDate, selectedHours, startTime, endTime]);


  if (!space) {
    return (
      <div className="min-h-screen bg-plaster text-soot flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-serif-display text-soot mb-2">{t('spaceDetails.notFound')}</h2>
        <p className="text-moss text-xs sm:text-sm mb-4">{t('spaceDetails.notFoundBody')}</p>
        <button
          type="button"
          onClick={() => {
            if (navigate) {
              navigate('browse');
            } else if (typeof window !== 'undefined') {
              window.history.back();
            }
          }}
          className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-soot/12 bg-white hover:bg-plaster-dark/40 text-soot text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group active:scale-98"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />
          <span>{t('spaceDetails.backToBrowse')}</span>
        </button>
      </div>
    );
  }

  // Block non-admin users from accessing hidden spaces
  if (!space.isVisible && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-plaster text-soot flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-serif-display text-soot mb-2">{t('spaceDetails.notAvailable')}</h2>
        <p className="text-moss text-xs sm:text-sm mb-4">{t('spaceDetails.notAvailableBody')}</p>
        <button
          type="button"
          onClick={() => {
            if (navigate) {
              navigate('browse');
            } else if (typeof window !== 'undefined') {
              window.history.back();
            }
          }}
          className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-soot/12 bg-white hover:bg-plaster-dark/40 text-soot text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group active:scale-98"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />
          <span>{t('spaceDetails.backToBrowse')}</span>
        </button>
      </div>
    );
  }

  // Blocked users cannot browse or book spaces
  if (currentUser?.isBlocked) {
    navigate('login');
    return null;
  }



      const crowding = getSpaceCrowding ? getSpaceCrowding(space) : {
    scannedCount: 0,
    totalCapacity: space.totalCapacity !== undefined && space.totalCapacity !== null ? Number(space.totalCapacity) : 0,
    availableCapacity: space.availableCapacity !== undefined && space.availableCapacity !== null ? Number(space.availableCapacity) : (space.totalCapacity ?? 0),
    occupiedSeats: (space.totalCapacity ?? 0) - (space.availableCapacity ?? 0),
    occupancyPercentage: (space.totalCapacity ?? 0) > 0 ? Math.min(100, Math.max(0, (((space.totalCapacity ?? 0) - (space.availableCapacity ?? 0)) / (space.totalCapacity ?? 1)) * 100)) : 100,
    level: (space.totalCapacity ?? 0) === 0 || (space.availableCapacity ?? 0) === 0 ? 'Busy' : 'Moderate',
    badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-200/90',
    barColor: 'bg-[#D97706]',
    textColor: 'text-[#D97706]',
    trackColor: 'bg-[#E5EBE7]',
  };


  const isFav = favorites.includes(space.id) || (space.name ? favorites.includes(space.name) : false);
  const isFullyBooked = crowding.availableCapacity === 0 || crowding.level === 'Busy';
  const inWaitlist = Boolean(currentUser && waitlist[`${currentUser.id}_${space.id}`]);
  const autoBookOn = Boolean(currentUser && autobooking[`${currentUser.id}_${space.id}`]);
  const hasActiveSubscription = Boolean(currentUser?.hasActivePass);

  const currentWaitlistKeys = Object.keys(waitlist || {}).filter(key => key.endsWith(`_${space.id}`));
  const queuePosition = Math.max(1, currentWaitlistKeys.length + (inWaitlist ? 0 : 1));
  const estimatedMins = Math.max(15, queuePosition * 10);

  const handleBook = () => {
    if (!currentUser) { navigate('login'); return; }
    const hasTimeWindow = isHourlySpace || selectedPlan === 'hourly';
    if (hasTimeWindow && (!bookingDate || !startTime || !endTime || !availableStartTimes.includes(startTime))) {
      showToast?.(t('spaceDetails.invalidSession'), 'error');
      return;
    }
    const params = {
      spaceId: space.id,
      plan: selectedPlan,
      startDate: bookingDate,
      endDate: selectedPlan === 'daily' ? effectiveDailyEndDate : undefined,
      durationDays: selectedPlan === 'daily' ? dailyDurationDays : undefined,
      startTime: hasTimeWindow ? startTime : undefined,
      endTime: hasTimeWindow ? endTime : undefined,
      durationHours: hasTimeWindow ? durationHours : undefined,
      durationMonths,
      seats: selectedSeats,
      unitId: isHourlySpace ? selectedUnit?.id : undefined,
      unitName: isHourlySpace ? selectedUnit?.name : undefined,
    };
    if (currentUser.role === 'organization' || (currentUser.role as any) === 'HR_ADMIN') {
      navigate('team-booking', params);
    } else {
      navigate('booking-flow', params);
    }
  };

  const handleJoinWaitlist = async () => {
    if (joinWaitlist) {
      await (joinWaitlist as any)(space.id, {
        preferredDate: preferredDate || bookingDate,
        alertPreferences: {
          sms: smsAlerts,
          email: emailAlerts,
          whatsapp: whatsappAlerts,
        },
      });
    }
    setWaitlistDone(true);
  };

  const availabilityInfo = isFullyBooked
    ? { label: t('spaceDetails.limitedSpots'), color: 'text-rose-800 bg-rose-100/90 border-rose-200/90 backdrop-blur-md font-semibold' }
    : crowding.availableCapacity <= 5
    ? { label: t('spaceDetails.onlyLeft', { count: crowding.availableCapacity }), color: 'text-amber-900 bg-amber-100/90 border-amber-200/90 backdrop-blur-md font-semibold' }
    : { label: t('spaceDetails.seatsAvailable', { count: crowding.availableCapacity }), color: 'text-emerald-900 bg-emerald-100/90 border-emerald-200/90 backdrop-blur-md font-semibold' };

  const isOrganization = currentUser?.role === 'organization' || (currentUser?.role as any) === 'HR_ADMIN';
  // For org users, effective seats affect total price; for individuals, always 1 seat
  const effectiveSeats = isOrganization ? selectedSeats : 1;

  const currentPlanInfo = getEffectiveSpacePrice(
    currentUser,
    space,
    selectedPlan,
    undefined,
    durationHours,
    durationMonths,
    effectiveSeats,
    selectedPlan === 'daily' ? dailyDurationDays : 1
  );

  // Per-seat price for display
  const perSeatInfo = getEffectiveSpacePrice(
    currentUser,
    space,
    selectedPlan,
    undefined,
    durationHours,
    durationMonths,
    1,
    selectedPlan === 'daily' ? dailyDurationDays : 1
  );

  const planLabel = selectedPlan === 'hourly'
    ? durationHours > 1 ? t('spaceDetails.forHours', { count: durationHours }) : t('spaceDetails.perHour')
    : selectedPlan === 'monthly'
    ? durationMonths > 1 ? t('spaceDetails.forMonths', { count: durationMonths }) : t('spaceDetails.perMonth')
    : selectedPlan === 'daily'
    ? dailyDurationDays > 1 ? t('spaceDetails.forDays', { count: dailyDurationDays }) : t('spaceDetails.perDay')
    : t('spaceDetails.perYear');

  const hoursDisplay = (space as any).openHours || (space as any).hours || 'Sun–Thu: 8am–10pm | Fri: 2pm–10pm';
  const phoneDisplay = space.phone || '+966 11 234 5678';
  const emailDisplay = space.email || 'info@coworkingpass.sa';

  return (
    <div className="min-h-screen bg-plaster text-soot py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-soot/12 bg-white hover:bg-plaster-dark/40 text-soot text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group active:scale-98"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />
            <span>{t('spaceDetails.backToWorkspaces')}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-moss">{t('spaceDetails.spaceId')}</span>
            <span className="text-xs font-semibold text-soot bg-soot/5 px-2 py-0.5 rounded-md uppercase">
              {space.id}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-7">
            <div className="relative h-80 sm:h-[420px] rounded-3xl overflow-hidden border border-soot/12 shadow-xl bg-soot">
              <img
                src={space.images?.[imgIndex] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
                alt={`${space.name} view ${imgIndex + 1}`}
                className="w-full h-full object-cover saturate-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-soot/50 via-transparent to-transparent pointer-events-none" />

              {space.images && space.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImgIndex(i => (i - 1 + space.images.length) % space.images.length)}
                    className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-plaster-surface/90 hover:bg-plaster-surface text-soot flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer"
                    aria-label={t('spaceDetails.prevImage')}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgIndex(i => (i + 1) % space.images.length)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-plaster-surface/90 hover:bg-plaster-surface text-soot flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer"
                    aria-label={t('spaceDetails.nextImage')}
                  >
                    <ChevronRight size={18} />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-soot/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    {space.images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImgIndex(i)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          i === imgIndex ? 'bg-plaster w-5' : 'bg-plaster/40 w-1.5 hover:bg-plaster/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute top-4 end-4">
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => toggleFavorite(space.id)}
                    className="w-10 h-10 rounded-full bg-plaster-surface/90 hover:bg-plaster-surface flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer"
                    aria-label={t('spaceDetails.saveSpace')}
                  >
                    <Heart
                      size={17}
                      fill={isFav ? '#697C70' : 'none'}
                      stroke={isFav ? '#697C70' : '#2D3536'}
                    />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 pb-6 border-b border-soot/10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight">
                    {st.name(space)}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-2 text-xs sm:text-sm text-moss">
                    <MapPin size={14} className="shrink-0" />
                    <span>{st.address(space) || st.city(space)}</span>
                  </div>
                </div>

                <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${availabilityInfo.color}`}>
                  {availabilityInfo.label}
                </span>

                {(space.loyaltyPointsMultiplier || 1) > 1 && (
                  <span className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-600" />
                    <span>{t('spaceDetails.pointsBonus', { multiplier: space.loyaltyPointsMultiplier ?? 1 })}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm pt-1">
                <div className="flex items-center gap-1.5 text-soot font-medium">
                  <Star size={14} fill="#98AA9D" className="text-eucalyptus" />
                  <span>{space.rating}</span>
                  <span className="text-moss">{t('spaceDetails.reviews', { count: space.reviewCount })}</span>
                </div>
                <span className="text-soot/20">&bull;</span>
                <div className="flex items-center gap-1.5 text-moss">
                  <Users size={14} />
                  <span>{t('spaceDetails.totalCapacityDesks', { count: space.totalCapacity })}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-semibold text-soot font-serif-display">
                {t('spaceDetails.about')}
              </h2>
              <p className="text-moss text-xs sm:text-sm leading-relaxed max-w-2xl">
                {st.description(space)}
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-semibold text-soot font-serif-display">
                {t('spaceDetails.amenities')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(space.amenities) && space.amenities.length > 0 ? (
                  space.amenities.map(a => {
                    const amenityName = typeof a === 'string' ? a : (a as any)?.amenity?.name || (a as any)?.name || String(a);
                    return (
                      <div
                        key={amenityName}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-plaster-surface border border-soot/12 text-xs font-medium text-soot shadow-xs"
                      >
                        <Check size={13} className="text-eucalyptus stroke-[2.5]" />
                        <span>{st.amenity(amenityName)}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-moss font-medium">{t('spaceDetails.noAmenities')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3">
              {[
                { icon: Clock, label: t('spaceDetails.operatingHoursLabel'), value: localizeTime(hoursDisplay) },
                { icon: Phone, label: t('spaceDetails.directLine'), value: phoneDisplay },
                { icon: Mail, label: t('spaceDetails.inquiries'), value: emailDisplay },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    backgroundColor: 'var(--plaster-dark, #F2EFE9)',
                    borderColor: 'var(--border, rgba(45, 53, 54, 0.12))',
                  }}
                  className="rounded-2xl p-4 border shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div 
                      style={{ backgroundColor: 'var(--eucalyptus, #98AA9D)' }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-opacity-25"
                    >
                      <item.icon size={15} style={{ color: 'var(--soot, #2D3536)' }} />
                    </div>
                    <span 
                      style={{ color: 'var(--moss, #697C70)' }}
                      className="text-[11px] font-semibold uppercase tracking-wider"
                    >
                      {item.label}
                    </span>
                  </div>
                  <div 
                    style={{ color: 'var(--soot, #2D3536)' }}
                    className="text-xs sm:text-sm font-medium break-words"
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full">
            <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-7 shadow-xl">
              <div className="mb-6 pb-5 border-b border-soot/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-moss block mb-1.5">
                  {currentPlanInfo.effectivePrice === 0 ? t('spaceDetails.passCoverage') : currentPlanInfo.isCovered ? t('spaceDetails.workspaceRate') : currentPlanInfo.hasDiscount ? t('spaceDetails.planUpgradeRate') : t('spaceDetails.membershipRate')}
                </span>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-semibold text-soot tracking-tight whitespace-nowrap">
                      {currentPlanInfo.effectivePrice === 0 ? t('spaceDetails.includedInYourPass') : `${t('common.sar')} ${currentPlanInfo.effectivePrice.toLocaleString()}`}
                    </span>
                    {currentPlanInfo.effectivePrice > 0 && (
                      <span className="text-sm font-medium text-moss whitespace-nowrap">{planLabel}</span>
                    )}
                  </div>

                  {currentPlanInfo.effectivePrice === 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-eucalyptus/30 text-soot font-semibold text-xs border border-eucalyptus/40 shadow-2xs">
                      <Check size={13} className="text-moss shrink-0" />
                      <span>{t('spaceDetails.activeSubscription')}</span>
                    </div>
                  ) : (currentPlanInfo.coveredHours || 0) > 0 ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 font-semibold text-xs border border-amber-500/30">
                      <span>{t('spaceDetails.coveredExtra', { covered: currentPlanInfo.coveredHours ?? 0, extra: currentPlanInfo.payableHours ?? 0 })}</span>
                    </div>
                  ) : currentPlanInfo.isPartiallyCovered ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 font-semibold text-xs border border-amber-500/30">
                      <span>{translateMessage(currentPlanInfo.badgeLabel)}</span>
                    </div>
                  ) : currentPlanInfo.hasDiscount ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 font-semibold text-xs border border-amber-500/30">
                      <span>{t('spaceDetails.passDiscount', { percent: currentPlanInfo.discountPercentage ?? 0, price: currentPlanInfo.effectivePrice.toLocaleString() })}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5 gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-moss whitespace-nowrap">
                      {t('spaceDetails.selectPlan')}
                    </label>
                    <span className="text-[10px] font-semibold text-soot bg-[#E5ECE9] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {isHourlyAllowed(space) ? t('spaceDetails.hourlyDurationBooking') : t('spaceDetails.periodicPlans')}
                    </span>
                  </div>

                  <div className={`grid gap-2 ${allowedPlans.length === 1 ? 'grid-cols-1' : allowedPlans.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                    {allowedPlans.map((plan: BookingPlan) => {
                      const isSelected = selectedPlan === plan;
                      const planP = getEffectiveSpacePrice(
                        currentUser,
                        space,
                        plan,
                        undefined,
                        plan === 'hourly' ? durationHours : 1,
                        plan === 'monthly' ? durationMonths : 1
                      );
                      return (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => setSelectedPlan(plan)}
                          className={`py-3 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-soot text-plaster border-soot shadow-2xs font-semibold'
                              : 'bg-plaster-dark/30 border-soot/10 text-moss hover:text-soot hover:bg-plaster-dark/60'
                          }`}
                        >
                          <div className="capitalize text-xs font-semibold">{t(('spaceDetails.plan.' + plan) as never)}</div>
                          <div className={`text-[10px] mt-1 ${isSelected ? 'text-plaster/80 font-medium' : 'text-moss/80'}`}>
                            {hasActiveSubscription || planP.isCovered ? t('spaceDetails.includedInPass') : `${t('common.sar')} ${planP.effectivePrice.toLocaleString()}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedPlan === 'monthly' && (
                  <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>{t('spaceDetails.selectMonths')}</span>
                      </label>
                      <span className="text-xs font-bold text-soot bg-white px-3 py-1 rounded-full border border-soot/10 shadow-2xs">
                        {t(durationMonths > 1 ? 'spaceDetails.monthsCountMany' : 'spaceDetails.monthsCount', { count: durationMonths })} {hasActiveSubscription ? `· ${t('spaceDetails.includedInPass')}` : `(${currentPlanInfo.isCovered ? t('spaceDetails.includedInPlanPay') : `${t('common.sar')} ${currentPlanInfo.effectivePrice.toLocaleString()}`})`}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 6, 12].map(m => {
                        const tierPrice = getMonthlyPriceForDuration(space, m);
                        const isSelected = durationMonths === m;
                        const isTierCovered = currentPlanInfo.isCovered && m === 1;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setDurationMonths(m)}
                            className={`py-2.5 px-1.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-soot text-plaster border-soot shadow-2xs font-semibold'
                                : 'bg-white border-soot/10 text-moss hover:text-soot hover:border-soot/30'
                            }`}
                          >
                            <div className="font-bold text-xs">{t(m === 1 ? 'spaceDetails.monthShort' : 'spaceDetails.monthsShort', { count: m })}</div>
                            <div className={`text-[10px] mt-1 ${isSelected ? 'text-plaster/80 font-medium' : 'text-moss'}`}>
                              {hasActiveSubscription || isTierCovered ? t('spaceDetails.includedInPass') : `${t('common.sar')} ${tierPrice.toLocaleString()}`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedPlan === 'daily' && !isHourlySpace && (
                  <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar size={12} className="shrink-0" />
                        <span>{t('spaceDetails.dailyDates')}</span>
                      </label>
                      <span className="text-xs font-bold text-soot bg-white px-2.5 py-1 rounded-full border border-soot/10 shadow-2xs whitespace-nowrap shrink-0">
                        {t(dailyDurationDays === 1 ? 'spaceDetails.dayCount' : 'spaceDetails.daysCount', { count: dailyDurationDays })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-moss mb-1 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>{t('spaceDetails.startDate')}</span>
                        </label>
                        <input
                          type="date"
                          value={bookingDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => handleBookingDateChange(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-moss mb-1 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>{t('spaceDetails.endDate')}</span>
                        </label>
                        <input
                          type="date"
                          value={bookingEndDate}
                          min={bookingDate}
                          onChange={(e) => handleBookingEndDateChange(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-soot/8 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-moss block text-[10px] uppercase font-semibold">Selected Range</span>
                        <span className="font-semibold text-soot">{formatDateRange(bookingDate, effectiveDailyEndDate)}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-moss block text-[10px] uppercase font-semibold">
                          {hasActiveSubscription ? t('spaceDetails.passCoverage') : t('spaceDetails.durationTotal')}
                        </span>
                        <span className="font-bold text-soot">
                          {hasActiveSubscription || currentPlanInfo.isCovered ? (
                            <span className="text-emerald-800">{t('spaceDetails.includedInPass')}</span>
                          ) : (
                            `${t('common.sar')} ${currentPlanInfo.effectivePrice.toLocaleString()}`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedPlan === 'monthly' || selectedPlan === 'yearly') && (
                  <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-2">
                    <label className="block text-[11px] font-semibold text-moss mb-1 flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{t('spaceDetails.startDate')}</span>
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleBookingDateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                    />
                    <div className="text-[11px] text-moss flex justify-between pt-1">
                      <span>{t('spaceDetails.periodEnd')}</span>
                      <span className="font-semibold text-soot">
                        {calculateEndDate(bookingDate, selectedPlan, durationMonths)}
                      </span>
                    </div>
                  </div>
                )}

                {(isHourlyAllowed(space) || selectedPlan === 'hourly') && (
                  <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5 whitespace-nowrap">
                        <Clock size={12} className="shrink-0" />
                        <span>Select Hourly Booking Duration</span>
                      </label>
                      <span className="text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap shrink-0">
                        {t(durationHours === 1 ? 'spaceDetails.hoursDuration' : 'spaceDetails.hoursDurationMany', { count: durationHours })}
                      </span>
                    </div>

                    {/* Flexible durations are only offered outside halls and theaters (those use fixed 2-hour sessions) */}
                    {!isHourlySpace && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-moss block">
                        Duration (Hours)
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {[1, 2, 3, 4, 6, 8].map((h) => {
                          const isSelected = selectedHours === h;
                          const hourlyP = getEffectiveSpacePrice(currentUser, space, 'hourly', undefined, h);
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
                              <div className="font-bold text-xs">{t(h === 1 ? 'spaceDetails.hourOne' : 'spaceDetails.hourMany', { count: h })}</div>
                              <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-plaster/80 font-medium' : 'text-moss'}`}>
                                {hasActiveSubscription && hourlyP.isCovered
                                  ? 'Pass Quota'
                                  : `${t('common.sar')} ${hourlyP.effectivePrice.toLocaleString()}`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-moss mb-1 flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{t('spaceDetails.reservationDate')}</span>
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          handleBookingDateChange(e.target.value);
                          setBookingEndDate(e.target.value);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                      />
                    </div>

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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                                  {localizeTime(slot.start)} – {localizeTime(slot.end)}{taken ? ` · ${t('units.slotTaken')}` : ''}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-moss mb-1">
                          {t('spaceDetails.sessionStart')}
                        </label>
                        <select
                          value={startTime}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                        >
                          {availableStartTimes.map((tm) => (
                            <option key={tm} value={tm}>
                              {localizeTime(tm)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-moss mb-1">
                          {t('spaceDetails.sessionEnd')}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={`${localizeTime(endTime)} (${t(durationHours === 1 ? 'spaceDetails.hourOne' : 'spaceDetails.hourMany', { count: durationHours })})`}
                          className="w-full px-3 py-2.5 rounded-xl bg-soot/5 border border-soot/10 text-moss text-xs font-medium cursor-not-allowed shadow-2xs"
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
                          {bookingDate} · {localizeTime(startTime)} – {localizeTime(endTime)} ({t(durationHours === 1 ? 'spaceDetails.hourLower' : 'spaceDetails.hoursLower', { count: durationHours })})
                        </span>
                      </div>
                      <div className="text-start sm:text-end">
                        <span className="text-moss block text-[10px] uppercase font-semibold">{t('spaceDetails.venueHours')}</span>
                        <span className="font-semibold text-soot">{localizeTime(space.openHours) || t('spaceDetails.standardHours')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPlan === 'yearly' && !passActive && (
                  <div className="mt-2.5 text-[11px] text-moss bg-eucalyptus/20 border border-eucalyptus/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-soot shrink-0" />
                    <span>{t('spaceDetails.saveAnnual', { percent: Math.round((1 - (space.pricing?.yearly || 18000) / ((space.pricing?.monthly || 1800) * 12)) * 100) })}</span>
                  </div>
                )}
              </div>

              {/* Seat Quantity Selector - visible only for organization accounts */}
              {isOrganization && (!isHourlySpace || unitList.length > 0) && (
                <div className="mb-4 p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                        <Users size={13} />
                        <span>{t('spaceDetails.numberOfSeats')}</span>
                      </label>
                      <p className="text-[10px] text-moss mt-0.5">
                        Select how many desks / seats for your team
                      </p>
                    </div>
                    <span className="text-xs font-bold text-soot bg-white px-3 py-1 rounded-full border border-soot/10 shadow-2xs">
                      {t(selectedSeats === 1 ? 'spaceDetails.seatOne' : 'spaceDetails.seatMany', { count: selectedSeats })}
                    </span>
                  </div>

                  {/* Stepper Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSeats(s => Math.max(1, s - 1))}
                      disabled={selectedSeats <= 1}
                      className="w-9 h-9 rounded-xl border border-soot/15 bg-white text-soot font-bold text-lg flex items-center justify-center hover:bg-plaster-dark/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      –
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-serif-display font-normal text-soot">{selectedSeats}</span>
                      <span className="text-xs text-moss ms-1">{selectedSeats === 1 ? t('spaceDetails.seatSingular') : t('spaceDetails.seatPlural')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSeats(s => Math.min(seatCap ?? (crowding.availableCapacity || 50), s + 1))}
                      disabled={selectedSeats >= (seatCap ?? (crowding.availableCapacity || 50))}
                      className="w-9 h-9 rounded-xl border border-soot/15 bg-white text-soot font-bold text-lg flex items-center justify-center hover:bg-plaster-dark/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick-select pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 5, 10, 20, 50].filter(n => n <= (seatCap ?? (crowding.availableCapacity || 50))).map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSelectedSeats(n)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          selectedSeats === n
                            ? 'bg-soot text-plaster border-soot'
                            : 'bg-white text-moss border-soot/15 hover:border-soot/40 hover:text-soot'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  {/* Price breakdown per seat and total */}
                  <div className="bg-white rounded-xl p-3 border border-soot/8 text-xs space-y-1">
                    <div className="flex justify-between text-moss">
                      <span>{t('spaceDetails.pricePerSeat')}</span>
                      <span className="font-semibold text-soot">
                        {perSeatInfo.isCovered ? t('spaceDetails.coveredByPlan') : `${t('common.sar')} ${perSeatInfo.effectivePrice.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-moss">
                      <span>{t('spaceDetails.seatsSelected')}</span>
                      <span className="font-semibold text-soot">× {selectedSeats}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-soot/8">
                      <span className="font-semibold text-soot">{t('common.total')}</span>
                      <span className="font-bold text-soot">
                        {currentPlanInfo.isCovered
                          ? <span className="text-emerald-700">{t('spaceDetails.includedInPass')}</span>
                          : `${t('common.sar')} ${currentPlanInfo.effectivePrice.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 p-4 rounded-2xl bg-[#FAF7F2] border border-soot/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-moss font-normal">{t('space.capacity')}</span>
                  <span className={`font-semibold ${isFullyBooked ? 'text-rose-700' : crowding.textColor}`}>
                    {isFullyBooked ? t('spaceDetails.busyFull') : t(('crowding.' + crowding.level) as never)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E5EBE7] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isFullyBooked ? 'bg-rose-600' : crowding.barColor}`}
                    style={{
                      width: `${isFullyBooked ? 100 : Math.min(100, Math.max(10, crowding.occupancyPercentage))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-moss pt-0.5">
                  <span>{t('spaceDetails.availableOf', { available: isFullyBooked ? 0 : crowding.availableCapacity, total: crowding.totalCapacity })}</span>
                  <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    {t('spaceDetails.qrCheckins', { count: crowding.scannedCount })}
                  </span>
                </div>
              </div>

              {isFullyBooked ? (
                <div className="space-y-3">
                  <div className="rounded-2xl p-4 text-center border border-soot/12 bg-plaster-dark/30">
                    <div className="w-9 h-9 rounded-full bg-soot/10 flex items-center justify-center mx-auto mb-2">
                      <Bell size={16} className="text-soot" />
                    </div>
                    <div className="text-soot font-semibold text-xs mb-0.5">
                      {t('spaceDetails.maxCapacity')}
                    </div>
                    <div className="text-moss text-[11px]">
                      {t('spaceDetails.joinWaitlistHint')}
                    </div>
                  </div>

                  {inWaitlist ? (
                    <div className="bg-eucalyptus/25 border border-eucalyptus/35 rounded-2xl p-4 text-center space-y-2">
                      <div className="text-soot font-semibold text-xs flex items-center justify-center gap-2">
                        <Check size={14} className="text-soot stroke-[2.5]" />
                        <span>{t('spaceDetails.onWaitlist')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => leaveWaitlist(space.id)}
                        className="text-[11px] text-moss hover:text-red-700 font-medium underline transition-colors cursor-pointer"
                      >
                        {t('spaceDetails.leaveWaitlist')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) { navigate('login'); return; }
                        setWaitlistDone(false);
                        setWaitlistModal(true);
                      }}
                      className="w-full py-3.5 rounded-xl bg-soot text-plaster font-semibold text-sm hover:bg-moss active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Bell size={15} />
                      <span>{t('spaceDetails.joinWaitlist')}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleBook}
                    className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-soot text-plaster hover:bg-moss active:scale-[0.99] transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-eucalyptus"
                  >
                    <span>{currentUser
                      ? (currentPlanInfo.effectivePrice === 0
                        ? t('spaceDetails.reserveCovered')
                        : isOrganization && selectedSeats > 1
                          ? t('spaceDetails.proceedSeats', { currency: t('common.sar'), price: currentPlanInfo.effectivePrice.toLocaleString(), seats: selectedSeats })
                          : t('spaceDetails.proceed', { currency: t('common.sar'), price: currentPlanInfo.effectivePrice.toLocaleString() }))
                      : t('spaceDetails.signInToReserve')}</span>
                    <ArrowRight size={16} />
                  </button>

                  {currentUser && (currentUser.role === 'individual' || currentUser.role === 'organization' || (currentUser.role as any) === 'B2C' || (currentUser.role as any) === 'HR_ADMIN') && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetDate = bookingDate || new Date().toISOString().split('T')[0];
                        const isCoveredBooking = currentPlanInfo.effectivePrice === 0;
                        const hasTimeWindow = isHourlySpace || selectedPlan === 'hourly';
                        addToCart({
                          spaceId: space.id,
                          spaceName: space.name,
                          spaceCity: space.city,
                          spaceAddress: space.address || (space as any).location || space.city,
                          spaceImage: space.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
                          type: space.type,
                          plan: selectedPlan,
                          durationHours: hasTimeWindow ? durationHours : undefined,
                          durationMonths: selectedPlan === 'monthly' ? durationMonths : undefined,
                          durationDays: selectedPlan === 'daily' ? dailyDurationDays : undefined,
                          startTime: hasTimeWindow ? startTime : undefined,
                          endTime: hasTimeWindow ? endTime : undefined,
                          startDate: targetDate,
                          endDate: selectedPlan === 'hourly' ? targetDate : selectedPlan === 'daily' ? effectiveDailyEndDate : calculateEndDate(targetDate, selectedPlan, durationMonths),
                          seats: 1,
                          pricePerSeat: isCoveredBooking ? 0 : currentPlanInfo.effectivePrice,
                          itemTotal: isCoveredBooking ? 0 : currentPlanInfo.effectivePrice,
                        });
                      }}
                      className="w-full py-3 px-4 rounded-xl font-semibold text-xs border border-soot/15 text-soot bg-white hover:bg-plaster-dark/40 active:scale-[0.99] transition-all duration-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag size={15} />
                      <span>{currentPlanInfo.effectivePrice === 0 ? t('spaceDetails.addToCartCovered') : t('spaceDetails.addPassToCart')}</span>
                    </button>
                  )}
                </div>
              )}

              {!currentUser && (
                <p className="text-center text-xs text-moss mt-4 pt-3.5 border-t border-soot/10">
                  {t('spaceDetails.newToNetwork')}{' '}
                  <button
                    type="button"
                    onClick={() => navigate('signup')}
                    className="text-soot font-bold hover:underline cursor-pointer"
                  >
                    {t('spaceDetails.createAccount')}
                  </button>
                </p>
              )}

              <div className="mt-5 pt-4 border-t border-soot/10 flex items-center justify-center gap-2 text-[11px] text-moss">
                <ShieldCheck size={13} className="text-eucalyptus shrink-0" />
                <span>{t('spaceDetails.verified')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={waitlistModal}
        onClose={() => setWaitlistModal(false)}
        title={t('spaceDetails.waitlistTitle')}
        size="md"
      >
        <div className="p-6 text-soot">
          {waitlistDone ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-eucalyptus/25 flex items-center justify-center mx-auto mb-4">
                <Check size={26} className="text-soot stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-normal font-serif-display text-soot mb-1.5">{t('spaceDetails.inLine')}</h3>
              <p className="text-xs sm:text-sm text-moss leading-relaxed max-w-xs mx-auto mb-6">
                {t('spaceDetails.notifyWhenOpens', { name: st.name(space) })}
              </p>
              <button
                type="button"
                onClick={() => setWaitlistModal(false)}
                className="w-full py-3 rounded-xl bg-soot text-plaster text-xs sm:text-sm font-semibold hover:bg-moss transition-colors cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-plaster-dark/30 border border-soot/12">
                <img
                  src={space.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
                  alt={st.name(space)}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <div className="font-semibold text-soot text-xs sm:text-sm">{space.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-moss mt-0.5">
                    <MapPin size={10} />
                    <span>{st.city(space)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-plaster-surface border border-soot/12">
                  <div className="text-[11px] text-moss mb-0.5">Queue Status</div>
                  <div className="text-lg font-semibold text-soot">Position #{queuePosition}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-plaster-surface border border-soot/12">
                  <div className="text-[11px] text-moss mb-0.5">Est. Notification</div>
                  <div className="text-lg font-semibold text-soot">~{estimatedMins} mins</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                  {t('spaceDetails.preferredDate')}
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setPreferredDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-plaster-surface text-soot text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-soot mb-2 uppercase tracking-wider">
                  {t('spaceDetails.alertChannels')}
                </label>
                <div className="flex flex-wrap gap-4 text-xs text-soot">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={e => setSmsAlerts(e.target.checked)}
                      className="accent-soot"
                    />
                    <span>{t('spaceDetails.sms')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={e => setEmailAlerts(e.target.checked)}
                      className="accent-soot"
                    />
                    <span>{t('spaceDetails.email')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappAlerts}
                      onChange={e => setWhatsappAlerts(e.target.checked)}
                      className="accent-soot"
                    />
                    <span>{t('spaceDetails.whatsapp')}</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-plaster-dark/30 border border-soot/12 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-soot">
                    <Sparkles size={15} className="text-moss" />
                    <span>{t('spaceDetails.autoBooking')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (autoBookOn) {
                        leaveWaitlist(space.id);
                      } else {
                        enableAutoBooking(space.id, currentUser?.savedCards?.[0]?.id || 'card-1');
                      }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      autoBookOn ? 'bg-soot' : 'bg-soot/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoBookOn ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-moss leading-relaxed">
                  {t('spaceDetails.autoBookingBody')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleJoinWaitlist}
                className="w-full py-3.5 rounded-xl bg-soot text-plaster font-semibold text-xs sm:text-sm hover:bg-moss transition-all cursor-pointer shadow-md mt-2"
              >
                {t('spaceDetails.confirmWaitlist')}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
