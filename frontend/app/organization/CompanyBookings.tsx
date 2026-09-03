'use client';

import { useState } from 'react';
import { Search, CalendarDays, Download, X, MapPin, User as UserIcon } from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, Space, User } from '@/types';
import Modal from '@/components/Modal';

const STATUSES = ['All', 'active', 'previous', 'cancelled'];

export default function CompanyBookings() {
  const { currentUser, bookings, spaces, users, cancelBooking, showToast } = useApp();
  if (!currentUser) return null;

  const companySpaceIds = spaces.filter((s: Space) => s.ownerId === currentUser.id).map((s: Space) => s.id);
  const companyBookings = bookings.filter((b: Booking) => companySpaceIds.includes(b.spaceId));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [spaceFilter, setSpaceFilter] = useState('All');
  const [detailsModal, setDetailsModal] = useState<Booking | null>(null);
  const [cancelModal, setCancelModal] = useState<Booking | null>(null);

  const companySpaceNames: string[] = ['All', ...Array.from(new Set(companyBookings.map((b: Booking) => b.spaceName)))];

  const filtered = companyBookings.filter((b: Booking) => {
    const matchSearch = !search
      || b.id.toLowerCase().includes(search.toLowerCase())
      || b.spaceName.toLowerCase().includes(search.toLowerCase())
      || b.spaceCity.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchSpace = spaceFilter === 'All' || b.spaceName === spaceFilter;
    return matchSearch && matchStatus && matchSpace;
  }).sort((a: Booking, b: Booking) => b.createdAt.localeCompare(a.createdAt));

  const getUserName = (userId: string) => {
    const u = users.find((u: User) => u.id === userId);
    return u ? u.name : userId;
  };

  const getUserType = (userId: string) => {
    const u = users.find((u: User) => u.id === userId);
    if (!u) return 'Unknown';
    return u.role === 'organization' ? u.orgName || 'Organization' : 'Individual';
  };

  const handleCancel = (b: Booking) => {
    cancelBooking(b.id);
    setCancelModal(null);
    showToast('Booking cancelled.', 'success');
  };

  const totalRevenue = filtered.filter((b: Booking) => b.status !== 'cancelled').reduce((sum: number, b: Booking) => sum + b.totalPrice, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Bookings</h1>
          <p className="text-moss text-sm mt-1">{filtered.length} bookings · SAR {totalRevenue.toLocaleString()} revenue</p>
        </div>
        <button className="btn-secondary">
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-soot/8 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-40 px-3 py-2 rounded-xl border border-soot/10 bg-plaster">
          <Search size={14} className="text-moss shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." className="flex-1 bg-transparent text-soot text-sm outline-none" />
        </div>
        <select value={spaceFilter} onChange={e => setSpaceFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-soot/10 bg-plaster text-soot text-sm outline-none">
          {companySpaceNames.map((s: string) => <option key={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-soot/10 bg-plaster text-soot text-sm outline-none capitalize">
          {STATUSES.map(s => <option key={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-soot/8 p-16 text-center">
          <CalendarDays size={32} className="text-moss mx-auto mb-4" />
          <h3 className="font-semibold text-soot mb-2">No bookings found</h3>
          <p className="text-sm text-moss">
            {companySpaceIds.length === 0 ? 'Add workspaces to start receiving bookings.' : 'No bookings match the current filters.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((b: Booking) => {
              const statusCls = b.status === 'active' ? 'bg-eucalyptus/15 text-moss' : b.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-soot/8 text-moss';
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-soot/8 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-soot text-sm">{b.spaceName}</div>
                      <div className="flex items-center gap-1 text-xs text-moss mt-0.5"><MapPin size={10} />{b.spaceCity}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusCls}`}>{b.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-moss mb-3">
                    <span className="flex items-center gap-1"><UserIcon size={10} />{getUserName(b.userId)}</span>
                    <span>{b.seats} seat{b.seats > 1 ? 's' : ''}</span>
                    <span className="capitalize">{b.plan}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-soot text-sm">SAR {b.totalPrice.toLocaleString()}</div>
                    <div className="flex gap-2">
                      <button onClick={() => setDetailsModal(b)} className="text-xs text-moss hover:text-soot font-medium">Details</button>
                      {b.status === 'active' && (
                        <button onClick={() => setCancelModal(b)} className="text-xs text-red-500 hover:text-red-600 font-medium">Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-soot/8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-soot/8 bg-plaster/50">
                    {['Booking ID', 'Customer', 'Type', 'Workspace', 'Plan', 'Dates', 'Seats', 'Total', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-moss whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-soot/5">
                  {filtered.map((b: Booking) => {
                    const statusCls = b.status === 'active' ? 'bg-eucalyptus/15 text-moss' : b.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-soot/8 text-moss';
                    return (
                      <tr key={b.id} className="hover:bg-plaster/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-moss">{b.id}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-soot">{getUserName(b.userId)}</div>
                          <div className="text-[10px] text-moss">{getUserType(b.userId)}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-moss capitalize">{b.type.replace('-', ' ')}</td>
                        <td className="px-4 py-3 text-sm text-soot">{b.spaceName}</td>
                        <td className="px-4 py-3 text-xs text-moss capitalize">{b.plan}</td>
                        <td className="px-4 py-3 text-xs text-moss whitespace-nowrap">{b.startDate}{b.endDate !== b.startDate ? ` → ${b.endDate}` : ''}</td>
                        <td className="px-4 py-3 text-sm text-soot text-center">{b.seats}</td>
                        <td className="px-4 py-3 font-medium text-soot whitespace-nowrap">SAR {b.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusCls}`}>{b.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setDetailsModal(b)} className="text-xs text-moss hover:text-soot font-medium transition-colors">Details</button>
                            {b.status === 'active' && (
                              <button onClick={() => setCancelModal(b)} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Details modal */}
      <Modal open={!!detailsModal} onClose={() => setDetailsModal(null)} title="Booking details" size="sm">
        {detailsModal && (
          <div className="p-6 space-y-3 text-sm">
            {[
              { l: 'Booking ID', v: detailsModal.id },
              { l: 'Customer', v: getUserName(detailsModal.userId) },
              { l: 'Customer type', v: getUserType(detailsModal.userId) },
              { l: 'Workspace', v: detailsModal.spaceName },
              { l: 'City', v: detailsModal.spaceCity },
              { l: 'Type', v: detailsModal.type.replace('-', ' ') },
              { l: 'Plan', v: detailsModal.plan },
              { l: 'Start date', v: detailsModal.startDate },
              { l: 'End date', v: detailsModal.endDate },
              { l: 'Seats', v: String(detailsModal.seats) },
              { l: 'Total amount', v: `SAR ${detailsModal.totalPrice.toLocaleString()}` },
              { l: 'Status', v: detailsModal.status },
              { l: 'Created', v: detailsModal.createdAt },
            ].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-soot/5 last:border-0">
                <span className="text-moss capitalize">{r.l}</span>
                <span className="text-soot font-medium capitalize">{r.v}</span>
              </div>
            ))}
            {detailsModal.status === 'active' && (
              <button onClick={() => { setCancelModal(detailsModal); setDetailsModal(null); }} className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium mt-2">
                Cancel booking
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel confirmation */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel booking" size="sm">
        {cancelModal && (
          <div className="p-6">
            <p className="text-sm text-moss mb-1">Cancel booking <span className="font-semibold text-soot">{cancelModal.id}</span>?</p>
            <p className="text-xs text-moss/70 mb-6">This will restore {cancelModal.seats} seat{cancelModal.seats > 1 ? 's' : ''} to the workspace availability.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot text-sm font-medium">Keep</button>
              <button onClick={() => handleCancel(cancelModal)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">Cancel booking</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
