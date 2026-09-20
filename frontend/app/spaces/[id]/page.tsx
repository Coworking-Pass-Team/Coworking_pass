'use client';

import { useState, useEffect } from 'react';
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
  Info,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '@/app/store';
import {
  Space,
  BookingPlan,
  isUserPassHolder,
  getEffectiveSpacePrice,
  getHourlyPriceForDuration,
  getMonthlyPriceForDuration,
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
  calculateEndTime,
  calculateEndDate,
  calculateDailyDurationDays,
  formatDateRange,
  timeStringToMinutes
} from '@/types/types';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

export default function SpaceDetails() {
  const { nav, navigate, goBack, spaces, currentUser, favorites, toggleFavorite, waitlist, autobooking, joinWaitlist, leaveWaitlist, enableAutoBooking, disableAutoBooking, addToCart, getSpaceCrowding } = useApp();
  const passActive = isUserPassHolder(currentUser);

  const urlId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
  const spaceId = nav?.params?.spaceId || (urlId && urlId !== 'page' && urlId !== '[id]' ? urlId : '') || 'space-1';
  const space = spaces.find(s => s.id === spaceId) || spaces[0];

  const allowedPlans: BookingPlan[] = space ? getAllowedPlansForSpace(space) : (['hourly', 'daily', 'monthly', 'yearly'] as BookingPlan[]);
  const defaultPlan: BookingPlan = isOfficeSpace(space?.type) ? 'daily' : isHourlyOnlySpace(space?.type) ? 'hourly' : 'hourly';

  const [imgIndex, setImgIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<BookingPlan>(defaultPlan);
  const [bookingDate, setBookingDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [bookingEndDate, setBookingEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('09:00 AM');
  const [endTime, setEndTime] = useState<string>('05:00 PM');
  const [durationMonths, setDurationMonths] = useState(1);
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
  const isHourlySpace = isHourlyAllowed(space);
  const availableStartTimes = isHourlySpace ? getFilteredStartTimes(space?.openHours, bookingDate) : START_TIMES;
  const availableEndTimes = isHourlySpace ? getFilteredEndTimes(startTime, space?.openHours, bookingDate) : getAvailableEndTimes(startTime);

  const durationHours = calculateDurationHours(startTime, endTime);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const validEnds = isHourlySpace ? getFilteredEndTimes(newStart, space?.openHours, bookingDate) : getAvailableEndTimes(newStart);
    const startMin = timeStringToMinutes(newStart);
    const endMin = timeStringToMinutes(endTime);
    if (endMin <= startMin || !validEnds.includes(endTime)) {
      setEndTime(validEnds[0] || calculateEndTime(newStart, 1));
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
  };

  useEffect(() => {
    setImgIndex(0);
    if (space) {
      if (isHourlyAllowed(space)) {
        // Default to hourly if space supports hourly
        setSelectedPlan('hourly');
      } else {
        // Office/Desks: Default to daily or monthly, never hourly
        setSelectedPlan('daily');
      }
    }
  }, [spaceId, space?.type]);

  if (!space) {
    return (
      <div className="min-h-screen bg-plaster text-soot flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-serif-display text-soot mb-2">Space not found</h2>
        <button
          type="button"
          onClick={() => navigate('browse')}
          className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-soot/12 bg-white hover:bg-plaster-dark/40 text-soot text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group active:scale-98"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Browse Workspaces</span>
        </button>
      </div>
    );
  }

  const crowding = getSpaceCrowding ? getSpaceCrowding(space) : {
    scannedCount: 0,
    totalCapacity: space.totalCapacity || 30,
    availableCapacity: space.availableCapacity ?? 15,
    occupiedSeats: (space.totalCapacity || 30) - (space.availableCapacity ?? 15),
    occupancyPercentage: 50,
    level: 'Moderate' as const,
    badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-200/90',
    barColor: 'bg-[#D97706]',
    textColor: 'text-[#D97706]',
    trackColor: 'bg-[#E5EBE7]',
  };

  const isFav = favorites.includes(space.id);
  const isFullyBooked = crowding.availableCapacity === 0 || crowding.level === 'Busy';
  const inWaitlist = Boolean(currentUser && waitlist[`${currentUser.id}_${space.id}`]);
  const autoBookOn = Boolean(currentUser && autobooking[`${currentUser.id}_${space.id}`]);
  const hasActiveSubscription = Boolean(currentUser?.hasActivePass);

  const handleBook = () => {
    if (!currentUser) { navigate('login'); return; }
    const hasTimeWindow = isHourlySpace || selectedPlan === 'hourly';
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
    };
    if (currentUser.role === 'organization') {
      navigate('team-booking', params);
    } else {
      navigate('booking-flow', params);
    }
  };

  const handleJoinWaitlist = () => {
    joinWaitlist(space.id);
    setWaitlistDone(true);
  };

  const availabilityInfo = isFullyBooked
    ? { label: 'Limited Spots', color: 'text-rose-800 bg-rose-100/90 border-rose-200/90 backdrop-blur-md font-semibold' }
    : crowding.availableCapacity <= 5
    ? { label: `Only ${crowding.availableCapacity} left!`, color: 'text-amber-900 bg-amber-100/90 border-amber-200/90 backdrop-blur-md font-semibold' }
    : { label: `${crowding.availableCapacity} seats available`, color: 'text-emerald-900 bg-emerald-100/90 border-emerald-200/90 backdrop-blur-md font-semibold' };

  const currentPlanInfo = getEffectiveSpacePrice(
    currentUser,
    space,
    selectedPlan,
    undefined,
    durationHours,
    durationMonths,
    1,
    selectedPlan === 'daily' ? dailyDurationDays : 1
  );
  const planPrice = currentPlanInfo.effectivePrice;
  const planLabel = selectedPlan === 'hourly'
    ? durationHours > 1 ? `for ${durationHours} hours` : '/ hour'
    : selectedPlan === 'monthly'
    ? durationMonths > 1 ? `for ${durationMonths} months` : '/ month'
    : selectedPlan === 'daily'
    ? dailyDurationDays > 1 ? `for ${dailyDurationDays} days` : '/ day'
    : '/ year';

  const hoursDisplay = (space as any).openHours || (space as any).hours || 'Sun–Thu: 8am–10pm | Fri: 2pm–10pm';
  const phoneDisplay = space.phone || '+966 11 234 5678';
  const handleBack = () => {
    if (nav?.params?.fromScreen) {
      navigate(nav.params.fromScreen, nav.params.fromParams || {});
    } else {
      navigate('browse');
    }
  };

  const emailDisplay = space.email || 'info@coworkingpass.sa';

  return (
    <div className="min-h-screen bg-plaster text-soot py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb / Back */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-soot/12 bg-white hover:bg-plaster-dark/40 text-soot text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group active:scale-98"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Workspaces</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-moss">Space ID:</span>
            <span className="text-xs font-semibold text-soot bg-soot/5 px-2 py-0.5 rounded-md uppercase">
              {space.id}
            </span>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details & Images */}
          <div className="lg:col-span-2 space-y-7">
            {/* Carousel Frame */}
            <div className="relative h-80 sm:h-[420px] rounded-3xl overflow-hidden border border-soot/12 shadow-xl bg-soot">
              <img
                src={space.images?.[imgIndex] ? space.images[imgIndex] : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
                alt={`${space.name} view ${imgIndex + 1}`}
                className="w-full h-full object-cover saturate-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-soot/50 via-transparent to-transparent pointer-events-none" />

              {space.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImgIndex(i => (i - 1 + space.images.length) % space.images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-plaster-surface/90 hover:bg-plaster-surface text-soot flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgIndex(i => (i + 1) % space.images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-plaster-surface/90 hover:bg-plaster-surface text-soot flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer"
                    aria-label="Next image"
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

              {/* Heart Favorite Action */}
              <div className="absolute top-4 right-4">
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => toggleFavorite(space.id)}
                    className="w-10 h-10 rounded-full bg-plaster-surface/90 hover:bg-plaster-surface flex items-center justify-center backdrop-blur-md shadow-md transition-all cursor-pointer"
                    aria-label="Save space"
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

            {/* Title & Key Stats */}
            <div className="space-y-3 pb-6 border-b border-soot/10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight">
                    {space.name}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-2 text-xs sm:text-sm text-moss">
                    <MapPin size={14} className="shrink-0" />
                    <span>{space.address}</span>
                  </div>
                </div>

                <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${availabilityInfo.color}`}>
                  {availabilityInfo.label}
                </span>

                {(space.loyaltyPointsMultiplier || 1) > 1 && (
                  <span className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-600" />
                    <span>{space.loyaltyPointsMultiplier}× Points Bonus</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm pt-1">
                <div className="flex items-center gap-1.5 text-soot font-medium">
                  <Star size={14} fill="#98AA9D" className="text-eucalyptus" />
                  <span>{space.rating}</span>
                  <span className="text-moss">({space.reviewCount} reviews)</span>
                </div>
                <span className="text-soot/20">&bull;</span>
                <div className="flex items-center gap-1.5 text-moss">
                  <Users size={14} />
                  <span>Total Capacity: {space.totalCapacity} desks</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-semibold text-soot font-serif-display">
                About this workspace
              </h2>
              <p className="text-moss text-xs sm:text-sm leading-relaxed max-w-2xl">
                {space.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-semibold text-soot font-serif-display">
                Included Amenities
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
                        <span>{amenityName}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-moss font-medium">No specific amenities added to this workspace yet.</p>
                )}
              </div>
            </div>

            {/* Contact & Hours Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3">
              {[
                { icon: Clock, label: 'Operating Hours', value: hoursDisplay },
                { icon: Phone, label: 'Direct Line', value: phoneDisplay },
                { icon: Mail, label: 'Inquiries', value: emailDisplay },
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

          {/* Right Column: Static Stable Booking Card */}
          <div className="w-full">
            <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-7 shadow-xl">
              {/* Price Tag / Pass Badge */}
              <div className="mb-6 pb-5 border-b border-soot/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-moss block mb-1.5">
                  {currentPlanInfo.effectivePrice === 0 ? 'Pass Coverage' : currentPlanInfo.isCovered ? 'Workspace Rate' : currentPlanInfo.hasDiscount ? 'Plan Upgrade Rate' : 'Membership Rate'}
                </span>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-semibold text-soot tracking-tight whitespace-nowrap">
                      {currentPlanInfo.effectivePrice === 0 ? 'Included in your Pass' : `SAR ${currentPlanInfo.effectivePrice.toLocaleString()}`}
                    </span>
                    {currentPlanInfo.effectivePrice > 0 && (
                      <span className="text-sm font-medium text-moss whitespace-nowrap">{planLabel}</span>
                    )}
                  </div>

                  {currentPlanInfo.effectivePrice === 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-eucalyptus/30 text-soot font-semibold text-xs border border-eucalyptus/40 shadow-2xs">
                      <Check size={13} className="text-moss shrink-0" />
                      <span>Active Subscription · Covered by your Pass</span>
                    </div>
                  ) : (currentPlanInfo.coveredHours || 0) > 0 ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 font-semibold text-xs border border-amber-500/30">
                      <span>{currentPlanInfo.coveredHours}h Covered by Pass · {currentPlanInfo.payableHours}h Extra</span>
                    </div>
                  ) : currentPlanInfo.isPartiallyCovered ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 font-semibold text-xs border border-amber-500/30">
                      <span>{currentPlanInfo.badgeLabel}</span>
                    </div>
                  ) : currentPlanInfo.hasDiscount ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 font-semibold text-xs border border-amber-500/30">
                      <span>{currentPlanInfo.discountPercentage}% Pass Discount · SAR {currentPlanInfo.effectivePrice.toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Plan Choice Selectors */}
              <div className="mb-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5 gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-moss whitespace-nowrap">
                      Select Booking Plan
                    </label>
                    <span className="text-[10px] font-semibold text-soot bg-[#E5ECE9] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {isHourlyAllowed(space) ? 'Hourly • Daily • Monthly • Yearly' : 'Daily • Monthly • Yearly'}
                    </span>
                  </div>

                  <div className={`grid gap-2 ${allowedPlans.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
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
                          <div className="capitalize text-xs font-semibold">{plan}</div>
                          <div className={`text-[10px] mt-1 ${isSelected ? 'text-plaster/80 font-medium' : 'text-moss/80'}`}>
                            {hasActiveSubscription || planP.isCovered ? 'Included in Pass' : `SAR ${planP.effectivePrice.toLocaleString()}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-Month Duration Selector (when monthly is chosen) */}
                {selectedPlan === 'monthly' && (
                  <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>Select Number of Months</span>
                      </label>
                      <span className="text-xs font-bold text-soot bg-white px-3 py-1 rounded-full border border-soot/10 shadow-2xs">
                        {durationMonths} Month{durationMonths > 1 ? 's' : ''} {hasActiveSubscription ? '· Included in Pass' : `(${currentPlanInfo.isCovered ? 'Included in your Plan · SAR 0 to Pay' : `SAR ${currentPlanInfo.effectivePrice.toLocaleString()}`})`}
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
                            <div className="font-bold text-xs">{m} {m === 1 ? 'Mo' : 'Mos'}</div>
                            <div className={`text-[10px] mt-1 ${isSelected ? 'text-plaster/80 font-medium' : 'text-moss'}`}>
                              {hasActiveSubscription || isTierCovered ? 'Included in Pass' : `SAR ${tierPrice.toLocaleString()}`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Daily Pass Date Range Selector */}
                {selectedPlan === 'daily' && (
                  <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar size={12} className="shrink-0" />
                        <span>Specify Daily Pass Dates</span>
                      </label>
                      <span className="text-xs font-bold text-soot bg-white px-2.5 py-1 rounded-full border border-soot/10 shadow-2xs whitespace-nowrap shrink-0">
                        {dailyDurationDays} {dailyDurationDays === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-moss mb-1 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>Start Date</span>
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
                          <span>End Date</span>
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
                      <div className="text-right">
                        <span className="text-moss block text-[10px] uppercase font-semibold">
                          {hasActiveSubscription ? 'Pass Coverage' : 'Duration Total'}
                        </span>
                        <span className="font-bold text-soot">
                          {hasActiveSubscription || currentPlanInfo.isCovered ? (
                            <span className="text-emerald-800">Included in Pass</span>
                          ) : (
                            `SAR ${currentPlanInfo.effectivePrice.toLocaleString()}`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monthly & Yearly Start Date Selector */}
                {(selectedPlan === 'monthly' || selectedPlan === 'yearly') && (
                  <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-2">
                    <label className="block text-[11px] font-semibold text-moss mb-1 flex items-center gap-1">
                      <Calendar size={11} />
                      <span>Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleBookingDateChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                    />
                    <div className="text-[11px] text-moss flex justify-between pt-1">
                      <span>Period End:</span>
                      <span className="font-semibold text-soot">
                        {calculateEndDate(bookingDate, selectedPlan, durationMonths)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Allowed Daily Hours Selector for Halls and Theaters (All Plans) or Hourly Plan */}
                {isHourlyAllowed(space) && (
                  <div className="p-4 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-moss flex items-center gap-1.5 whitespace-nowrap">
                        <Clock size={12} className="shrink-0" />
                        <span>{selectedPlan === 'hourly' ? 'Specify Date & Exact Time' : 'Allowed Daily Hours (No 24/7 Access)'}</span>
                      </label>
                      <span className="text-xs font-bold text-soot bg-white px-2.5 py-1 rounded-full border border-soot/10 shadow-2xs whitespace-nowrap shrink-0">
                        {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}{selectedPlan === 'hourly' ? '' : '/day'}
                      </span>
                    </div>

                    {/* Booking Date Input (Only when hourly, since daily/monthly have date inputs above) */}
                    {selectedPlan === 'hourly' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-moss mb-1 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>Booking Date</span>
                        </label>
                        <input
                          type="date"
                          value={bookingDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-moss mb-1">
                          {selectedPlan === 'hourly' ? 'Start Time' : 'Daily Start Time'}
                        </label>
                        <select
                          value={startTime}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                        >
                          {availableStartTimes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-moss mb-1">
                          {selectedPlan === 'hourly' ? 'End Time' : 'Daily End Time'}
                        </label>
                        <select
                          value={endTime}
                          onChange={(e) => handleEndTimeChange(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-xs font-medium focus:outline-none focus:border-eucalyptus cursor-pointer shadow-2xs"
                        >
                          {availableEndTimes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-soot/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-moss block text-[10px] uppercase font-semibold">
                          {selectedPlan === 'hourly' ? 'Scheduled Date & Time' : 'Daily Operating Window'}
                        </span>
                        <span className="font-semibold text-soot">
                          {selectedPlan === 'hourly' ? `${bookingDate} · ${startTime} – ${endTime}` : `${startTime} – ${endTime} each day`}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-moss block text-[10px] uppercase font-semibold">Venue Operating Hours</span>
                        <span className="font-semibold text-soot">{space.openHours || 'Standard Operating Hours'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPlan === 'yearly' && !passActive && (
                  <div className="mt-2.5 text-[11px] text-moss bg-eucalyptus/20 border border-eucalyptus/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-soot shrink-0" />
                    <span>Save {Math.round((1 - (space.pricing?.yearly || 18000) / ((space.pricing?.monthly || 1800) * 12)) * 100)}% with annual commitment</span>
                  </div>
                )}
              </div>

              {/* Live Crowding Indicator (Connected to QR Code Scans) */}
              <div className="mb-6 p-4 rounded-2xl bg-[#FAF7F2] border border-soot/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-moss font-normal">Capacity</span>
                  <span className={`font-semibold ${crowding.textColor}`}>
                    {crowding.level}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E5EBE7] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${crowding.barColor}`}
                    style={{
                      width: `${
                        crowding.level === 'Busy'
                          ? 100
                          : Math.min(100, Math.max(10, crowding.occupancyPercentage))
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-moss pt-0.5">
                  <span>{crowding.availableCapacity} / {crowding.totalCapacity} available</span>
                  <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    {crowding.scannedCount} QR Check-ins Today
                  </span>
                </div>
              </div>

              {/* Primary Call to Action */}
              {isFullyBooked ? (
                <div className="space-y-3">
                  <div className="rounded-2xl p-4 text-center border border-soot/12 bg-plaster-dark/30">
                    <div className="w-9 h-9 rounded-full bg-soot/10 flex items-center justify-center mx-auto mb-2">
                      <Bell size={16} className="text-soot" />
                    </div>
                    <div className="text-soot font-semibold text-xs mb-0.5">
                      Currently at Maximum Capacity
                    </div>
                    <div className="text-moss text-[11px]">
                      Join the priority waitlist to secure the next available desk
                    </div>
                  </div>

                  {inWaitlist ? (
                    <div className="bg-eucalyptus/25 border border-eucalyptus/35 rounded-2xl p-4 text-center space-y-2">
                      <div className="text-soot font-semibold text-xs flex items-center justify-center gap-2">
                        <Check size={14} className="text-soot stroke-[2.5]" />
                        <span>You are on the priority waitlist</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => leaveWaitlist(space.id)}
                        className="text-[11px] text-moss hover:text-red-700 font-medium underline transition-colors cursor-pointer"
                      >
                        Leave Waitlist
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
                      <span>Join Priority Waitlist</span>
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
                    <span>{currentUser ? (currentPlanInfo.effectivePrice === 0 ? 'Reserve Workspace (Covered by Pass)' : `Proceed to Reservation (SAR ${currentPlanInfo.effectivePrice.toLocaleString()})`) : 'Sign in to Reserve'}</span>
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
                      <span>{currentPlanInfo.effectivePrice === 0 ? 'Add to Cart (Covered by Pass)' : 'Add Pass to Cart'}</span>
                    </button>
                  )}
                </div>
              )}

              {!currentUser && (
                <p className="text-center text-xs text-moss mt-4 pt-3.5 border-t border-soot/10">
                  New to the network?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('signup')}
                    className="text-soot font-bold hover:underline cursor-pointer"
                  >
                    Create account
                  </button>
                </p>
              )}

              <div className="mt-5 pt-4 border-t border-soot/10 flex items-center justify-center gap-2 text-[11px] text-moss">
                <ShieldCheck size={13} className="text-eucalyptus shrink-0" />
                <span>Verified by Coworking Pass Saudi Network</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Modal */}
      <Modal
        open={waitlistModal}
        onClose={() => setWaitlistModal(false)}
        title="Priority Waitlist"
        size="md"
      >
        <div className="p-6 text-soot">
          {waitlistDone ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-eucalyptus/25 flex items-center justify-center mx-auto mb-4">
                <Check size={26} className="text-soot stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-normal font-serif-display text-soot mb-1.5">You’re in line</h3>
              <p className="text-xs sm:text-sm text-moss leading-relaxed max-w-xs mx-auto mb-6">
                We’ll send an instant notification as soon as a desk opens up at {space.name}.
              </p>
              <button
                type="button"
                onClick={() => setWaitlistModal(false)}
                className="w-full py-3 rounded-xl bg-soot text-plaster text-xs sm:text-sm font-semibold hover:bg-moss transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-plaster-dark/30 border border-soot/12">
                <img
                  src={space.images?.[0] ? space.images[0] : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
                  alt={space.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <div className="font-semibold text-soot text-xs sm:text-sm">{space.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-moss mt-0.5">
                    <MapPin size={10} />
                    <span>{space.city}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-plaster-surface border border-soot/12">
                  <div className="text-[11px] text-moss mb-0.5">Queue Status</div>
                  <div className="text-lg font-semibold text-soot">Position #3</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-plaster-surface border border-soot/12">
                  <div className="text-[11px] text-moss mb-0.5">Est. Notification</div>
                  <div className="text-lg font-semibold text-soot">~25 mins</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                  Preferred Date
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
                  Alert Channels
                </label>
                <div className="flex flex-wrap gap-4 text-xs text-soot">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={e => setSmsAlerts(e.target.checked)}
                      className="accent-soot"
                    />
                    <span>SMS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={e => setEmailAlerts(e.target.checked)}
                      className="accent-soot"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappAlerts}
                      onChange={e => setWhatsappAlerts(e.target.checked)}
                      className="accent-soot"
                    />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-plaster-dark/30 border border-soot/12 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-soot">
                    <Sparkles size={15} className="text-moss" />
                    <span>Enable Instant Auto-Booking</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (autoBookOn) {
                        disableAutoBooking(space.id);
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
                        autoBookOn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-moss leading-relaxed">
                  Automatically reserve and charge your default card as soon as a desk opens up.
                </p>
              </div>

              <button
                type="button"
                onClick={handleJoinWaitlist}
                className="w-full py-3.5 rounded-xl bg-soot text-plaster font-semibold text-xs sm:text-sm hover:bg-moss transition-all cursor-pointer shadow-md mt-2"
              >
                Confirm Waitlist Registration
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
