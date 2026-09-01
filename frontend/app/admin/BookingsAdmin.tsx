'use client';
import { useState } from 'react';
import { Search, ChevronDown, MapPin, Calendar, Users } from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, BookingStatus } from '@/types/types';
import Modal from '@/components/ui/Modal';

export default function BookingsAdmin() {
  const { bookings, users, updateBookingStatus } = useApp();
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const getUserName = (userId: string) => {
    const u = users.find(u => u.id === userId);
    if (!u) return userId;
    return u.role === 'organization' ? (u.orgName || u.name) : u.name;
  };

  const filtered = bookings.filter(b => {
    if (query && !b.spaceName.toLowerCase().includes(query.toLowerCase()) && !b.spaceCity.toLowerCase().includes(query.toLowerCase()) && !getUserName(b.userId).toLowerCase().includes(query.toLowerCase())) return false;
    if (filterStatus && b.status !== filterStatus) return false;
    if (filterPlan && b.plan !== filterPlan) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusColor = (s: BookingStatus) => {
    if (s === 'active') return 'bg-eucalyptus/15 text-moss';
    if (s === 'previous') return 'bg-mist/30 text-soot';
    return 'bg-red-50 text-red-500';
  };

  const totalRevenue = filtered.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Manage Bookings</h1>
        <p className="text-moss text-sm mt-1">{bookings.length} total · SAR {totalRevenue.toLocaleString()} revenue</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active', count: bookings.filter(b => b.status === 'active').length, color: 'text-moss' },
          { label: 'Previous', count: bookings.filter(b => b.status === 'previous').length, color: 'text-soot' },
          { label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-soot/8 p-4 text-center">
            <div className={`text-xl font-semibold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-moss mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by space, city, or user..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pl-3 pr-7 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none appearance-none cursor-pointer">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="previous">Previous</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="pl-3 pr-7 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none appearance-none cursor-pointer">
            <option value="">All plans</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-soot/8 overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 border-b border-soot/8 text-xs font-medium text-moss uppercase tracking-wide">
          <div className="col-span-3">Space</div>
          <div className="col-span-2">User</div>
          <div className="col-span-2">Period</div>
          <div className="col-span-1">Plan</div>
          <div className="col-span-1">Seats</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        <div className="divide-y divide-soot/5">
          {filtered.map(b => (
            <div
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              className="px-5 py-4 cursor-pointer hover:bg-soot/2 transition-colors"
            >
              {/* Mobile */}
              <div className="lg:hidden flex items-start gap-3">
                <img src={b.spaceImage} alt={b.spaceName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-soot text-sm">{b.spaceName}</div>
                      <div className="text-xs text-moss">{getUserName(b.userId)} · {b.plan}</div>
                    </div>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full capitalize ${statusColor(b.status)}`}>{b.status}</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-moss">
                    <span>{b.startDate}</span>
                    <span>{b.seats} seats</span>
                    <span className="font-medium text-soot">SAR {b.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden lg:grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 flex items-center gap-2.5">
                  <img src={b.spaceImage} alt={b.spaceName} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-soot text-sm truncate">{b.spaceName}</div>
                    <div className="flex items-center gap-1 text-xs text-moss">
                      <MapPin size={9} />{b.spaceCity}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-soot truncate">{getUserName(b.userId)}</div>
                <div className="col-span-2 text-xs text-moss">{b.startDate}<br />{b.endDate !== b.startDate ? `→ ${b.endDate}` : ''}</div>
                <div className="col-span-1 text-xs capitalize text-moss">{b.plan}</div>
                <div className="col-span-1 flex items-center gap-1 text-xs text-moss"><Users size={10} />{b.seats}</div>
                <div className="col-span-1 font-medium text-soot text-sm">SAR {b.totalPrice.toLocaleString()}</div>
                <div className="col-span-2 flex justify-end">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-moss text-sm">No bookings found.</div>
        )}
      </div>

      {/* Booking details modal */}
      <Modal open={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details" size="md">
        {selectedBooking && (
          <div className="p-6">
            <div className="flex items-start gap-3 mb-5 pb-4 border-b border-soot/8">
              <img src={selectedBooking.spaceImage} alt={selectedBooking.spaceName} className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <div className="font-semibold text-soot">{selectedBooking.spaceName}</div>
                <div className="flex items-center gap-1 text-xs text-moss">
                  <MapPin size={10} />{selectedBooking.spaceCity}
                </div>
                <div className="text-xs text-moss mt-0.5">User: {getUserName(selectedBooking.userId)}</div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm mb-5">
              {[
                { l: 'Booking ID', v: selectedBooking.id.slice(-10).toUpperCase() },
                { l: 'Type', v: selectedBooking.type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                { l: 'Plan', v: selectedBooking.plan.charAt(0).toUpperCase() + selectedBooking.plan.slice(1) },
                { l: 'Period', v: `${selectedBooking.startDate} → ${selectedBooking.endDate}` },
                { l: 'Seats', v: selectedBooking.seats.toString() },
                { l: 'Booked on', v: selectedBooking.createdAt },
                { l: 'Total', v: `SAR ${selectedBooking.totalPrice.toLocaleString()}` },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-moss">{r.l}</span>
                  <span className="text-soot font-medium">{r.v}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-moss mb-2">Update status</label>
              <div className="flex gap-2">
                {(['active', 'previous', 'cancelled'] as BookingStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => { updateBookingStatus(selectedBooking.id, s); setSelectedBooking(prev => prev ? { ...prev, status: s } : null); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${selectedBooking.status === s ? 'bg-soot text-plaster' : 'border border-soot/12 text-moss hover:border-soot/30'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
