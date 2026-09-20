'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  MapPin,
  Search,
  Star,
  Clock,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Sparkles,
  QrCode
} from 'lucide-react';
import { useApp } from '@/app/store';
import BookingQrModal from '@/components/BookingQrModal';
import {
  Space,
  Booking,
  SpaceCategory,
  BookingPlan,
  getEffectiveSpacePrice,
  getBookingPrice,
  getSpaceCategory
} from '@/types/types';

export default function IndividualDashboard() {
  const { currentUser, bookings, spaces, navigate, favorites } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'all' | SpaceCategory>('all');
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<Booking | null>(null);

  if (!currentUser) return null;

  const myBookings = bookings.filter(b => b.userId === currentUser.id);
  const activeBookings = myBookings.filter(b => b.status === 'active');
  const favoriteSpaces = spaces.filter(s => favorites.includes(s.id) && s.isVisible);
  const visibleSpaces = spaces.filter(s => s.isVisible);

  const categoryFilteredSpaces = selectedCategory === 'all'
    ? visibleSpaces
    : visibleSpaces.filter(s => getSpaceCategory(s) === selectedCategory);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const tierName = currentUser.membershipTier || (currentUser.hasActivePass ? 'All-Access Pass' : 'Standard Member');
  const tierLower = tierName.toLowerCase();

  const userPassPlan: BookingPlan = tierLower.includes('yearly') || tierLower.includes('annual') || tierLower.includes('enterprise') || tierLower.includes('all-access')
    ? 'yearly'
    : tierLower.includes('monthly') || tierLower.includes('pro')
    ? 'monthly'
    : 'daily';

  const hasPass = Boolean(currentUser.hasActivePass);
  const totalPlanHours = currentUser.totalPlanHours !== undefined
    ? currentUser.totalPlanHours
    : (userPassPlan === 'yearly' ? 12 : userPassPlan === 'monthly' ? 8 : 0);
  const remainingHours = currentUser.remainingHours !== undefined
    ? currentUser.remainingHours
    : totalPlanHours;

  const cycleStartDate = currentUser.planCycleStart ? new Date(currentUser.planCycleStart) : new Date();
  const nextRenewalDate = new Date(cycleStartDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold tracking-wider uppercase text-moss block">
              Personal Workspace Portal
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2E8E4] border border-[#2D3536]/15 text-soot text-xs font-semibold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{tierName}</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            {greeting()}, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-moss text-sm mt-1">Welcome back to your Coworking Pass dashboard.</p>
        </div>
      </div>

      {/* Stats Cards Matching Organization Dashboard */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${hasPass ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
        {[
          {
            label: 'Active Bookings',
            count: activeBookings.length,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: CalendarDays,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          ...(hasPass ? [{
            label: 'Remaining Hours',
            count: `${remainingHours} hrs`,
            sublabel: `${remainingHours} / ${totalPlanHours} hrs · Renews Monthly`,
            badge: 'bg-emerald-800/15 text-emerald-900 border border-emerald-800/30',
            icon: Clock,
            iconBg: 'bg-emerald-800 text-white border-emerald-900/30',
          }] : []),
          {
            label: 'Total Reservations',
            count: myBookings.length,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Bookmark,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Saved Spaces',
            count: favorites.length,
            badge: 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
            icon: Star,
            iconBg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          },
          {
            label: 'Days Booked',
            count: myBookings.filter(b => b.status !== 'cancelled').length * 3,
            badge: 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
            icon: Clock,
            iconBg: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
          },
          {
            label: 'Loyalty Points',
            count: currentUser.loyaltyPoints || 0,
            badge: 'bg-amber-500/20 text-amber-900 border border-amber-500/40',
            icon: Sparkles,
            iconBg: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={() => stat.label === 'Loyalty Points' ? navigate('loyalty') : undefined}
            className={`bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group ${stat.label === 'Loyalty Points' ? 'cursor-pointer hover:border-amber-500/40' : ''}`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${stat.iconBg}`}>
                <stat.icon size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-normal text-soot tracking-tight font-serif-display truncate">{stat.count}</div>
                <div className="text-xs font-medium text-moss mt-0.5 truncate">{stat.label}</div>
                {(stat as any).sublabel && (
                  <div className="text-[10px] font-semibold text-emerald-800 mt-1 truncate">{(stat as any).sublabel}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dedicated Remaining Hours & Pass Benefits Card */}
      {hasPass && totalPlanHours > 0 && (
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-soot/8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-300">
                  <CheckCircle2 size={13} className="text-emerald-700" />
                  <span>Pass Benefit Active</span>
                </span>
                <span className="text-xs font-semibold text-moss">· Renews Monthly</span>
              </div>
              <h2 className="text-2xl font-serif-display text-soot">
                Remaining Hours: <span className="text-emerald-900 font-bold">{remainingHours}</span> / {totalPlanHours} hrs
              </h2>
              <p className="text-xs text-moss">
                Monthly quota for meeting rooms & theaters included with your {tierName}. Automatically deducts upon reservation and renews every 30 days.
              </p>
            </div>

            <div className="flex items-center gap-3 sm:text-right shrink-0 flex-wrap">
              <div>
                <span className="text-[11px] font-semibold text-moss uppercase tracking-wider block">Next Monthly Renewal</span>
                <span className="text-sm font-bold text-soot">{nextRenewalDate}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('pricing')}
                className="py-2.5 px-3.5 text-xs rounded-xl border border-soot/20 text-soot hover:bg-soot/5 font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Manage Pass
              </button>
              <button
                type="button"
                onClick={() => navigate('browse')}
                className="btn-primary py-2.5 px-4 text-xs shadow-xs cursor-pointer"
              >
                <span>Book Space</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Quota Usage Bar */}
          <div className="mt-4 pt-1 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-moss">Monthly Allowance Usage</span>
              <span className="text-soot">{remainingHours} hrs remaining ({totalPlanHours - remainingHours} hrs used)</span>
            </div>
            <div className="w-full bg-soot/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (remainingHours / totalPlanHours) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Active bookings & Saved spaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Active bookings column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif-display text-soot">Active Bookings</h2>
            <button
              onClick={() => navigate('my-bookings')}
              className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 p-8 text-center shadow-2xs min-h-[200px] flex flex-col items-center justify-center">
              <CalendarDays size={32} className="text-moss mx-auto mb-3" />
              <div className="text-sm font-semibold text-soot mb-1">No active bookings</div>
              <button
                onClick={() => navigate('browse')}
                className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 transition-colors cursor-pointer mt-2"
              >
                Browse spaces →
              </button>
            </div>
          ) : (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs divide-y divide-soot/8">
              {activeBookings.slice(0, 3).map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBookingForQr(b)}
                  className="p-4 hover:bg-plaster-dark/30 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img src={b.spaceImage} alt={b.spaceName} className="w-12 h-12 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform" />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-soot text-sm truncate group-hover:text-emerald-900 transition-colors">{b.spaceName}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5 font-medium">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{b.spaceCity}</span>
                        <span>•</span>
                        <span className="truncate">{b.startDate} {b.plan === 'hourly' && b.startTime ? `(${b.startTime} – ${b.endTime || ''})` : (b.endDate && b.endDate !== b.startDate ? `→ ${b.endDate}` : '')}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 uppercase tracking-wider">
                          {b.plan === 'hourly' ? `Hourly (${b.durationHours || 1} ${b.durationHours === 1 ? 'hr' : 'hrs'})` : `${b.plan} pass`} • {b.seats} seat{b.seats > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold text-soot">
                      {(() => {
                        const price = getBookingPrice(b, spaces);
                        const isHourly = b.plan === 'hourly' || Boolean(b.durationHours);
                        const isPassCovered = b.paidWithPass || price === 0 || b.totalPrice === 0;

                        if (isPassCovered) {
                          return (
                            <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                              <Clock size={11} className="text-emerald-700" />
                              <span>{isHourly ? `${b.durationHours || 1} hrs (Pass)` : 'Included'}</span>
                            </span>
                          );
                        }
                        if (b.coveredHours && b.coveredHours > 0) {
                          return (
                            <div className="text-right">
                              <div className="font-semibold text-soot text-xs">SAR {price.toLocaleString()}</div>
                              <div className="text-[10px] text-emerald-800 font-medium">{b.coveredHours}h Pass</div>
                            </div>
                          );
                        }
                        return `SAR ${price.toLocaleString()}`;
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBookingForQr(b);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#2F6144] hover:bg-[#254F37] text-white text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
                    >
                      <QrCode size={12} />
                      <span>QR Pass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved spaces column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif-display text-soot">Saved Spaces</h2>
            <button
              onClick={() => navigate('browse')}
              className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Browse more</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {favoriteSpaces.length === 0 ? (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 p-8 text-center shadow-2xs min-h-[200px] flex flex-col items-center justify-center">
              <Star size={32} className="text-moss mx-auto mb-3" />
              <div className="text-sm font-semibold text-soot mb-1">No saved spaces yet</div>
              <button
                onClick={() => navigate('browse')}
                className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 transition-colors cursor-pointer mt-2"
              >
                Browse spaces →
              </button>
            </div>
          ) : (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs divide-y divide-soot/8">
              {favoriteSpaces.map(space => (
                <div
                  key={space.id}
                  onClick={() => navigate('space-details', { spaceId: space.id })}
                  className="p-4 hover:bg-plaster-dark/30 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={space.images[0]}
                      alt={space.name}
                      className="w-12 h-12 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-soot text-sm truncate group-hover:text-emerald-900 transition-colors">{space.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5 font-medium">
                        <MapPin size={12} className="shrink-0" />
                        <span>{space.city}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-moss mt-1 font-medium">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{space.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {(() => {
                      const planInfo = getEffectiveSpacePrice(currentUser, space, userPassPlan);
                      if (planInfo.isCovered) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 font-bold text-[10px] border border-emerald-500/30 uppercase tracking-wider shadow-2xs">
                            <Check size={11} className="text-emerald-800 shrink-0" />
                            <span>Included in Pass</span>
                          </span>
                        );
                      }
                      if (planInfo.hasDiscount) {
                        return (
                          <div>
                            <div className="text-sm font-semibold text-soot">SAR {planInfo.effectivePrice}/day</div>
                            <div className="text-[10px] text-amber-800 font-bold">{planInfo.discountPercentage}% Pass Discount</div>
                          </div>
                        );
                      }
                      return <div className="text-sm font-semibold text-soot">SAR {space.pricing.daily}/day</div>;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explore Spaces by Type Section */}
      <div className="space-y-4 pt-4 border-t border-soot/8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
              Discovery & Booking
            </span>
            <h2 className="text-2xl font-serif-display text-soot">Explore Spaces by Category</h2>
          </div>
          <button
            onClick={() => navigate('browse')}
            className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Open full catalog</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Spaces' },
            { id: 'office', label: 'Offices' },
            { id: 'hall', label: 'Halls' },
            { id: 'theater', label: 'Theaters' },
          ].map(cat => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all'
              ? visibleSpaces.length
              : visibleSpaces.filter(s => getSpaceCategory(s) === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-soot text-plaster shadow-xs'
                    : 'bg-plaster-surface border border-soot/10 text-moss hover:text-soot hover:border-soot/25'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-plaster/20 text-plaster' : 'bg-plaster-dark/60 text-soot'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid of Categorized Spaces */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {categoryFilteredSpaces.slice(0, 6).map(space => {
            const cat = getSpaceCategory(space);
            const planInfo = getEffectiveSpacePrice(currentUser, space, cat === 'office' ? 'daily' : 'hourly');
            const isHourly = cat === 'hall' || cat === 'theater';
            return (
              <div
                key={space.id}
                onClick={() => navigate('space-details', { spaceId: space.id })}
                className="bg-plaster-surface hover:bg-plaster-dark/30 rounded-3xl border border-soot/12 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={space.images[0]}
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-transparent to-transparent" />
                  
                  {/* Category & Type Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 text-soot backdrop-blur-md shadow-xs capitalize">
                      {cat}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-soot/80 text-white backdrop-blur-md shadow-xs capitalize">
                      {space.type.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-semibold text-base truncate font-serif-display">{space.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-plaster/90 mt-0.5">
                      <MapPin size={11} className="text-eucalyptus shrink-0" />
                      <span className="truncate">{space.city} • {space.address}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between gap-3 border-t border-soot/6">
                  <div>
                    <div className="text-xs text-moss">
                      {isHourly ? 'Hourly Rate' : 'Daily Pass'}
                    </div>
                    <div className="font-bold text-soot text-sm">
                      {planInfo.isCovered ? (
                        <span className="text-emerald-800 font-semibold">Included in Pass</span>
                      ) : (
                        <span>SAR {planInfo.originalPrice.toLocaleString()} {isHourly ? '/h' : '/day'}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('booking-flow', { spaceId: space.id });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#DDE6DF] hover:bg-[#D0DDD3] text-soot font-semibold text-xs transition-colors shadow-2xs border border-soot/10 cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access Entry QR Code Pass Modal */}
      {selectedBookingForQr && (
        <BookingQrModal
          booking={selectedBookingForQr}
          onClose={() => setSelectedBookingForQr(null)}
        />
      )}
    </div>
  );
}
