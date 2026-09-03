'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Star,
  Users,
  Clock,
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
  ArrowRight
} from 'lucide-react';
import { useApp } from '@/app/store';
import { isUserPassHolder, getEffectiveSpacePrice } from '@/types/types';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

export default function SpaceDetails() {
  const { nav, navigate, goBack, spaces, currentUser, favorites, toggleFavorite, waitlist, autobooking, joinWaitlist } = useApp();
  const passActive = isUserPassHolder(currentUser);

  const urlId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
  const spaceId = nav?.params?.spaceId || (urlId && urlId !== 'page' && urlId !== '[id]' ? urlId : '') || 'space-1';
  const space = spaces.find(s => s.id === spaceId) || spaces[0];

  const [imgIndex, setImgIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [waitlistModal, setWaitlistModal] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  useEffect(() => {
    setImgIndex(0);
  }, [spaceId]);

  if (!space) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 bg-plaster text-soot">
        <div className="w-14 h-14 rounded-2xl bg-soot/5 flex items-center justify-center mb-4">
          <Info size={24} className="text-moss" />
        </div>
        <h2 className="text-2xl font-serif-display text-soot mb-2">Space not found</h2>
        <button
          onClick={() => navigate('browse')}
          className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Browse Workspaces
        </button>
      </div>
    );
  }

  const isFav = favorites.includes(space.id);
  const isFullyBooked = space.availableCapacity === 0;
  const inWaitlist = waitlist[space.id];
  const autoBookOn = autobooking[space.id];

  const handleBook = () => {
    if (!currentUser) { navigate('login'); return; }
    if (currentUser.role === 'organization') {
      navigate('team-booking', { spaceId: space.id, plan: selectedPlan });
    } else {
      navigate('booking-flow', { spaceId: space.id, plan: selectedPlan });
    }
  };

  const handleJoinWaitlist = () => {
    joinWaitlist(space.id);
    setWaitlistDone(true);
  };

  const availabilityInfo = isFullyBooked
    ? { label: 'Fully Booked', color: 'text-red-700 bg-red-500/10 border-red-500/20' }
    : space.availableCapacity <= 5
    ? { label: `${space.availableCapacity} spots left`, color: 'text-amber-800 bg-amber-500/15 border-amber-500/25' }
    : { label: `${space.availableCapacity} spots available`, color: 'text-soot bg-eucalyptus/25 border-eucalyptus/30' };

  const planPrice = space.pricing[selectedPlan];
  const planLabel = selectedPlan === 'daily' ? '/day' : selectedPlan === 'monthly' ? '/month' : '/year';

  const hoursDisplay = (space as any).openHours || (space as any).hours || 'Sun–Thu: 8am–10pm | Fri: 2pm–10pm';
  const phoneDisplay = space.phone || '+966 11 234 5678';
  const emailDisplay = space.email || 'info@coworkingpass.sa';

  return (
    <div className="min-h-screen bg-plaster text-soot py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb / Back */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-moss hover:text-soot transition-colors duration-200 cursor-pointer group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
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
                {space.amenities.map(a => (
                  <div
                    key={a}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-plaster-surface border border-soot/12 text-xs font-medium text-soot shadow-xs"
                  >
                    <Check size={13} className="text-eucalyptus stroke-[2.5]" />
                    <span>{a}</span>
                  </div>
                ))}
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
                {(() => {
                  const currentPlanInfo = getEffectiveSpacePrice(currentUser, space, selectedPlan);
                  return (
                    <>
                      <span className="text-xs font-semibold uppercase tracking-wider text-moss block mb-1.5">
                        {currentPlanInfo.isCovered ? 'Pass Access' : currentPlanInfo.hasDiscount ? 'Plan Upgrade Rate' : 'Membership Rate'}
                      </span>
                      {currentPlanInfo.isCovered ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-semibold text-soot tracking-tight">
                              SAR 0
                            </span>
                            <span className="text-xs font-medium text-moss">with pass</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-eucalyptus/30 text-soot font-semibold text-xs border border-eucalyptus/40 shadow-2xs">
                            <Check size={13} className="text-moss shrink-0" />
                            <span>Included in Pass</span>
                          </div>
                        </div>
                      ) : currentPlanInfo.hasDiscount ? (
                        <div className="space-y-1.5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-semibold text-soot tracking-tight">
                              SAR {currentPlanInfo.effectivePrice.toLocaleString()}
                            </span>
                            <span className="text-sm font-medium text-moss">{planLabel}</span>
                            <span className="line-through text-xs text-moss/50">SAR {planPrice.toLocaleString()}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 font-semibold text-xs border border-amber-500/30">
                            <span>{currentPlanInfo.discountPercentage}% Pass Discount</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-semibold text-soot tracking-tight">
                            SAR {planPrice.toLocaleString()}
                          </span>
                          <span className="text-sm font-medium text-moss">{planLabel}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Plan Choice Selectors */}
              <div className="mb-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-moss mb-2.5 block">
                  Select Billing Cycle
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'monthly', 'yearly'] as const).map(plan => {
                    const isSelected = selectedPlan === plan;
                    const planP = getEffectiveSpacePrice(currentUser, space, plan);
                    return (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`py-2.5 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-eucalyptus text-soot border-eucalyptus/80 shadow-xs font-semibold'
                            : 'bg-plaster-dark/30 border-soot/10 text-moss hover:text-soot hover:bg-plaster-dark/60'
                        }`}
                      >
                        <div className="capitalize text-xs font-semibold">{plan}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-soot/80 font-medium' : 'text-moss/70'}`}>
                          {planP.isCovered ? 'Included' : `SAR ${planP.effectivePrice.toLocaleString()}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedPlan === 'yearly' && !passActive && (
                  <div className="mt-2.5 text-[11px] text-moss bg-eucalyptus/20 border border-eucalyptus/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-soot shrink-0" />
                    <span>Save {Math.round((1 - space.pricing.yearly / (space.pricing.monthly * 12)) * 100)}% with annual commitment</span>
                  </div>
                )}
              </div>

              {/* Capacity Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-moss mb-1.5 font-medium">
                  <span>Capacity Status</span>
                  <span className="text-soot font-semibold">{space.availableCapacity} of {space.totalCapacity} open</span>
                </div>
                <div className="h-2 bg-soot/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isFullyBooked ? 'bg-red-500' : space.availableCapacity <= 5 ? 'bg-amber-500' : 'bg-eucalyptus'
                    }`}
                    style={{ width: `${(space.availableCapacity / space.totalCapacity) * 100}%` }}
                  />
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
                    <div className="bg-eucalyptus/25 border border-eucalyptus/35 rounded-xl p-3 text-center">
                      <div className="text-soot font-medium text-xs flex items-center justify-center gap-2">
                        <Check size={14} className="text-soot stroke-[2.5]" />
                        <span>You are on the priority waitlist</span>
                      </div>
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
                <button
                  type="button"
                  onClick={handleBook}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-soot text-plaster hover:bg-moss active:scale-[0.99] transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-eucalyptus"
                >
                  <span>{currentUser ? 'Proceed to Reservation' : 'Sign in to Reserve'}</span>
                  <ArrowRight size={16} />
                </button>
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

              <div className="flex items-start gap-2 p-3 rounded-xl bg-plaster-dark/30 border border-soot/10">
                <Info size={14} className="text-moss mt-0.5 shrink-0" />
                <p className="text-[11px] text-moss leading-relaxed">
                  You’ll have a 10-minute window to confirm your booking after being alerted before the desk is passed to the next member.
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
