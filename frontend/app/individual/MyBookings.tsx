'use client';

import React, { useState } from 'react';
import { MapPin, Calendar, Users, Check, X, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, BookingStatus } from '@/types/types';
import Modal from '@/components/ui/Modal';

const TABS: { label: string; status: BookingStatus }[] = [
  { label: 'Active', status: 'active' },
  { label: 'Previous', status: 'previous' },
  { label: 'Cancelled', status: 'cancelled' },
];

export default function MyBookings() {
  const { bookings, currentUser, navigate, cancelBooking, nav } = useApp();
  const [activeTab, setActiveTab] = useState<BookingStatus>((nav.params?.tab as BookingStatus) || 'active');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);

  if (!currentUser) return null;

  const myBookings = bookings.filter(b => b.userId === currentUser.id);
  const filtered = myBookings.filter(b => b.status === activeTab);

  const tabCounts = {
    active: myBookings.filter(b => b.status === 'active').length,
    previous: myBookings.filter(b => b.status === 'previous').length,
    cancelled: myBookings.filter(b => b.status === 'cancelled').length,
  };

  const handleCancel = () => {
    if (!selectedBooking) return;
    cancelBooking(selectedBooking.id);
    setCancelModal(false);
    setDetailsModal(false);
    setSelectedBooking(null);
  };

  const statusColor = (s: BookingStatus) => {
    if (s === 'active') return 'bg-eucalyptus/20 text-moss border border-eucalyptus/30';
    if (s === 'previous') return 'bg-mist/30 text-soot border border-mist/50';
    return 'bg-red-50 text-red-500 border border-red-200';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
          My Bookings
        </h1>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-2 bg-white rounded-full p-1.5 border border-soot/8 shadow-xs mb-8">
        {TABS.map(tab => {
          const isSelected = activeTab === tab.status;
          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/6'
                  : 'text-moss hover:text-soot hover:bg-soot/5'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isSelected ? 'bg-white/60 text-soot' : 'bg-soot/5 text-moss'
                }`}
              >
                {tabCounts[tab.status]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings List or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-soot/8 p-16 text-center max-w-4xl shadow-sm">
          <Calendar size={38} className="text-moss stroke-[1.5] mx-auto mb-4" />
          <h3 className="font-medium text-soot text-lg mb-1">
            No {activeTab} bookings
          </h3>
          <p className="text-sm text-moss mb-6 font-normal">
            {activeTab === 'active'
              ? "You don't have any active bookings yet."
              : `No ${activeTab} bookings found in your account history.`}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => navigate('browse')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#DDE6DF] text-soot text-sm font-medium hover:bg-[#D0DDD3] transition-all shadow-xs border border-soot/8 cursor-pointer"
            >
              Browse spaces
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {filtered.map(booking => (
            <div
              key={booking.id}
              className="bg-white rounded-3xl border border-soot/8 p-5 shadow-sm hover:shadow-md hover:border-eucalyptus/40 transition-all cursor-pointer overflow-hidden"
              onClick={() => {
                setSelectedBooking(booking);
                setDetailsModal(true);
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={booking.spaceImage}
                    alt={booking.spaceName}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-soot text-lg truncate">{booking.spaceName}</h3>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-moss mt-1">
                      <MapPin size={12} />
                      <span>{booking.spaceCity}</span>
                      <span>•</span>
                      <span className="capitalize">{booking.type.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-moss mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{booking.startDate}{booking.endDate !== booking.startDate ? ` → ${booking.endDate}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        <span>{booking.seats} seat{booking.seats > 1 ? 's' : ''}</span>
                      </div>
                      <span className="capitalize bg-soot/5 text-soot/80 px-2 py-0.5 rounded-md font-medium">
                        {booking.plan} pass
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-soot/5">
                  <div className="text-right">
                    <span className="text-xs text-moss block">Total Paid</span>
                    <span className="font-semibold text-soot text-lg">SAR {booking.totalPrice.toLocaleString()}</span>
                  </div>
                  {booking.status === 'active' && (
                    <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setCancelModal(true);
                        }}
                        className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        open={detailsModal}
        onClose={() => {
          setDetailsModal(false);
          setSelectedBooking(null);
        }}
        title="Booking Details"
        size="md"
      >
        {selectedBooking && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-soot/8">
              <img
                src={selectedBooking.spaceImage}
                alt={selectedBooking.spaceName}
                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-soot text-lg leading-tight truncate">
                  {selectedBooking.spaceName}
                </div>
                <div className="flex items-center gap-1 text-xs text-moss mt-1">
                  <MapPin size={12} />
                  <span>{selectedBooking.spaceCity}</span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: 'Booking Reference', value: `#${selectedBooking.id.slice(-8).toUpperCase()}` },
                { label: 'Space Type', value: selectedBooking.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                { label: 'Plan', value: selectedBooking.plan.charAt(0).toUpperCase() + selectedBooking.plan.slice(1) + ' Pass' },
                { label: 'Start Date', value: selectedBooking.startDate },
                { label: 'End Date', value: selectedBooking.endDate },
                { label: 'Seats Reserved', value: `${selectedBooking.seats} seat${selectedBooking.seats > 1 ? 's' : ''}` },
                { label: 'Booked On', value: selectedBooking.createdAt },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center py-1">
                  <span className="text-moss">{r.label}</span>
                  <span className="text-soot font-medium">{r.value}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-soot/8 flex justify-between items-center font-semibold text-base">
                <span className="text-soot">Total Paid (incl. VAT)</span>
                <span className="text-soot">SAR {selectedBooking.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {selectedBooking.status === 'active' && (
              <div className="flex gap-3 pt-4 border-t border-soot/10">
                <button
                  onClick={() => {
                    setDetailsModal(false);
                    setCancelModal(true);
                  }}
                  className="btn-danger flex-1"
                >
                  Cancel booking
                </button>
                <button
                  onClick={() => {
                    setDetailsModal(false);
                    navigate('space-details', { spaceId: selectedBooking.spaceId });
                  }}
                  className="btn-primary flex-1"
                >
                  View space details
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancel Booking"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setCancelModal(false)}
              className="btn-secondary flex-1"
            >
              Keep booking
            </button>
            <button
              onClick={handleCancel}
              className="btn-danger flex-1"
            >
              Yes, cancel
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3.5 py-2">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-soot font-medium mb-1">Are you sure you want to cancel?</p>
            <p className="text-xs text-moss leading-relaxed font-normal">
              Your reservation at <span className="text-soot font-medium">{selectedBooking?.spaceName}</span> will be cancelled. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
