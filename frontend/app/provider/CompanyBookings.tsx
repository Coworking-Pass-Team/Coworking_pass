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
  Building2,
  Download,
  QrCode,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import { useLabels } from '@/i18n/labels';
import { Booking, BookingStatus, Space, User, getBookingPrice } from '@/types/types';
import BookingQrModal from '@/components/BookingQrModal';
import { getHourlyBookingsApi, updateHourlyBookingApi, HourlyBookingItemApi } from '@/services/authApi';

const FALLBACK_SPACE_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';

export default function CompanyBookings() {
  const { t, translateMessage, localizeTime, formatDate } = useI18n();
  const sx = useSpaceText();
  const lb = useLabels();
  const { currentUser, bookings, spaces, users, cancelBooking, showToast } = useApp();
  const [bookingCategory, setBookingCategory] = useState<'direct' | 'hourly'>('direct');
  const [hourlyBookings, setHourlyBookings] = useState<HourlyBookingItemApi[]>([]);
  const [loadingHourly, setLoadingHourly] = useState(false);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSpace, setFilterSpace] = useState('');

  useEffect(() => {
    if (bookingCategory === 'hourly') {
      setLoadingHourly(true);
      getHourlyBookingsApi().then(res => {
        if (res.success && res.data) setHourlyBookings(res.data);
        setLoadingHourly(false);
      });
    }
  }, [bookingCategory]);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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

  const companySpaceIds = spaces
    .filter((s: Space) => s.ownerId === currentUser.id)
    .map((s: Space) => s.id);

  const companyBookings = bookings.filter((b: Booking) => companySpaceIds.includes(b.spaceId));

  const getUserName = (userId: string) => {
    const u = users.find((user: User) => user.id === userId);
    return u ? u.name : userId;
  };

  const filtered = companyBookings
    .filter((b: Booking) => {
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
      if (filterSpace && b.spaceId !== filterSpace) return false;
      return true;
    })
    .slice()
    .sort((a: Booking, b: Booking) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  const activeCount = companyBookings.filter((b) => b.status === 'active').length;
  const previousCount = companyBookings.filter((b) => b.status === 'previous').length;
  const cancelledCount = companyBookings.filter((b) => b.status === 'cancelled').length;

  const totalRevenue = companyBookings
    .filter((b: Booking) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + getBookingPrice(b, spaces), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            {t('prov.cb.eyebrow')}
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            {t('prov.cb.title')}
          </h1>
          <p className="text-moss text-sm mt-1">
            {t('prov.cb.total', { count: companyBookings.length })}
          </p>
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
            <span>{t('prov.cb.direct')}</span>
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
            <span>{t('prov.cb.hourlyTab')}</span>
          </button>
        </div>
      </div>

      {bookingCategory === 'hourly' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-xl font-normal font-serif-display text-soot">{t('prov.cb.hourlyTitle')}</h3>
              <p className="text-xs text-moss mt-0.5">{t('prov.cb.hourlySub')}</p>
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
              {t('prov.cb.loading')}
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
                      {lb.status(String(hb.status).toLowerCase())}
                    </span>
                    <span className="text-xs font-mono text-moss">{hb.id.slice(0, 10)}...</span>
                  </div>
                  <h4 className="text-base font-semibold text-soot font-serif-display">
                    {hb.package?.packageName || hb.section?.name || t('prov.cb.fallbackPackage')}
                  </h4>
                  <div className="text-xs text-moss space-y-1 pt-2 border-t border-soot/6">
                    <div>{t('prov.cb.userName')} <span className="font-semibold text-soot">{hb.user?.name || hb.userId}</span></div>
                    <div>{t('prov.cb.startDate')} <span className="font-medium text-soot">{hb.startDate ? formatDate(hb.startDate) : t('prov.cb.na')}</span></div>
                    <div>{t('prov.cb.endDate')} <span className="font-medium text-soot">{hb.endDate ? formatDate(hb.endDate) : t('prov.cb.na')}</span></div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        // حل FE-09: الربط بالمساحة الحقيقية
                        const targetWorkspaceId = (hb as any).workspaceId || (hb.section as any)?.workspaceId || (hb.package as any)?.workspaceId;
                        const matchedSpace = spaces.find(s => s.id === targetWorkspaceId);

                        const converted: Booking = {
                          id: hb.id,
                          userId: hb.userId || currentUser?.id || 'org-user',
                          spaceId: targetWorkspaceId || matchedSpace?.id || spaces[0]?.id || 'sp-1',
                          spaceName: hb.package?.packageName || hb.section?.name || matchedSpace?.name || 'Corporate Meeting & Desk Package',
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
                      <span>{t('prov.cb.viewPass')}</span>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: t('prov.bk.totalRevenueLbl'),
                count: `${t('common.sar')} ${totalRevenue.toLocaleString()}`,
                badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
                icon: DollarSign,
                iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
              },
              {
                label: t('prov.bk.activeBookingsLbl'),
                count: activeCount,
                badge: 'bg-soot/10 text-soot border border-soot/15',
                icon: CalendarDays,
                iconBg: 'bg-soot text-plaster border-soot/20',
              },
              {
                label: t('admin.bk.completedVisits'),
                count: previousCount,
                badge: 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
                icon: Clock,
                iconBg: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
              },
              {
                label: t('admin.bk.cancelled'),
                count: cancelledCount,
                badge: 'bg-red-500/15 text-red-700 border border-red-500/30',
                icon: Ban,
                iconBg: 'bg-red-500/15 text-red-700 border-red-500/30',
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

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs relative z-30">
            <div className="relative flex-1">
              <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-moss" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('prov.cb.search')}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
              />
            </div>

            <div className="relative min-w-44" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-start cursor-pointer focus:outline-none"
              >
                <span className="text-sm font-medium text-soot truncate capitalize">
                  {filterStatus ? t('prov.bk.spaceFilter', { status: lb.status(filterStatus) }) : 'All Status'}
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
                      { value: 'active', label: 'admin.bk.activeBookings' },
                      { value: 'previous', label: 'admin.bk.completedVisits' },
                      { value: 'cancelled', label: 'admin.bk.cancelled' },
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
          </div>

          {/* Table */}
          <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
            <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
              <div className="col-span-4">{t('myBookings.colWorkspace')}</div>
              <div className="col-span-2">{t('prov.cb.colCustomer')}</div>
              <div className="col-span-2">{t('myBookings.colPeriod')}</div>
              <div className="col-span-1">{t('qr.seats')}</div>
              <div className="col-span-1">{t('myBookings.colAmount')}</div>
              <div className="col-span-2 text-end">{t('admin.bk.colStatus')}</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-moss">
                <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t('prov.cb.none')}</p>
              </div>
            ) : (
              <div className="divide-y divide-soot/8">
                {filtered.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="px-6 py-4 hover:bg-plaster-dark/30 transition-colors flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-center cursor-pointer group"
                  >
                    <div className="col-span-4 flex items-center gap-3.5 min-w-0">
                      <img
                        src={b.spaceImage || FALLBACK_SPACE_IMAGE}
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

                    <div className="col-span-2 mt-2 lg:mt-0 text-sm font-medium text-soot truncate">
                      {getUserName(b.userId)}
                    </div>

                    <div className="col-span-2 mt-2 lg:mt-0 text-xs text-soot font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-moss shrink-0" />
                        <span>{b.startDate}</span>
                      </div>
                      {b.startDate !== b.endDate && (
                        <div className="text-moss text-[11px] mt-0.5 ps-4">{t('prov.cb.to', { date: b.endDate })}</div>
                      )}
                    </div>

                    <div className="col-span-1 mt-2 lg:mt-0 text-xs font-semibold text-soot">
                      {t(b.seats > 1 ? 'booking.seatMany' : 'booking.seatOne', { count: b.seats })}
                    </div>

                    <div className="col-span-1 mt-2 lg:mt-0 text-sm font-semibold text-soot">
                      {t('common.sar')} {getBookingPrice(b, spaces).toLocaleString()}
                    </div>

                    <div className="col-span-2 mt-4 lg:mt-0 flex items-center justify-end gap-2">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          b.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                            : b.status === 'previous'
                            ? 'bg-soot/10 text-soot border border-soot/15'
                            : 'bg-red-500/15 text-red-700 border border-red-500/30'
                        }`}
                      >
                        {lb.status(b.status)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(b);
                        }}
                        className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                        title={t('prov.bk.viewDetails')}
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selectedBooking && (
        <BookingQrModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancelClick={(b) => {
            setSelectedBooking(null);
            cancelBooking(b.id);
            showToast(t('prov.cb.cancelled'), 'info');
          }}
        />
      )}
    </div>
  );
}
