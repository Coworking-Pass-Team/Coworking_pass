'use client';

import { useI18n } from '@/i18n';
import { useLabels } from '@/i18n/labels';
import { useSpaceText } from '@/i18n/space-text';
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
  Building2,
  Plus,
  AlertCircle,
  Zap,
  Wallet,
  QrCode
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, BookingStatus, Employee, getHourlyPriceForDuration, getBookingPrice, isCancellationRefundEligible, calculateDailyDurationDays } from '@/types/types';
import Modal from '@/components/ui/Modal';
import BookingQrModal from '@/components/BookingQrModal';

export default function TeamBookings() {
  const { t, translateMessage, localizeTime, formatDate } = useI18n();
  const sx = useSpaceText();
  const lb = useLabels();
  const { bookings, spaces, currentUser, navigate, cancelBooking, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<BookingStatus>('active');
  const [query, setQuery] = useState('');

  // Dropdown states for filters
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Detail Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModal, setCancelModal] = useState<Booking | null>(null);
  const [refundMethod, setRefundMethod] = useState<'wallet' | 'card'>('wallet');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const orgBookings = bookings.filter((b: Booking) => b.userId === currentUser.id);
  const employees = currentUser.employees || [];

  const filtered = orgBookings
    .filter((b: Booking) => {
      const q = query.trim().toLowerCase();
      if (
        q &&
        !b.spaceName.toLowerCase().includes(q) &&
        !b.spaceCity.toLowerCase().includes(q)
      ) {
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

  const activeCount = orgBookings.filter((b) => b.status === 'active').length;
  const previousCount = orgBookings.filter((b) => b.status === 'previous').length;
  const cancelledCount = orgBookings.filter((b) => b.status === 'cancelled').length;

  const totalSpend = orgBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + getBookingPrice(b, spaces), 0);

  const getEmpName = (id: string) => employees.find((e: Employee) => e.id === id)?.name || id;

  const handleCancelConfirm = () => {
    if (!cancelModal) return;
    cancelBooking(cancelModal.id, refundMethod);
    setCancelModal(null);
    if (selectedBooking && selectedBooking.id === cancelModal.id) {
      setSelectedBooking(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            {t('org.tb2b.enterpriseBookingWorkspaceActivity')}
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            {t('org.tb2b.teamBookings')}
          </h1>
          <p className="text-moss text-sm mt-1">
            {t('org.tb2.subtitle', { count: orgBookings.length })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('browse')}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>{t('org.tb2b.newBooking')}</span>
        </button>
      </div>

      {/* Admin-Matching Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: t('org.tb2b.activeBookings'),
            count: activeCount,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: CalendarDays,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: t('org.tb2b.completedVisits'),
            count: previousCount,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Clock,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: t('org.tb2b.cancelled'),
            count: cancelledCount,
            badge: 'bg-red-500/15 text-red-700 border border-red-500/30',
            icon: Ban,
            iconBg: 'bg-red-500/15 text-red-700 border-red-500/30',
          },
          {
            label: t('org.tb2b.totalSpend'),
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
                <div className="text-xs font-medium text-moss mt-0.5">{translateMessage(stat.label)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin-Matching Search & Tab Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('org.tb2b.searchByWorkspaceNameOr')}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-plaster-dark/30 p-1 rounded-xl border border-soot/10 shrink-0 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'active', label: t('org.tb2b.active'), count: activeCount },
            { id: 'previous', label: t('org.tb2b.previous'), count: previousCount },
            { id: 'cancelled', label: t('org.tb2b.cancelled'), count: cancelledCount },
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
              <span>{translateMessage(tab.label)}</span>
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
          <div className="col-span-4">{t('org.tb2b.workspaceLocation')}</div>
          <div className="col-span-2">{t('org.tb2b.assignedTeamMember')}</div>
          <div className="col-span-2">{t('org.tb2b.bookingPeriod')}</div>
          <div className="col-span-2">{t('org.tb2b.planSeats')}</div>
          <div className="col-span-1">{t('org.tb2b.amount')}</div>
          <div className="col-span-1 text-end">{t('org.tb2b.actions')}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-moss">
            <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('org.tb2b.noTeamReservationsFoundIn')}</p>
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
                <div className="col-span-4 flex items-center gap-3.5 min-w-0">
                  <img
                    src={b.spaceImage}
                    alt={sx.bookingName(b)}
                    className="w-11 h-11 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-soot group-hover:text-emerald-900 transition-colors truncate">
                      {sx.bookingName(b)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5 font-medium">
                      <MapPin size={12} className="text-moss shrink-0" />
                      <span className="truncate">{sx.bookingCity(b)}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Member */}
                <div className="col-span-2 mt-2 lg:mt-0 text-xs font-semibold text-soot truncate">
                  {b.employees && b.employees.length > 0
                    ? getEmpName(b.employees[0])
                    : (currentUser.orgName || 'Organization Pass')}
                  {b.employees && b.employees.length > 1 && (
                    <span className="block text-[10px] text-moss font-normal">
                      +{b.employees.length - 1} other member{b.employees.length > 2 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Booking Period */}
                <div className="col-span-2 mt-2 lg:mt-0 text-xs text-soot font-medium">
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
                  {getBookingPrice(b, spaces) === 0 ? (
                    <span className="text-xs font-bold text-moss bg-eucalyptus/30 px-2.5 py-1 rounded-full border border-eucalyptus/40 inline-flex items-center gap-1">
                      <Check size={11} className="text-moss" />
                      <span>{t('org.tb2b.includedInPlan')}</span>
                    </span>
                  ) : (
                    `${t('common.sar')} ${getBookingPrice(b, spaces).toLocaleString()}`
                  )}
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
                    title={t('org.tb2b.viewDetails')}
                  >
                    <Eye size={15} />
                  </button>
                  {b.status === 'active' && (() => {
                    const { eligible, requiredHours } = isCancellationRefundEligible(b.startDate, b.startTime, 'organization');
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
                            ? t('org.tb2b.cancelReservationEligibleForFull')
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

      {/* Booking QR Code & Pass Details Modal */}
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
        const { eligible, requiredHours } = isCancellationRefundEligible(cancelModal.startDate, cancelModal.startTime, 'organization');
        const bookingPrice = getBookingPrice(cancelModal, spaces);

        return (
          <Modal
            open={!!cancelModal}
            onClose={() => setCancelModal(null)}
            title={t('org.tb2b.cancelTeamReservation')}
            size="sm"
            footer={
              <>
                <button type="button" onClick={() => setCancelModal(null)} className="btn-secondary">
                  {t('org.tb2b.keepBooking')}
                </button>
                <button type="button" onClick={handleCancelConfirm} className="btn-danger">
                  {t('org.tb2b.confirmCancel')}
                </button>
              </>
            }
          >
            <div className="text-sm text-soot space-y-3 py-2">
              <p>
                {t('org.tb2.confirmQ')} <span className="font-semibold">{sx.bookingName(cancelModal)}</span>?
              </p>

              {/* Legal Refund Status Banner */}
              {eligible ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-950">
                    <Check size={14} className="text-emerald-700" />
                    <span>{t('org.tb2.eligibleFull', { amount: bookingPrice.toLocaleString() })}</span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    {t('org.tb2.eligibleBody', { hours: requiredHours })}
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-950">
                    <AlertCircle size={14} className="text-rose-700" />
                    <span>{t('org.tb2b.nonRefundableCancellation')}</span>
                  </div>
                  <p className="text-rose-800 text-[11px]">
                    {t('org.tb2.nonRefBody', { hours: requiredHours })}
                  </p>
                </div>
              )}

              {/* Refund Destination Selection if Eligible */}
              {eligible && (
                <div className="space-y-2 pt-1 border-t border-soot/8">
                  <label className="text-xs font-semibold text-soot block">{t('org.tb2b.chooseRefundDestination')}</label>
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
                        <span>{t('org.tb2b.instantWallet')}</span>
                      </span>
                      <span className="text-[10px] text-moss mt-1">{t('org.tb2b.availableImmediately')}</span>
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
                        <span>{t('org.tb2b.originalCard')}</span>
                      </span>
                      <span className="text-[10px] text-moss mt-1">{t('org.tb2b.514BusinessDays')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
