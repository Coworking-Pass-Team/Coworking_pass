'use client';

import { useI18n } from '@/i18n';
import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  MapPin,
  Calendar,
  Users,
  Check,
  CalendarDays,
  Clock,
  Ban,
  DollarSign,
  Eye,
  X,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import { useLabels } from '@/i18n/labels';
import { Booking, BookingStatus, getBookingPrice, calculateDailyDurationDays } from '@/types/types';
import { updateDirectBookingApi } from '@/services/authApi';
import HourlyBookingsAdmin from './HourlyBookingsAdmin';

export default function BookingsAdmin() {
  const { t, localizeTime } = useI18n();
  const st = useSpaceText();
  const lb = useLabels();
  const { bookings, spaces, users, updateBookingStatus, deleteBooking, showToast, fetchHourlyBookings } = useApp();
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  // Dropdown states for filters
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const planDropdownRef = useRef<HTMLDivElement>(null);

  // Detail Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchHourlyBookings().catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target as Node)) {
        setPlanDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserName = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    if (!u) return userId;
    return u.role === 'organization' ? u.orgName || u.name : u.name;
  };

  const filtered = bookings
    .filter((b) => {
      const q = query.trim().toLowerCase();
      if (
        q &&
        !b.spaceName.toLowerCase().includes(q) &&
        !b.spaceCity.toLowerCase().includes(q) &&
        !getUserName(b.userId).toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filterStatus && b.status !== filterStatus) return false;
      if (filterPlan && b.plan !== filterPlan) return false;
      return true;
    })
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  const activeCount = bookings.filter((b) => b.status === 'active').length;
  const previousCount = bookings.filter((b) => b.status === 'previous').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const handleUpdateStatus = (bookingId: string, status: BookingStatus) => {
    updateBookingStatus(bookingId, status);
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status } : null));
    }
    const backendStatus = status === 'active' ? 'CONFIRMED' : status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';
    updateDirectBookingApi(bookingId, { status: backendStatus }).catch((err: any) =>
      console.warn('[Direct Booking PUT Sync]', err)
    );
    showToast(`Booking status changed to ${status}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            {t('admin.bk.eyebrow')}
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            {t('admin.bk.title')}
          </h1>
        </div>
      </div>

      {/* 4 Clean Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: t('dash.totalBookings'),
            count: bookings.length,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            pct: '100%',
            icon: CalendarDays,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: t('admin.bk.activeBookings'),
            count: activeCount,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            pct: `${Math.round((activeCount / (bookings.length || 1)) * 100)}%`,
            icon: Clock,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: t('admin.bk.completedVisits'),
            count: previousCount,
            badge: 'bg-eucalyptus/25 text-soot border border-eucalyptus/35',
            pct: `${Math.round((previousCount / (bookings.length || 1)) * 100)}%`,
            icon: Check,
            iconBg: 'bg-eucalyptus/25 text-soot border-eucalyptus/35',
          },
          {
            label: t('admin.bk.cancelled'),
            count: cancelledCount,
            badge: 'bg-red-500/15 text-red-700 border border-red-500/30',
            pct: `${Math.round((cancelledCount / (bookings.length || 1)) * 100)}%`,
            icon: Ban,
            iconBg: 'bg-red-500/15 text-red-700 border border-red-500/30',
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
                <div className="text-3xl font-normal text-soot tracking-tight font-serif-display">{stat.count}</div>
                <div className="text-xs font-medium text-moss mt-0.5">{stat.label}</div>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-2xs ${stat.badge}`}>
              {stat.pct}
            </span>
          </div>
        ))}
      </div>

      {/* Search & Custom Dropdown Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs relative z-30">
        <div className="relative flex-1">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.bk.search')}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Custom Status Dropdown */}
        <div className="relative min-w-44" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-start cursor-pointer focus:outline-none"
          >
            <span className="text-sm font-medium text-soot truncate">
              {filterStatus
                ? filterStatus === 'active'
                  ? t('admin.bk.active')
                  : filterStatus === 'previous'
                  ? t('admin.bk.completed')
                  : t('admin.bk.cancelled')
                : t('admin.bk.allStatus')}
            </span>
            <ChevronDown
              size={15}
              className={`text-moss transition-transform duration-200 shrink-0 ${
                statusDropdownOpen ? 'rotate-180 text-soot' : ''
              }`}
            />
          </button>

          {statusDropdownOpen && (
            <div className="absolute top-full start-0 end-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="space-y-0.5">
                {[
                  { value: '', label: 'admin.bk.allStatus' },
                  { value: 'active', label: t('admin.bk.activeBookings') },
                  { value: 'previous', label: t('admin.bk.completedVisits') },
                  { value: 'cancelled', label: t('admin.bk.cancelled') },
                ].map((item) => {
                  const isSelected = filterStatus === item.value;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setFilterStatus(item.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-start cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{t(item.label as never)}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Custom Plan Dropdown */}
        <div className="relative min-w-40" ref={planDropdownRef}>
          <button
            type="button"
            onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-start cursor-pointer focus:outline-none"
          >
            <span className="text-sm font-medium text-soot truncate capitalize">
              {filterPlan ? t(('admin.bk.' + filterPlan + 'Pass') as never) === ('admin.bk.' + filterPlan + 'Pass') ? lb.plan(filterPlan) : t(('admin.bk.' + (filterPlan === 'yearly' ? 'annual' : filterPlan) + 'Pass') as never) : t('admin.bk.allPlans')}
            </span>
            <ChevronDown
              size={15}
              className={`text-moss transition-transform duration-200 shrink-0 ${
                planDropdownOpen ? 'rotate-180 text-soot' : ''
              }`}
            />
          </button>

          {planDropdownOpen && (
            <div className="absolute top-full start-0 end-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="space-y-0.5">
                {[
                  { value: '', label: 'admin.bk.allPlans' },
                  { value: 'hourly', label: 'admin.bk.hourlyPass' },
                  { value: 'daily', label: 'admin.bk.dailyPass' },
                  { value: 'monthly', label: 'admin.bk.monthlyPass' },
                  { value: 'yearly', label: 'admin.bk.annualPass' },
                ].map((item) => {
                  const isSelected = filterPlan === item.value;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setFilterPlan(item.value);
                        setPlanDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-start cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{t(item.label as never)}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clean Table Layout */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-4">{t('myBookings.colWorkspace')}</div>
          <div className="col-span-2">{t('admin.bk.colUser')}</div>
          <div className="col-span-2">{t('myBookings.colPeriod')}</div>
          <div className="col-span-1">{t('myBookings.colPlan')}</div>
          <div className="col-span-1">{t('myBookings.colAmount')}</div>
          <div className="col-span-2 text-end">{t('admin.bk.colStatus')}</div>
        </div>

        <div className="divide-y divide-soot/8">
          {filtered.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              className="px-6 py-4 hover:bg-plaster-dark/30 transition-colors flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-center cursor-pointer group"
            >
              {/* Workspace Thumbnail & Name */}
              <div className="col-span-4 flex items-center gap-3.5 min-w-0">
                <img
                  src={b.spaceImage}
                  alt={st.bookingName(b)}
                  className="w-11 h-11 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-soot text-sm group-hover:text-emerald-900 transition-colors truncate">
                    {st.bookingName(b)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5 font-medium">
                    <MapPin size={12} className="shrink-0" />
                    <span>{st.bookingCity(b)}</span>
                  </div>
                </div>
              </div>

              {/* User Name */}
              <div className="col-span-2 mt-2 lg:mt-0 text-sm font-semibold text-soot truncate">
                {getUserName(b.userId)}
              </div>

              {/* Booking Period */}
              <div className="col-span-2 mt-2 lg:mt-0 text-xs text-moss font-medium">
                <div className="text-soot font-semibold">{b.startDate}</div>
                {b.endDate !== b.startDate && (
                  <div className="text-[11px] text-moss">→ {b.endDate}</div>
                )}
                {b.startTime && (
                  <div className="text-[11px] text-emerald-800 font-medium mt-0.5">{localizeTime(b.startTime)} – {localizeTime(b.endTime)}</div>
                )}
              </div>

              {/* Plan & Seats */}
              <div className="col-span-1 mt-2 lg:mt-0">
                <div className="text-xs font-semibold text-soot capitalize">
                  {b.plan === 'hourly'
                    ? t(b.durationHours === 1 ? 'booking.hourlyHrs' : 'booking.hourlyHrsMany', { count: b.durationHours || 1 })
                    : b.plan === 'daily'
                    ? t((b.durationDays || 1) === 1 ? 'myBookings.dailyPassDays' : 'myBookings.dailyPassDaysMany', { count: b.durationDays || (b.startDate && b.endDate ? calculateDailyDurationDays(b.startDate, b.endDate) : 1) })
                    : b.plan === 'monthly'
                    ? t('myBookings.monthlyMo', { count: b.durationMonths || 1 })
                    : t(('booking.planPass.' + b.plan) as never)}
                </div>
                {(b.startTime || b.endTime) && (
                  <div className="text-[10px] text-emerald-800 font-medium">
                    {b.startTime} – {b.endTime}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[11px] text-moss mt-0.5">
                  <Users size={11} />
                  <span>{t(b.seats > 1 ? 'booking.seatMany' : 'booking.seatOne', { count: b.seats })}</span>
                </div>
              </div>

              {/* Total Price */}
              <div className="col-span-1 mt-2 lg:mt-0 text-sm font-bold text-soot">
                {t('common.sar')} {getBookingPrice(b, spaces).toLocaleString()}
              </div>

              {/* Status Badge & Eye Details Button */}
              <div className="col-span-2 mt-3 lg:mt-0 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-semibold capitalize ${
                    b.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                      : b.status === 'previous'
                      ? 'bg-soot/10 text-soot border border-soot/15'
                      : 'bg-red-500/10 text-red-700 border border-red-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      b.status === 'active' ? 'bg-emerald-500' : b.status === 'previous' ? 'bg-soot' : 'bg-red-500'
                    }`}
                  />
                  <span>{b.status === 'previous' ? t('admin.bk.completed') : lb.status(b.status)}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedBooking(b)}
                  className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                  title={t('admin.bk.viewTitle')}
                >
                  <Eye size={15} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to permanently delete booking "${b.id}" for workspace "${st.bookingName(b)}"?`)) {
                      deleteBooking(b.id);
                    }
                  }}
                  className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                  title={t('admin.bk.deleteTitle')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-moss">
            <CalendarDays size={40} className="mx-auto mb-3 text-moss/50" />
            <div className="text-base font-medium text-soot">{t('admin.bk.none')}</div>
            <p className="text-xs text-moss mt-1">Try updating your filter criteria or search query.</p>
          </div>
        )}
      </div>

      {/* Surface-Toned Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-soot/70 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          />

          <div className="relative w-full max-w-lg bg-plaster-surface rounded-3xl shadow-2xl border border-soot/15 overflow-hidden z-10">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-soot/10 flex items-center justify-between bg-plaster-dark/30">
              <div>
                <h3 className="text-xl font-serif-display font-medium text-soot">
                  {t('admin.bk.overview')}
                </h3>
                <p className="text-xs text-moss mt-0.5">Reference: #{selectedBooking.id.slice(-8).toUpperCase()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4 pb-5 border-b border-soot/10">
                <img
                  src={selectedBooking.spaceImage}
                  alt={st.bookingName(selectedBooking)}
                  className="w-16 h-16 rounded-2xl object-cover border border-soot/10 shadow-xs"
                />
                <div>
                  <h4 className="font-semibold text-soot text-lg leading-tight">
                    {st.bookingName(selectedBooking)}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-moss mt-1 font-medium">
                    <MapPin size={13} className="text-moss" />
                    <span>{selectedBooking.spaceCity}</span>
                  </div>
                  <div className="text-xs text-soot font-semibold mt-1">
                    {t('admin.bk.bookedBy', { name: getUserName(selectedBooking.userId) })}
                  </div>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="space-y-3 text-sm">
                {[
                  {
                    label: t('admin.bk.bookingPlan'),
                    value: selectedBooking.plan === 'hourly'
                      ? t(selectedBooking.durationHours === 1 ? 'admin.bk.planHourly' : 'admin.bk.planHourlyMany', { count: selectedBooking.durationHours || 1 })
                      : selectedBooking.plan === 'monthly'
                      ? t((selectedBooking.durationMonths || 1) > 1 ? 'admin.bk.planMonthlyMany' : 'admin.bk.planMonthly', { count: selectedBooking.durationMonths || 1 })
                      : t(('booking.planPass.' + selectedBooking.plan) as never),
                    icon: CreditCard,
                  },
                  { label: t('admin.bk.reservedSeats'), value: t('admin.bk.seatsValue', { count: selectedBooking.seats }), icon: Users },
                  { label: selectedBooking.plan === 'hourly' ? t('qr.bookingDate') : t('spaceDetails.startDate'), value: selectedBooking.startDate, icon: Calendar },
                  ...(selectedBooking.plan === 'hourly'
                    ? [{
                        label: t('qr.timeWindow'),
                        value: t(selectedBooking.durationHours === 1 ? 'admin.bk.timeWindowValue' : 'admin.bk.timeWindowValueMany', { start: localizeTime(selectedBooking.startTime || '09:00 AM'), end: localizeTime(selectedBooking.endTime || '05:00 PM'), count: selectedBooking.durationHours || 1 }),
                        icon: Clock,
                      }]
                    : selectedBooking.startTime
                    ? [{
                        label: t('qr.dailyHours'),
                        value: `${localizeTime(selectedBooking.startTime)} – ${localizeTime(selectedBooking.endTime)}`,
                        icon: Clock,
                      }]
                    : []),
                  ...(selectedBooking.durationMonths && selectedBooking.durationMonths > 1 ? [{ label: t('admin.bk.durationMonths'), value: t('admin.bk.months', { count: selectedBooking.durationMonths }), icon: Calendar }] : []),
                  ...(selectedBooking.plan !== 'hourly' && selectedBooking.endDate !== selectedBooking.startDate ? [{ label: t('spaceDetails.endDate'), value: selectedBooking.endDate, icon: Calendar }] : []),
                  { label: t('admin.bk.totalPaid'), value: `${t('common.sar')} ${getBookingPrice(selectedBooking, spaces).toLocaleString()}`, icon: DollarSign },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-soot/6 last:border-0">
                    <span className="text-moss text-xs flex items-center gap-2">
                      <row.icon size={14} className="text-moss/70" />
                      <span>{row.label}</span>
                    </span>
                    <span className="text-soot font-semibold text-xs sm:text-sm">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Status Update Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-soot block">{t('admin.bk.updateStatus')}</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'previous', 'cancelled'] as BookingStatus[]).map((statusOption) => {
                    const isSelected = selectedBooking.status === statusOption;
                    return (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => handleUpdateStatus(selectedBooking.id, statusOption)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-soot border-soot text-plaster shadow-xs'
                            : 'bg-white border-soot/15 text-soot hover:bg-plaster-dark/30 hover:border-soot/30'
                        }`}
                      >
                        {statusOption === 'previous' ? t('admin.bk.completed') : lb.status(statusOption)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-soot/10 bg-plaster-dark/30 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
