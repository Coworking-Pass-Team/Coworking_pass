'use client';
import { useI18n } from '@/i18n';
import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  MapPin,
  Star,
  Clock,
  ArrowRight,
  Bookmark,
  Check,
  Users,
  Building2,
  Sparkles,
  Presentation,
  Clapperboard,
  QrCode,
  Search,
  TrendingUp,
  Briefcase,
  Wallet,
  Coins,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import BookingQrModal from '@/components/BookingQrModal';
import SharedWalletModal from '@/components/ui/SharedWalletModal';
import {
  Space,
  getEffectiveSpacePrice,
  Booking,
  getHourlyPriceForDuration,
  Employee,
  getBookingPrice,
  getSpaceCategory,
  isHourlyAllowed,
  SpaceCategory,
  calculateDailyDurationDays
} from '@/types/types';

const FALLBACK_SPACE_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';

export default function OrgDashboard() {
  const { t, lang, localizeTime } = useI18n();
  const st = useSpaceText();
  const { currentUser, spaces, bookings, favorites, navigate, companyWalletBalance, companyData, subscriptionsApi, fetchSubscriptions } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'all' | SpaceCategory>('all');
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<Booking | null>(null);
  const [isSharedWalletOpen, setIsSharedWalletOpen] = useState(false);

  // Load the latest subscriptions so the pass card reflects the database
  useEffect(() => {
    if (currentUser && fetchSubscriptions) fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const orgBookings = bookings.filter((b: Booking) => b.userId === currentUser.id);
  const totalDaysBooked = orgBookings
    .filter((b: Booking) => b.status !== 'cancelled')
    .reduce((sum: number, b: Booking) => {
      if (b.durationDays) return sum + b.durationDays;
      if (b.startDate && b.endDate)
        return sum + calculateDailyDurationDays(b.startDate, b.endDate);
      return sum + 1;
    }, 0);
  const activeBookings = orgBookings.filter((b: Booking) => b.status === 'active');
  const favoriteSpaces = spaces.filter((s: Space) =>
    (favorites.includes(s.id) || (s.name && favorites.includes(s.name))) && s.isVisible !== false
  );
  const visibleSpaces = spaces.filter((s: Space) => s.isVisible !== false);
  const employees = currentUser.employees || [];

  const categoryFilteredSpaces = selectedCategory === 'all'
    ? visibleSpaces
    : visibleSpaces.filter(s => getSpaceCategory(s) === selectedCategory);

  const getEmpName = (id: string) => employees.find((e: Employee) => e.id === id)?.name || id;

  // --- Pass details & quota usage ---
  const activeSubscription = (subscriptionsApi || [])
    .filter((sub) => sub.userId === currentUser.id && sub.status === 'ACTIVE')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
  const hasPass = Boolean(activeSubscription || currentUser.hasActivePass);
  const passPlanName = activeSubscription?.plan?.planName || currentUser.membershipTier || (hasPass ? t('dash.org.corporateFallback') : t('dash.org.noPassPlan'));
  const tierKey = passPlanName.toLowerCase();
  const isBusinessPlan = tierKey.includes('business');
  const isUnlimitedHours = isBusinessPlan || tierKey.includes('enterprise');
  const totalHours = currentUser.totalPlanHours || (tierKey.includes('team') ? 10 : 0);
  const remainingHours = Math.max(0, typeof currentUser.remainingHours === 'number' ? currentUser.remainingHours : totalHours);
  const usedHours = Math.max(0, totalHours - remainingHours);
  const tierSeatAllocation = tierKey.includes('team') ? 20 : isBusinessPlan ? 50 : 0;
  const totalSeats = companyData?.totalPassesAllocated || tierSeatAllocation || currentUser.orgSize || 0;
  const usedSeats = Math.min(employees.length, totalSeats || employees.length);
  const passRenewalDate = activeSubscription?.endDate
    ? new Date(activeSubscription.endDate)
    : (currentUser.planCycleStart || currentUser.passPurchaseDate)
      ? new Date(new Date(currentUser.planCycleStart || currentUser.passPurchaseDate as string).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
  const daysToRenewal = passRenewalDate ? Math.ceil((passRenewalDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;

  const orgTierName = currentUser.membershipTier || (currentUser.hasActivePass ? t('dash.org.corporateFallback') : t('dash.org.corporatePlan'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold tracking-wider uppercase text-moss block">
              {t('dash.org.eyebrow')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2E8E4] border border-[#2D3536]/15 text-soot text-xs font-semibold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{orgTierName}</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            {currentUser.orgName || t('dash.org.orgDashboardTitle')}
          </h1>
          <p className="text-moss text-sm mt-1">
            Welcome, <span className="text-soot font-medium">{currentUser.name}</span> (HR Admin) · {currentUser.industry || 'Enterprise Solutions'} · {employees.length || currentUser.orgSize || 15} team members on pass
          </p>
        </div>

        {/* Corporate Shared Wallet Card */}
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-4 sm:p-5 shadow-xs flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-[#DDE6DF] border border-soot/10 flex items-center justify-center text-soot shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Wallet size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-moss">{t('sharedWallet.title')}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#DDE6DF] text-soot border border-soot/10">
                {t('dash.org.sharedPool')}
              </span>
            </div>
            <div className="text-2xl font-serif-display font-normal text-soot tracking-tight">
              {t('common.sar')} {(companyWalletBalance ?? companyData?.balance ?? 0).toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSharedWalletOpen(true)}
            className="ms-2 px-3.5 py-2 rounded-xl bg-soot hover:bg-soot-light text-plaster text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>{t('dash.org.topUp')}</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Pass Details & Quota Usage */}
      <div className="bg-white rounded-3xl border border-soot/10 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">{t('dash.org.passDetails')}</span>
            <h2 className="text-xl sm:text-2xl text-soot font-serif-display font-normal">{passPlanName}</h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            hasPass ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasPass ? 'bg-emerald-600' : 'bg-amber-500'}`} />
            {hasPass ? t('dash.org.active') : t('dash.org.inactive')}
          </span>
        </div>

        {hasPass ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Meeting room / theater hours */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-moss mb-1.5">{t('dash.org.hours')}</div>
              {isUnlimitedHours ? (
                <div className="text-lg font-semibold text-soot">{t('dash.org.unlimited')}</div>
              ) : (
                <>
                  <div className="text-lg font-semibold text-soot">
                    {remainingHours} <span className="text-moss text-sm font-medium">{t('dash.org.of', { total: totalHours })}</span>
                  </div>
                  <div className="h-2 bg-soot/8 rounded-full mt-2">
                    <div
                      className="h-full bg-eucalyptus rounded-full"
                      style={{ width: `${totalHours > 0 ? Math.min(100, (usedHours / totalHours) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-moss mt-1">{t('dash.org.usedCycle', { count: usedHours })}</div>
                </>
              )}
            </div>

            {/* Renewal */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-moss mb-1.5">{t('dash.org.renewal')}</div>
              <div className="text-lg font-semibold text-soot">
                {passRenewalDate ? passRenewalDate.toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
              {daysToRenewal !== null && (
                <div className={`text-[11px] mt-1 ${daysToRenewal <= 7 ? 'text-amber-700 font-semibold' : 'text-moss'}`}>
                  {daysToRenewal > 0 ? t(daysToRenewal === 1 ? 'dash.org.daysRemaining' : 'dash.org.daysRemainingMany', { count: daysToRenewal }) : t('dash.org.renewalDue')}
                </div>
              )}
            </div>

            {/* Seats */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-moss mb-1.5">{t('dash.org.seatAllocation')}</div>
              <div className="text-lg font-semibold text-soot">
                {usedSeats} <span className="text-moss text-sm font-medium">{t('dash.org.seatsUsed', { total: totalSeats || '—' })}</span>
              </div>
              <div className="h-2 bg-soot/8 rounded-full mt-2">
                <div
                  className="h-full bg-soot rounded-full"
                  style={{ width: `${totalSeats > 0 ? Math.min(100, (usedSeats / totalSeats) * 100) : 0}%` }}
                />
              </div>
              <div className="text-[11px] text-moss mt-1">{totalSeats > 0 ? t('dash.org.seatsAvailable', { count: Math.max(0, totalSeats - usedSeats) }) : t('dash.org.noSeatAllocation')}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-moss">{t('dash.org.noPass')}</p>
            <button
              type="button"
              onClick={() => navigate('pricing')}
              className="px-4 py-2.5 rounded-xl bg-soot text-plaster text-xs font-semibold hover:bg-moss cursor-pointer"
            >
              {t('dash.org.viewPlans')}
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: t('dash.activeBookings'),
            count: activeBookings.length,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: CalendarDays,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: t('dash.totalBookings'),
            count: orgBookings.length,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Bookmark,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: t('footer.teamMembers'),
            count: employees.length || 1,
            badge: 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
            icon: Users,
            iconBg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          },
          {
            label: t('dash.daysBooked'),
            count: totalDaysBooked,
            badge: 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
            icon: Clock,
            iconBg: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
          },
          {
            label: t('dash.loyaltyPoints'),
            count: currentUser.loyaltyPoints || 0,
            badge: 'bg-amber-500/20 text-amber-900 border border-amber-500/40',
            icon: Sparkles,
            iconBg: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={() => stat.label === t('dash.loyaltyPoints') ? navigate('loyalty') : undefined}
            className={`bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group ${stat.label === t('dash.loyaltyPoints') ? 'cursor-pointer hover:border-amber-500/40' : ''}`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${stat.iconBg}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-3xl font-normal text-soot tracking-tight font-serif-display">{stat.count}</div>
                <div className="text-xs font-medium text-moss mt-0.5">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Active bookings & Saved spaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Active bookings column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif-display text-soot">{t('dash.org.activeTeamBookings')}</h2>
            <button
              onClick={() => navigate('team-bookings')}
              className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{t('landing.viewAll')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 p-8 text-center shadow-2xs min-h-[200px] flex flex-col items-center justify-center">
              <CalendarDays size={32} className="text-moss mx-auto mb-3" />
              <div className="text-sm font-semibold text-soot mb-1">{t('dash.org.noTeamBookings')}</div>
              <button
                onClick={() => navigate('browse')}
                className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 transition-colors cursor-pointer mt-2"
              >
                {t('dash.org.browseWorkspacesArrow')}
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
                    <img
                      src={b.spaceImage || FALLBACK_SPACE_IMAGE}
                      alt={st.bookingName(b)}
                      className="w-12 h-12 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-soot text-sm truncate group-hover:text-emerald-900 transition-colors">{st.bookingName(b)}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5 font-medium">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{st.bookingCity(b)}</span>
                        <span>•</span>
                        <span className="truncate">{b.startDate} {b.plan === 'hourly' && b.startTime ? `(${localizeTime(b.startTime)} – ${localizeTime(b.endTime || '')})` : (b.endDate && b.endDate !== b.startDate ? `→ ${b.endDate}` : '')}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 uppercase tracking-wider">
                          {b.plan === 'hourly' ? t(b.durationHours === 1 ? 'booking.hourlyHrs' : 'booking.hourlyHrsMany', { count: b.durationHours || 1 }) : t(('booking.planPass.' + b.plan) as never)} • {t(b.seats > 1 ? 'booking.seatMany' : 'booking.seatOne', { count: b.seats })}
                        </span>
                        {b.employees && b.employees.length > 0 && (
                          <span className="text-[10px] text-moss bg-soot/5 px-2 py-0.5 rounded-full border border-soot/8 font-medium">
                            {getEmpName(b.employees[0]).split(' ')[0]} {b.employees.length > 1 ? `+${b.employees.length - 1}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-end shrink-0 flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold text-soot">{t('common.sar')} {getBookingPrice(b, spaces).toLocaleString()}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBookingForQr(b);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#2F6144] hover:bg-[#254F37] text-white text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
                    >
                      <QrCode size={12} />
                      <span>{t('booking.qrPass')}</span>
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
            <h2 className="text-xl font-serif-display text-soot">{t('dash.org.savedWorkspaces')}</h2>
            <button
              onClick={() => navigate('browse')}
              className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{t('dash.browseMore')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {favoriteSpaces.length === 0 ? (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 p-8 text-center shadow-2xs min-h-[200px] flex flex-col items-center justify-center">
              <Star size={32} className="text-moss mx-auto mb-3" />
              <div className="text-sm font-semibold text-soot mb-1">{t('dash.noSaved')}</div>
              <button
                onClick={() => navigate('browse')}
                className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 transition-colors cursor-pointer mt-2"
              >
                {t('dash.org.browseWorkspacesArrow')}
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
                    {/* حل المشكلة رقم 4 (الموضع الأول) */}
                    <img
                      src={space.images?.[0] || FALLBACK_SPACE_IMAGE}
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
                  <div className="text-end shrink-0">
                    {(() => {
                      const isHourly = isHourlyAllowed(space);
                      const targetPlan = isHourly ? 'hourly' : 'daily';
                      const planInfo = getEffectiveSpacePrice(currentUser, space, targetPlan);
                      const unitLabel = isHourly ? '/hour' : '/day';
                      const displayPrice = isHourly
                        ? (space.pricing?.hourly ?? (space.pricing?.daily ? Math.round(space.pricing.daily / 4) : 150))
                        : (space.pricing?.daily ?? 0);

                      if (planInfo.isCovered) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 font-bold text-[10px] border border-emerald-500/30 uppercase tracking-wider shadow-2xs">
                            <Check size={11} className="text-emerald-800 shrink-0" />
                            <span>{t('dash.org.corporatePass')}</span>
                          </span>
                        );
                      }
                      if (planInfo.hasDiscount) {
                        return (
                          <div>
                            <div className="text-sm font-semibold text-soot">{t('common.sar')} {planInfo.effectivePrice.toLocaleString()} {unitLabel}</div>
                            <div className="text-[10px] text-amber-800 font-bold">{planInfo.discountPercentage}% Pass Discount</div>
                          </div>
                        );
                      }
                      {/* Safe fallback for space pricing object */}
                      return <div className="text-sm font-semibold text-soot">{t('common.sar')} {displayPrice.toLocaleString()} {unitLabel}</div>;
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
              Corporate Reservation & Discovery
            </span>
            <h2 className="text-2xl font-serif-display text-soot">{t('dash.org.bookForTeam')}</h2>
          </div>
          <button
            onClick={() => navigate('browse')}
            className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{t('dash.org.openDirectory')}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: t('categories.all') },
            { id: 'office', label: t('categories.office') },
            { id: 'hall', label: t('categories.hall') },
            { id: 'theater', label: t('categories.theater') },
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
                  {/* حل المشكلة رقم 4 (الموضع الثاني) */}
                  <img
                    src={space.images?.[0] || FALLBACK_SPACE_IMAGE}
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-transparent to-transparent" />
                  
                  {/* Category & Type Badges */}
                  <div className="absolute top-3 start-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 text-soot backdrop-blur-md shadow-xs capitalize">
                      {cat}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-soot/80 text-white backdrop-blur-md shadow-xs capitalize">
                      {space.type.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="absolute bottom-3 start-3 end-3 text-white">
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
                        <span className="text-emerald-800 font-semibold">{t('dash.org.includedInPlan')}</span>
                      ) : (
                        <span>{t('common.sar')} {planInfo.originalPrice.toLocaleString()} {isHourly ? '/hour' : '/seat'}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('team-booking', { spaceId: space.id });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#DDE6DF] hover:bg-[#D0DDD3] text-soot font-semibold text-xs transition-colors shadow-2xs border border-soot/10 cursor-pointer"
                  >
                    {t('dash.org.bookForTeamBtn')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin-Matching Action Cards */}
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: t('footer.companyWorkspaces'), desc: t('dash.org.qa1'), action: () => navigate('company-workspaces'), icon: Building2 },
          { label: t('nav.browseSpaces'), desc: t('dash.org.qa2'), action: () => navigate('browse'), icon: Building2 },
          { label: t('footer.teamBookings'), desc: t('dash.org.qa3'), action: () => navigate('team-bookings'), icon: CalendarDays },
          { label: t('dash.org.manageTeam'), desc: t('dash.org.qa4'), action: () => navigate('company-team'), icon: Users },
          {
            label: t('dash.org.sharedWallet'),
            desc: t('dash.org.walletDesc', { currency: t('common.sar'), amount: (companyWalletBalance ?? companyData?.balance ?? 0).toLocaleString() }),
            action: () => setIsSharedWalletOpen(true),
            icon: Wallet
          },
        ].map(a => (
          <button
            key={a.label}
            onClick={a.action}
            className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 text-start hover:border-eucalyptus/40 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-soot text-plaster flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform">
              <a.icon size={20} />
            </div>
            <div className="font-semibold text-soot text-base">{a.label}</div>
            <div className="text-xs text-moss mt-1 font-medium">{a.desc}</div>
          </button>
        ))}
      </div>

      {/* Corporate Shared Wallet Modal */}
      <SharedWalletModal
        isOpen={isSharedWalletOpen}
        onClose={() => setIsSharedWalletOpen(false)}
      />

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
