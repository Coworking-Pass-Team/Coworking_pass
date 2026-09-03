'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, BookingStatus, getHourlyPriceForDuration, getBookingPrice } from '@/types/types';
import Modal from '@/components/ui/Modal';

export default function MyBookings() {
  const { bookings, spaces, currentUser, navigate, cancelBooking, nav, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<BookingStatus>((nav.params?.tab as BookingStatus) || 'active');
  const [query, setQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModal, setCancelModal] = useState<Booking | null>(null);

  if (!currentUser) return null;

  const myBookings = bookings.filter(b => b.userId === currentUser.id);

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
    .reduce((sum, b) => sum + getBookingPrice(b), 0);

  const handleCancelConfirm = () => {
    if (!cancelModal) return;
    cancelBooking(cancelModal.id);
    setCancelModal(null);
    if (selectedBooking && selectedBooking.id === cancelModal.id) {
      setSelectedBooking(null);
    }
    showToast('Booking cancelled successfully.', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            Personal Reservations & Pass Activity
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            My Bookings
          </h1>
          <p className="text-moss text-sm mt-1">Manage and view your active and past workspace reservations.</p>
        </div>
      </div>

      {/* Admin-Matching Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Bookings',
            count: activeCount,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: CalendarDays,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Previous Visits',
            count: previousCount,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Clock,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Cancelled',
            count: cancelledCount,
            badge: 'bg-red-500/15 text-red-700 border border-red-500/30',
            icon: Ban,
            iconBg: 'bg-red-500/15 text-red-700 border-red-500/30',
          },
          {
            label: 'Total Spend',
            count: `SAR ${totalSpend.toLocaleString()}`,
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
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by workspace name or city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-plaster-dark/30 p-1 rounded-xl border border-soot/10 shrink-0 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'active', label: 'Active', count: activeCount },
            { id: 'previous', label: 'Previous', count: previousCount },
            { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
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
          <div className="col-span-5">Workspace & Location</div>
          <div className="col-span-3">Booking Period</div>
          <div className="col-span-2">Plan & Seats</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-moss">
            <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No reservations found in this section.</p>
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

                {/* Booking Period */}
                <div className="col-span-3 mt-2 lg:mt-0 text-xs text-soot font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-moss shrink-0" />
                    <span>{b.startDate}</span>
                  </div>
                  {b.startDate !== b.endDate && (
                    <div className="text-moss text-[11px] mt-0.5 pl-4">to {b.endDate}</div>
                  )}
                </div>

                {/* Plan & Seats */}
                <div className="col-span-2 mt-2 lg:mt-0 text-xs font-semibold text-soot capitalize">
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
                  SAR {getBookingPrice(b).toLocaleString()}
                </div>

                {/* Actions */}
                <div className="col-span-1 mt-4 lg:mt-0 flex items-center justify-end gap-2">
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
                  {b.status === 'active' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelModal(b);
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                      title="Cancel Reservation"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin-Matching Booking Detail Drawer Modal */}
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
                    Account Name
                  </span>
                  <span className="font-semibold text-soot text-base">{currentUser.name}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-moss block mb-0.5">
                    Booking ID
                  </span>
                  <span className="font-mono text-xs text-soot">{selectedBooking.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white/60 rounded-xl border border-soot/8">
                  <span className="text-moss block mb-1">Plan / Duration</span>
                  <span className="font-semibold text-soot text-xs capitalize">
                    {selectedBooking.plan === 'hourly'
                      ? `${selectedBooking.durationHours || 1}h Hourly`
                      : selectedBooking.plan === 'monthly'
                      ? `${selectedBooking.durationMonths || 1} Months`
                      : `${selectedBooking.plan} Pass`}
                  </span>
                </div>
                <div className="p-3 bg-white/60 rounded-xl border border-soot/8">
                  <span className="text-moss block mb-1">Start Date</span>
                  <span className="font-semibold text-soot text-xs">{selectedBooking.startDate}</span>
                </div>
                <div className="p-3 bg-white/60 rounded-xl border border-soot/8">
                  <span className="text-moss block mb-1">
                    {selectedBooking.startTime ? 'Time Window' : 'End Date'}
                  </span>
                  <span className="font-semibold text-soot text-xs">
                    {selectedBooking.startTime
                      ? `${selectedBooking.startTime} – ${selectedBooking.endTime}`
                      : selectedBooking.endDate}
                  </span>
                </div>
                <div className="p-3 bg-white/60 rounded-xl border border-soot/8">
                  <span className="text-moss block mb-1">Seats Reserved</span>
                  <span className="font-semibold text-soot text-xs">{selectedBooking.seats} Seats</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-soot text-plaster rounded-2xl">
                <div>
                  <span className="text-xs text-plaster/70 block">Total Booking Fee</span>
                  <span className="text-2xl font-serif-display font-normal">
                    SAR {getBookingPrice(selectedBooking).toLocaleString()}
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
            </div>

            {/* Footer */}
            <div className="p-4 bg-plaster-dark/20 flex items-center justify-between">
              {selectedBooking.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => {
                    setCancelModal(selectedBooking);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel Booking
                </button>
              ) : <div />}
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

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <Modal
          open={!!cancelModal}
          onClose={() => setCancelModal(null)}
          title="Cancel Reservation"
          size="sm"
          footer={
            <>
              <button type="button" onClick={() => setCancelModal(null)} className="btn-secondary">
                Keep Booking
              </button>
              <button type="button" onClick={handleCancelConfirm} className="btn-danger">
                Confirm Cancel
              </button>
            </>
          }
        >
          <div className="text-sm text-soot space-y-2 py-2">
            <p>
              Are you sure you want to cancel your reservation for <span className="font-semibold">{cancelModal.spaceName}</span>?
            </p>
            <p className="text-xs text-moss">The reserved desk capacity will be released back to the workspace catalog.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
