'use client';

import { useI18n } from '@/i18n';
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  Search,
  CalendarDays,
  Clock,
  Ban,
  DollarSign,
  Eye,
  CreditCard,
  Building2,
  Zap,
  Wallet,
  QrCode,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import { Booking, BookingStatus, getHourlyPriceForDuration, getBookingPrice, isCancellationRefundEligible, calculateDailyDurationDays } from '@/types/types';
import Modal from '@/components/ui/Modal';
import BookingQrModal from '@/components/BookingQrModal';
import { deleteDirectBookingApi, getHourlyBookingsApi, updateHourlyBookingApi, HourlyBookingItemApi } from '@/services/authApi';

const FALLBACK_SPACE_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';

export default function MyBookings() {
  const { t, formatDate, localizeTime } = useI18n();
  const st = useSpaceText();
  const { bookings, spaces, currentUser, navigate, cancelBooking, nav, showToast, fetchDirectBookings } = useApp();
  const [bookingCategory, setBookingCategory] = useState<'direct' | 'hourly'>('direct');
  const [hourlyBookings, setHourlyBookings] = useState<HourlyBookingItemApi[]>([]);
  const [loadingHourly, setLoadingHourly] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingStatus>((nav.params?.tab as BookingStatus) || 'active');
  const [query, setQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModal, setCancelModal] = useState<Booking | null>(null);
  const [refundMethod, setRefundMethod] = useState<'wallet' | 'card'>('wallet');

  useEffect(() => {
    if (fetchDirectBookings) {
      fetchDirectBookings().catch(() => {});
    }
  }, [fetchDirectBookings]);

  useEffect(() => {
    if (bookingCategory === 'hourly') {
      setLoadingHourly(true);
      getHourlyBookingsApi().then(res => {
        if (res.success && res.data) {
          const storedUserId = typeof window !== 'undefined' ? (localStorage.getItem('cp_userId') || currentUser?.id) : currentUser?.id;
          const userHourly = res.data.filter(hb => hb.userId === storedUserId || hb.userId === currentUser?.id || !hb.userId);
          setHourlyBookings(userHourly.length > 0 ? userHourly : res.data);
        }
        setLoadingHourly(false);
      });
    }
  }, [bookingCategory, currentUser]);

  if (!currentUser) return null;

  const myBookings = bookings.filter(b => b.userId === currentUser.id || (currentUser.email && b.userId.toLowerCase() === currentUser.email.toLowerCase()));

  const filtered = myBookings
    .filter(b => {
      const q = query.trim().toLowerCase();
      if (q && !b.spaceName.toLowerCase().includes(q) && !b.spaceCity.toLowerCase().includes(q)) {
        return false;
      }
      if (activeTab && b.status !== activeTab) return false;
      return true;
    })
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  const activeCount = myBookings.filter(b => b.status === 'active').length;
  const previousCount = myBookings.filter(b => b.status === 'previous').length;
  const cancelledCount = myBookings.filter(b => b.status === 'cancelled').length;

  const totalSpend = myBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + getBookingPrice(b, spaces), 0);

  const handleCancelConfirm = () => {
    if (!cancelModal) return;
    const bookingToCancel = cancelModal;
    cancelBooking(bookingToCancel.id, refundMethod);
    deleteDirectBookingApi(bookingToCancel.id).catch((err: any) =>
      console.warn('[Direct Booking DELETE Sync]', err)
    );
    setCancelModal(null);
    if (selectedBooking && selectedBooking.id === bookingToCancel.id) {
      setSelectedBooking(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            {t('myBookings.eyebrow')}
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            {t('myBookings.title')}
          </h1>
          <p className="text-moss text-sm mt-1">{t('myBookings.subtitle')}</p>
        </div>

        {/* Category Switcher */}
        <div className="inline-flex p-1 rounded-2xl bg-white border border-soot/12 shadow-2xs">
          <button
            type="button"
            onClick={() => setBookingCategory('direct')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              bookingCategory === 'direct'
                ? 'bg-soot text-plaster shadow-xs'
                : 'text-moss hover:text-soot'
            }`}
          >
            <CalendarDays size={15} />
            <span>Pass &amp; Direct Bookings</span>
          </button>

          <button
            type="button"
            onClick={() => setBookingCategory('hourly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              bookingCategory === 'hourly'
                ? 'bg-soot text-plaster shadow-xs'
                : 'text-moss hover:text-soot'
            }`}
          >
            <Clock size={15} />
            <span>{t('myBookings.hourlyBookings')}</span>
          </button>
        </div>
      </div>

      {bookingCategory === 'hourly' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-xl font-normal font-serif-display text-soot">{t('myBookings.hourlyPackages')}</h3>
              <p className="text-xs text-moss mt-0.5">Your hourly meeting room &amp; desk packages booked across Saudi Arabia.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoadingHourly(true);
                getHourlyBookingsApi().then(res => {
                  if (res.success && res.data) setHourlyBookings(res.data);
                  setLoadingHourly(false);
                });
              }}
              className="p-2 rounded-xl border border-soot/12 text-moss hover:text-soot cursor-pointer"
            >
              <Clock size={16} className={loadingHourly ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingHourly ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-soot/8 text-moss text-xs">
              {t('myBookings.loadingHourly')}
            </div>
          ) : hourlyBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-soot/8 text-moss text-xs">
              {t('myBookings.noHourly')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hourlyBookings.map(hb => (
                <div key={hb.id} className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {t(('booking.status.' + String(hb.status).toLowerCase()) as never) === ('booking.status.' + String(hb.status).toLowerCase()) ? hb.status : t(('booking.status.' + String(hb.status).toLowerCase()) as never)}
                    </span>
                    <span className="text-xs font-mono text-moss">{hb.id.slice(0, 10)}...</span>
                  </div>
                  <h4 className="text-base font-semibold text-soot font-serif-display">
                    {hb.package?.packageName || hb.section?.name || t('myBookings.hourlyPackageFallback')}
                  </h4>
                  <div className="text-xs text-moss space-y-1 pt-2 border-t border-soot/6">
                    <div>{t('myBookings.startDate')} <span className="font-medium text-soot">{hb.startDate ? formatDate(hb.startDate) : t('myBookings.na')}</span></div>
                    <div>{t('myBookings.endDate')} <span className="font-medium text-soot">{hb.endDate ? formatDate(hb.endDate) : t('myBookings.na')}</span></div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        // حل المشكلة FE-09: ربط ديناميكي بالمساحة الأصلية لجلب المدينة والعنوان والصورة الحقيقيين
                        const targetWorkspaceId = (hb as any).workspaceId || (hb.section as any)?.workspaceId || (hb.package as any)?.workspaceId;
                        const matchedSpace = spaces.find(s => s.id === targetWorkspaceId);

                        const converted: Booking = {
                          id: hb.id,
                          userId: hb.userId || currentUser?.id || 'guest',
                          spaceId: targetWorkspaceId || matchedSpace?.id || spaces[0]?.id || 'sp-1',
                          spaceName: hb.package?.packageName || hb.section?.name || matchedSpace?.name || 'Meeting Room & Desk Package',
                          spaceCity: matchedSpace?.city || (hb as any).workspace?.city || 'Riyadh',
                          spaceAddress: matchedSpace?.address || (hb as any).workspace?.address || 'Workspace Location',
                          spaceImage: matchedSpace?.images?.[0] || (hb as any).workspace?.image || FALLBACK_SPACE_IMAGE,
                          type: (matchedSpace?.type as any) || 'meeting-room',
                          plan: 'hourly',
                          startDate: hb.startDate ? new Date(hb.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                          endDate: hb.endDate ? new Date(hb.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                          seats: 1,
                          employees: [],
                          totalPrice: hb.package?.price || 150,
                          status: hb.status === 'CONFIRMED' || hb.status === 'ACTIVE' ? 'active' : hb.status === 'CANCELLED' ? 'cancelled' : 'previous',
                          createdAt: hb.createdAt || new Date().toISOString(),
                        };
                        setSelectedBooking(converted);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-soot text-plaster text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black transition-colors cursor-pointer"
                    >
                      <QrCode size={14} />
                      <span>{t('myBookings.viewQr')}</span>
                    </button>

                    {hb.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await updateHourlyBookingApi(hb.id, { status: 'CANCELLED' });
                          showToast(t('myBookings.hourlyCancelled'), 'info');
                          setHourlyBookings(prev => prev.map(b => b.id === hb.id ? { ...b, status: 'CANCELLED' } : b));
                        }}
                        className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>

      {/* Admin-Matching Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: t('dash.activeBookings'),
            count: activeCount,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: CalendarDays,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: t('myBookings.stat.previous'),
            count: previousCount,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Clock,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: t('myBookings.tab.cancelled'),
            count: cancelledCount,
            badge: 'bg-red-500/15 text-red-700 border border-red-500/30',
            icon: Ban,
            iconBg: 'bg-red-500/15 text-red-700 border-red-500/30',
          },
          {
            label: t('myBookings.stat.totalSpend'),
            count: `${t('common.sar')} ${totalSpend.toLocaleString()}`,
            badge: 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
            icon: DollarSign,
            iconBg: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${stat.iconBg}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-normal text-soot tracking-tight font-serif-display">{stat.count}</div>
                <div className="text-xs font-medium text-moss mt-0.5">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin-Matching Search & Tab Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('myBookings.searchPlaceholder')}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-plaster-dark/30 p-1 rounded-xl border border-soot/10 shrink-0 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'active', label: t('myBookings.tab.active'), count: activeCount },
            { id: 'previous', label: t('myBookings.tab.previous'), count: previousCount },
            { id: 'cancelled', label: t('myBookings.tab.cancelled'), count: cancelledCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BookingStatus)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-soot text-plaster shadow-2xs'
                  : 'text-moss hover:text-soot hover:bg-soot/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-soot/10 text-soot'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Admin-Matching 12-Column Table Layout */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-5">{t('myBookings.colWorkspace')}</div>
          <div className="col-span-3">{t('myBookings.colPeriod')}</div>
          <div className="col-span-2">{t('myBookings.colPlan')}</div>
          <div className="col-span-1">{t('myBookings.colAmount')}</div>
          <div className="col-span-1 text-end">{t('mySpaces.colActions')}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-moss">
            <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('myBookings.noneHere')}</p>
          </div>
        ) : (
          <div className="divide-y divide-soot/8">
            {filtered.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="px-6 py-4 hover:bg-plaster-dark/30 transition-colors flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-center cursor-pointer group"
              >
                {/* Workspace Name & Image */}
                <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                  <img
                    src={b.spaceImage || FALLBACK_SPACE_IMAGE}
                    alt={b.spaceName}
                    className="w-11 h-11 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-soot group-hover:text-emerald-900 transition-colors truncate">
                      {st.bookingName(b)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5 font-medium">
                      <MapPin size={12} className="text-moss shrink-0" />
                      <span className="truncate">{st.bookingCity(b)}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Period */}
                <div className="col-span-3 mt-2 lg:mt-0 text-xs text-soot font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-moss shrink-0" />
                    <span>{b.startDate}</span>
                  </div>
                  {b.startDate !== b.endDate && (
                    <div className="text-moss text-[11px] mt-0.5 ps-4">{t('myBookings.periodTo', { date: b.endDate })}</div>
                  )}
                </div>

                {/* Plan & Seats */}
                <div className="col-span-2 mt-2 lg:mt-0 text-xs font-semibold text-soot capitalize">
                  {b.plan === 'hourly'
                    ? t(b.durationHours === 1 ? 'booking.hourlyHrs' : 'booking.hourlyHrsMany', { count: b.durationHours || 1 })
                    : b.plan === 'daily'
                    ? t((b.durationDays || 1) === 1 ? 'myBookings.dailyPassDays' : 'myBookings.dailyPassDaysMany', { count: b.durationDays || (b.startDate && b.endDate ? calculateDailyDurationDays(b.startDate, b.endDate) : 1) })
                    : b.plan === 'monthly'
                    ? t('myBookings.monthlyMo', { count: b.durationMonths || 1 })
                    : t(('booking.planPass.' + b.plan) as never)}
                  {(b.startTime || b.endTime) && (
                    <span className="block text-[10px] font-medium text-emerald-800 normal-case">
                      {localizeTime(b.startTime)} – {localizeTime(b.endTime)}
                    </span>
                  )}
                  <span className="block text-[11px] font-normal text-moss">
                    {t(b.seats > 1 ? 'booking.seatMany' : 'booking.seatOne', { count: b.seats })}
                  </span>
                </div>

                {/* Revenue Amount */}
                <div className="col-span-1 mt-2 lg:mt-0 text-sm font-semibold text-soot">
                  {(() => {
                    const price = getBookingPrice(b, spaces);
                    const isHourly = b.plan === 'hourly' || Boolean(b.durationHours);
                    const isPassCovered = b.paidWithPass || price === 0 || b.totalPrice === 0;

                    if (isPassCovered) {
                      return (
                        <div className="inline-flex flex-col items-start gap-0.5">
                          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1 shadow-2xs whitespace-nowrap">
                            <Clock size={11} className="text-emerald-700 shrink-0" />
                            <span>{isHourly ? t((b.durationHours || 1) === 1 ? 'myBookings.hoursCovered' : 'myBookings.hoursCoveredMany', { count: b.durationHours || 1 }) : t('booking.included')}</span>
                          </span>
                          <span className="text-[10px] text-emerald-800 font-semibold ps-1">{t('myBookings.coveredByPass')}</span>
                        </div>
                      );
                    }

                    if (b.coveredHours && b.coveredHours > 0) {
                      return (
                        <div>
                          <div className="font-semibold text-soot text-xs">{t('common.sar')} {price.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-800 font-semibold">{t('myBookings.passQuota', { count: b.coveredHours })}</div>
                        </div>
                      );
                    }

                    return `${t('common.sar')} ${price.toLocaleString()}`;
                  })()}
                </div>

                {/* Actions */}
                <div className="col-span-1 mt-4 lg:mt-0 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                    }}
                    className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                    title={t('myBookings.viewDetails')}
                  >
                    <Eye size={15} />
                  </button>
                  {b.status === 'active' && (() => {
                    const { eligible, requiredHours } = isCancellationRefundEligible(b.startDate, b.startTime, currentUser?.role);
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelModal(b);
                        }}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                        title={
                          eligible
                            ? t('myBookings.cancelEligible')
                            : t('myBookings.cancelNonRefundable', { hours: requiredHours })
                        }
                      >
                        <X size={15} />
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking QR Code & Details Modal */}
      {selectedBooking && (
        <BookingQrModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancelClick={(b) => {
            setSelectedBooking(null);
            setCancelModal(b);
          }}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (() => {
        const { eligible, requiredHours } = isCancellationRefundEligible(cancelModal.startDate, cancelModal.startTime, currentUser.role);
        const bookingPrice = getBookingPrice(cancelModal, spaces);

        return (
          <Modal
            open={!!cancelModal}
            onClose={() => setCancelModal(null)}
            title={t('myBookings.cancelReservation')}
            size="sm"
            footer={
              <>
                <button type="button" onClick={() => setCancelModal(null)} className="btn-secondary">
                  {t('myBookings.keepBooking')}
                </button>
                <button type="button" onClick={handleCancelConfirm} className="btn-danger">
                  {t('myBookings.confirmCancel')}
                </button>
              </>
            }
          >
            <div className="text-sm text-soot space-y-3 py-2">
              <p>
                {t('myBookings.confirmQuestion')} <span className="font-semibold">{st.bookingName(cancelModal)}</span>?
              </p>

              {/* Legal Refund Status Banner */}
              {eligible ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-950">
                    <Check size={14} className="text-emerald-700" />
                    <span>{t('myBookings.eligibleFull', { currency: t('common.sar'), amount: bookingPrice.toLocaleString() })}</span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    {t('myBookings.eligibleBody', { hours: requiredHours })}
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-950">
                    <AlertCircle size={14} className="text-rose-700" />
                    <span>{t('myBookings.nonRefundable')}</span>
                  </div>
                  <p className="text-rose-800 text-[11px]">
                    {t('myBookings.nonRefBody', { hours: requiredHours })}
                  </p>
                </div>
              )}

              {/* Refund Destination Selection if Eligible */}
              {eligible && (
                <div className="space-y-2 pt-1 border-t border-soot/8">
                  <label className="text-xs font-semibold text-soot block">{t('myBookings.refundDestination')}</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRefundMethod('wallet')}
                      className={`p-2.5 rounded-xl border text-start flex flex-col justify-between transition-all cursor-pointer ${
                        refundMethod === 'wallet'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-soot/12 bg-white text-soot hover:bg-plaster-dark/20'
                      }`}
                    >
                      <span className="font-semibold text-[11px] flex items-center gap-1.5">
                        <Zap size={13} className="text-amber-600 shrink-0" />
                        <span>{t('myBookings.instantWallet')}</span>
                      </span>
                      <span className="text-[10px] text-moss mt-1">{t('myBookings.availableNow')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundMethod('card')}
                      className={`p-2.5 rounded-xl border text-start flex flex-col justify-between transition-all cursor-pointer ${
                        refundMethod === 'card'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-soot/12 bg-white text-soot hover:bg-plaster-dark/20'
                      }`}
                    >
                      <span className="font-semibold text-[11px] flex items-center gap-1.5">
                        <CreditCard size={13} className="text-soot shrink-0" />
                        <span>{t('myBookings.originalCard')}</span>
                      </span>
                      <span className="text-[10px] text-moss mt-1">{t('myBookings.businessDays')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
      </>
      )}
    </div>
  );
}
