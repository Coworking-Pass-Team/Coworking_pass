'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  MapPin,
  Calendar,
  Check,
  CalendarDays,
  Clock,
  Ban,
  DollarSign,
  Eye,
  X,
  Building2,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, BookingStatus, getBookingPrice } from '@/types/types';

export default function ProviderSpaceBookings() {
  const { currentUser, spaces, bookings, users, updateBookingStatus, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSpace, setFilterSpace] = useState('');

  // Dropdown states for filters
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [spaceDropdownOpen, setSpaceDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const spaceDropdownRef = useRef<HTMLDivElement>(null);

  // Detail Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (spaceDropdownRef.current && !spaceDropdownRef.current.contains(event.target as Node)) {
        setSpaceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const mySpaces = spaces.filter((s) => s.ownerId === currentUser.id);
  const mySpaceIds = mySpaces.map((s) => s.id);
  const myBookings = bookings.filter((b) => mySpaceIds.includes(b.spaceId));

  const getUserName = (userId: string) => {
    const u = users.find((user) => user.id === userId);
    if (!u) return userId;
    return u.role === 'organization' ? (u.orgName || u.name) : u.name;
  };

  const filtered = myBookings
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
      if (filterSpace && b.spaceId !== filterSpace) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  const activeCount = myBookings.filter((b) => b.status === 'active').length;
  const previousCount = myBookings.filter((b) => b.status === 'previous').length;
  const cancelledCount = myBookings.filter((b) => b.status === 'cancelled').length;

  const totalRevenue = myBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + getBookingPrice(b, spaces), 0);

  const handleUpdateStatus = (bookingId: string, status: BookingStatus) => {
    updateBookingStatus(bookingId, status);
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status } : null));
    }
    showToast(`Booking status updated to ${status}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            Reservations & Occupancy Activity
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            Space Bookings
          </h1>
          <p className="text-moss text-sm mt-1">
            {myBookings.length} total bookings across your workspace properties.
          </p>
        </div>
      </div>

      {/* Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            count: `SAR ${totalRevenue.toLocaleString()}`,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: DollarSign,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Active Bookings',
            count: activeCount,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: CalendarDays,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Completed Visits',
            count: previousCount,
            badge: 'bg-[#40534C]/15 text-[#40534C] border border-[#40534C]/30',
            icon: Clock,
            iconBg: 'bg-[#40534C]/15 text-[#40534C] border border-[#40534C]/30',
          },
          {
            label: 'Cancelled',
            count: cancelledCount,
            badge: 'bg-red-500/15 text-red-700 border border-red-500/30',
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
                <div className="text-2xl sm:text-3xl font-normal text-soot tracking-tight font-serif-display">{stat.count}</div>
                <div className="text-xs font-medium text-moss mt-0.5">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs relative z-30">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by space name, city, or member name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Space Filter Dropdown */}
        <div className="relative min-w-44" ref={spaceDropdownRef}>
          <button
            type="button"
            onClick={() => setSpaceDropdownOpen(!spaceDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={15} className="text-moss shrink-0" />
              <span className="text-sm font-medium text-soot truncate">
                {filterSpace ? mySpaces.find((s) => s.id === filterSpace)?.name || 'All Spaces' : 'All Spaces'}
              </span>
            </div>
            <ChevronDown
              size={15}
              className={`text-moss transition-transform duration-200 shrink-0 ${
                spaceDropdownOpen ? 'rotate-180 text-soot' : ''
              }`}
            />
          </button>

          {spaceDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setFilterSpace('');
                    setSpaceDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                    !filterSpace ? 'bg-soot text-plaster font-semibold' : 'text-soot hover:bg-plaster-dark/60'
                  }`}
                >
                  <span>All Spaces</span>
                  {!filterSpace && <Check size={14} className="text-eucalyptus" />}
                </button>
                {mySpaces.map((s) => {
                  const isSelected = filterSpace === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setFilterSpace(s.id);
                        setSpaceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                        isSelected ? 'bg-soot text-plaster font-semibold' : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative min-w-44" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
          >
            <span className="text-sm font-medium text-soot truncate capitalize">
              {filterStatus ? `${filterStatus} Bookings` : 'All Status'}
            </span>
            <ChevronDown
              size={15}
              className={`text-moss transition-transform duration-200 shrink-0 ${
                statusDropdownOpen ? 'rotate-180 text-soot' : ''
              }`}
            />
          </button>

          {statusDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="space-y-0.5">
                {[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'previous', label: 'Previous' },
                  { value: 'cancelled', label: 'Cancelled' },
                ].map((st) => {
                  const isSelected = filterStatus === st.value;
                  return (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => {
                        setFilterStatus(st.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                        isSelected ? 'bg-soot text-plaster font-semibold' : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{st.label}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Layout */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-4">Workspace & Location</div>
          <div className="col-span-2">Customer / Member</div>
          <div className="col-span-2">Booking Period</div>
          <div className="col-span-1">Plan & Seats</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-2 text-right">Status & Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-moss">
            <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No reservations match your filter criteria.</p>
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
                    alt={b.spaceName}
                    className="w-11 h-11 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-soot group-hover:text-emerald-900 transition-colors truncate">
                      {b.spaceName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5 font-medium">
                      <MapPin size={12} className="text-moss shrink-0" />
                      <span className="truncate">{b.spaceCity}</span>
                    </div>
                  </div>
                </div>

                {/* Customer / User */}
                <div className="col-span-2 mt-2 lg:mt-0 text-sm font-medium text-soot truncate">
                  {getUserName(b.userId)}
                </div>

                {/* Booking Period */}
                <div className="col-span-2 mt-2 lg:mt-0 text-xs text-soot font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-moss shrink-0" />
                    <span>{b.startDate}</span>
                  </div>
                  {b.startTime && (
                    <div className="text-[11px] text-soot font-medium mt-0.5 pl-4">{b.startTime} – {b.endTime}</div>
                  )}
                  {!b.startTime && b.startDate !== b.endDate && (
                    <div className="text-moss text-[11px] mt-0.5 pl-4">to {b.endDate}</div>
                  )}
                </div>

                {/* Plan & Seats */}
                <div className="col-span-1 mt-2 lg:mt-0 text-xs font-semibold text-soot capitalize">
                  {b.plan === 'hourly'
                    ? `${b.durationHours || 1}h Hourly`
                    : b.plan === 'monthly'
                    ? `${b.durationMonths || 1}mo Monthly`
                    : `${b.plan} pass`}
                  <span className="block text-[11px] font-normal text-moss">
                    {b.seats} seat{b.seats > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Revenue Amount */}
                <div className="col-span-1 mt-2 lg:mt-0 text-sm font-semibold text-soot">
                  SAR {getBookingPrice(b, spaces).toLocaleString()}
                </div>

                {/* Status & Actions */}
                <div className="col-span-2 mt-4 lg:mt-0 flex items-center justify-end gap-3">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      b.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                        : b.status === 'previous'
                        ? 'bg-soot/10 text-soot border border-soot/15'
                        : 'bg-red-500/15 text-red-700 border border-red-500/30'
                    }`}
                  >
                    {b.status}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                    }}
                    className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                    title="View Details"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soot/40 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="relative w-full max-w-xl bg-plaster-surface rounded-3xl border border-soot/15 shadow-2xl overflow-hidden divide-y divide-soot/10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 bg-plaster-dark/30 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedBooking.spaceImage}
                  alt={selectedBooking.spaceName}
                  className="w-14 h-14 rounded-2xl object-cover border border-soot/12 shadow-2xs"
                />
                <div>
                  <h3 className="text-xl font-normal text-soot font-serif-display">
                    {selectedBooking.spaceName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-moss mt-0.5 font-medium">
                    <MapPin size={13} />
                    <span>{selectedBooking.spaceCity}</span>
                    <span>·</span>
                    <span className="capitalize">{selectedBooking.type.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-full hover:bg-soot/10 text-moss hover:text-soot transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-6 text-sm text-soot">
              <div className="grid grid-cols-2 gap-4 bg-white/60 p-4 rounded-2xl border border-soot/8">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-moss block mb-0.5">
                    Customer / Member
                  </span>
                  <span className="font-semibold text-soot text-base">{getUserName(selectedBooking.userId)}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-moss block mb-0.5">
                    Booking ID
                  </span>
                  <span className="font-mono text-xs text-soot">{selectedBooking.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-white/60 rounded-xl border border-soot/8">
                  <span className="text-moss block mb-1">Start Date</span>
                  <span className="font-semibold text-soot text-sm">{selectedBooking.startDate}</span>
                </div>
                <div className="p-3 bg-white/60 rounded-xl border border-soot/8">
                  <span className="text-moss block mb-1">End Date</span>
                  <span className="font-semibold text-soot text-sm">{selectedBooking.endDate}</span>
                </div>
                <div className="p-3 bg-white/60 rounded-xl border border-soot/8">
                  <span className="text-moss block mb-1">Seats Reserved</span>
                  <span className="font-semibold text-soot text-sm">{selectedBooking.seats} Seats</span>
                </div>
              </div>

              {selectedBooking.startTime && (
                <div className="p-3 bg-white/60 rounded-xl border border-soot/8 text-xs">
                  <span className="text-moss block mb-1">Time Window & Duration</span>
                  <span className="font-semibold text-soot text-sm">
                    {selectedBooking.startTime} – {selectedBooking.endTime || ''} ({selectedBooking.durationHours || 1} Hours)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-soot text-plaster rounded-2xl">
                <div>
                  <span className="text-xs text-plaster/70 block">Total Revenue Collected</span>
                  <span className="text-2xl font-serif-display font-normal">
                    SAR {getBookingPrice(selectedBooking, spaces).toLocaleString()}
                  </span>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    selectedBooking.status === 'active'
                      ? 'bg-emerald-500 text-slate-950'
                      : selectedBooking.status === 'previous'
                      ? 'bg-plaster-dark text-soot'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-moss block mb-2">
                  Update Reservation Status
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'previous', 'cancelled'] as BookingStatus[]).map((status) => {
                    const isCurrent = selectedBooking.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleUpdateStatus(selectedBooking.id, status)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-soot text-plaster border-soot shadow-2xs'
                            : 'bg-white text-soot border-soot/12 hover:bg-soot/5'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-plaster-dark/20 text-right">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl bg-soot text-plaster text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
