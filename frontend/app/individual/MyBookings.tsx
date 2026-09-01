'use client';
import { useState } from 'react';
import { MapPin, Calendar, Users, ArrowLeft, Check, X, Edit2, AlertCircle } from 'lucide-react';
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
  const [cancellingId, setCancellingId] = useState('');

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
    if (s === 'active') return 'bg-eucalyptus/15 text-moss';
    if (s === 'previous') return 'bg-mist/40 text-soot';
    return 'bg-red-50 text-red-500';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>My Bookings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-soot/8 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.status ? 'bg-soot text-plaster' : 'text-moss hover:text-soot'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.status ? 'bg-white/20 text-white' : 'bg-soot/8 text-moss'}`}>
              {tabCounts[tab.status]}
            </span>
          </button>
        ))}
      </div>

      {/* Booking list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-soot/8 p-12 text-center">
          <Calendar size={32} className="text-moss mx-auto mb-3" />
          <div className="font-medium text-soot mb-1">No {activeTab} bookings</div>
          <div className="text-sm text-moss mb-4">
            {activeTab === 'active' ? "You don't have any active bookings yet." : `No ${activeTab} bookings to show.`}
          </div>
          {activeTab === 'active' && (
            <button onClick={() => navigate('browse')} className="px-4 py-2 rounded-xl bg-eucalyptus text-soot text-sm font-medium">
              Browse spaces
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-soot/8 overflow-hidden hover:border-eucalyptus/30 transition-colors cursor-pointer"
              onClick={() => { setSelectedBooking(booking); setDetailsModal(true); }}
            >
              <div className="flex">
                <img src={booking.spaceImage} alt={booking.spaceName} className="w-28 object-cover hidden sm:block" />
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-soot">{booking.spaceName}</h3>
                      <div className="flex items-center gap-1 text-xs text-moss mt-0.5">
                        <MapPin size={10} />
                        {booking.spaceCity}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-moss">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} />
                      <span>{booking.startDate}{booking.endDate !== booking.startDate ? ` → ${booking.endDate}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={11} />
                      <span>{booking.seats} seat{booking.seats > 1 ? 's' : ''}</span>
                    </div>
                    <span className="capitalize bg-soot/5 px-2 py-0.5 rounded-full">{booking.plan}</span>
                    <span className="capitalize">{booking.type.replace('-', ' ')}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-soot/5">
                    <span className="font-semibold text-soot">SAR {booking.totalPrice.toLocaleString()}</span>
                    {booking.status === 'active' && (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setSelectedBooking(booking); setCancelModal(true); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details modal */}
      <Modal open={detailsModal} onClose={() => { setDetailsModal(false); setSelectedBooking(null); }} title="Booking Details" size="md">
        {selectedBooking && (
          <div className="p-6">
            <div className="flex items-start gap-3 mb-5 pb-4 border-b border-soot/8">
              <img src={selectedBooking.spaceImage} alt={selectedBooking.spaceName} className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <div className="font-semibold text-soot">{selectedBooking.spaceName}</div>
                <div className="flex items-center gap-1 text-xs text-moss mt-0.5">
                  <MapPin size={10} />
                  {selectedBooking.spaceCity}
                </div>
                <div className="mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Booking ID', value: selectedBooking.id.slice(-8).toUpperCase() },
                { label: 'Type', value: selectedBooking.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                { label: 'Plan', value: selectedBooking.plan.charAt(0).toUpperCase() + selectedBooking.plan.slice(1) },
                { label: 'Start date', value: selectedBooking.startDate },
                { label: 'End date', value: selectedBooking.endDate },
                { label: 'Seats', value: selectedBooking.seats.toString() },
                { label: 'Booked on', value: selectedBooking.createdAt },
              ].map(r => (
                <div key={r.label} className="flex justify-between gap-4">
                  <span className="text-moss">{r.label}</span>
                  <span className="text-soot font-medium text-right">{r.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-soot/8 flex justify-between font-semibold">
                <span className="text-soot">Total paid</span>
                <span className="text-soot">SAR {selectedBooking.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {selectedBooking.status === 'active' && (
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setDetailsModal(false); setCancelModal(true); }}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <X size={14} />
                  Cancel booking
                </button>
                <button
                  onClick={() => { setDetailsModal(false); navigate('space-details', { spaceId: selectedBooking.spaceId }); }}
                  className="flex-1 py-2.5 rounded-xl bg-soot text-plaster text-sm font-medium flex items-center justify-center gap-2"
                >
                  <MapPin size={14} />
                  View space
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel confirmation modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Booking" size="sm">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-moss leading-relaxed">
                Are you sure you want to cancel your booking at <strong className="text-soot">{selectedBooking?.spaceName}</strong>? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCancelModal(false)} className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot text-sm font-medium">
              Keep booking
            </button>
            <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">
              Yes, cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
