'use client';

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
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, BookingStatus, Space, User, getBookingPrice } from '@/types/types';

export default function CompanyBookings() {
  const { currentUser, bookings, spaces, users, cancelBooking, showToast } = useApp();
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
    .reduce((sum: number, b: Booking) => sum + getBookingPrice(b, spaces), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            Corporate Reservations & Revenue Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            Company Bookings
          </h1>
          <p className="text-moss text-sm mt-1">
            {companyBookings.length} total bookings across corporate venues.
          </p>
        </div>

        <button type="button" className="btn-secondary">
          <Download size={15} />
          <span>Export Data</span>
        </button>
      </div>

      {/* Admin-Matching Elevated Stats Cards */}
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
            badge: 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
            icon: Clock,
            iconBg: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
          },
          {
            label: 'Cancelled',
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

      {/* Admin-Matching Search & Custom Dropdown Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs relative z-30">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by space name, city, or user..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Custom Status Dropdown */}
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
                  { value: 'active', label: 'Active Bookings' },
                  { value: 'previous', label: 'Completed Visits' },
                  { value: 'cancelled', label: 'Cancelled' },
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
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin-Matching Table Layout */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-4">Workspace & Location</div>
          <div className="col-span-2">Customer / User</div>
          <div className="col-span-2">Booking Period</div>
          <div className="col-span-1">Seats</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-2 text-right">Status & Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-moss">
            <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No bookings match your filter criteria.</p>
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

                {/* User */}
                <div className="col-span-2 mt-2 lg:mt-0 text-sm font-medium text-soot truncate">
                  {getUserName(b.userId)}
                </div>

                {/* Booking Period */}
                <div className="col-span-2 mt-2 lg:mt-0 text-xs text-soot font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-moss shrink-0" />
                    <span>{b.startDate}</span>
                  </div>
                  {b.startDate !== b.endDate && (
                    <div className="text-moss text-[11px] mt-0.5 pl-4">to {b.endDate}</div>
                  )}
                </div>

                {/* Seats */}
                <div className="col-span-1 mt-2 lg:mt-0 text-xs font-semibold text-soot">
                  {b.seats} seat{b.seats > 1 ? 's' : ''}
                </div>

                {/* Amount */}
                <div className="col-span-1 mt-2 lg:mt-0 text-sm font-semibold text-soot">
                  SAR {getBookingPrice(b, spaces).toLocaleString()}
                </div>

                {/* Actions */}
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
    </div>
  );
}
