'use client';

import { Building2, CalendarDays, Users, TrendingUp, ArrowRight, Plus, BarChart3, Eye, EyeOff, Check } from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, Space, getEffectiveSpacePrice } from '@/types/types';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AddWorkspace from './AddWorkspace';

export default function OrgDashboard() {
  const { currentUser, bookings, spaces, navigate } = useApp();
  const [addModalOpen, setAddModalOpen] = useState(false);
  if (!currentUser) return null;

  const companySpaces = spaces.filter((s: Space) => s.ownerId === currentUser.id);
  const publishedSpaces = companySpaces.filter((s: Space) => s.status === 'published' && s.isVisible);
  const companySpaceIds = companySpaces.map((s: Space) => s.id);
  const companyBookings = bookings.filter((b: Booking) => companySpaceIds.includes(b.spaceId));
  const activeCompanyBookings = companyBookings.filter((b: Booking) => b.status === 'active');
  const totalRevenue = companyBookings.filter((b: Booking) => b.status !== 'cancelled').reduce((sum: number, b: Booking) => sum + b.totalPrice, 0);
  const totalOccupied = companySpaces.reduce((sum: number, s: Space) => sum + (s.totalCapacity - s.availableCapacity), 0);
  const totalCapacity = companySpaces.reduce((sum: number, s: Space) => sum + s.totalCapacity, 0);
  const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const stats = [
    { label: 'Total workspaces', value: companySpaces.length, icon: Building2, color: 'text-eucalyptus', sub: `${publishedSpaces.length} active` },
    { label: 'Active bookings', value: activeCompanyBookings.length, icon: CalendarDays, color: 'text-moss', sub: 'at your spaces' },
    { label: 'Occupancy rate', value: `${occupancyPct}%`, icon: BarChart3, color: 'text-mist', sub: `${totalOccupied}/${totalCapacity} seats` },
    { label: 'Total revenue', value: `SAR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-eucalyptus', sub: 'all time' },
  ];

  const recentBookings = companyBookings.slice(0, 5);

  const hasSpaces = companySpaces.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-moss text-xs sm:text-sm font-normal mb-1">Company dashboard</p>
        <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
          {currentUser.orgName || currentUser.name}
        </h1>
        <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
          {currentUser.industry || 'Technology'} · {currentUser.orgSize || 0} employees
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-3xl p-5 border border-soot/8 shadow-sm">
            <div className={`${s.color} mb-3`}><s.icon size={18} /></div>
            <div className="text-xl font-semibold text-soot">{s.value}</div>
            <div className="text-xs text-moss mt-0.5">{s.label}</div>
            <div className="text-[10px] text-moss/60 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {!hasSpaces ? (
        /* Empty state */
        <div className="bg-white rounded-3xl border border-soot/8 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#DDE6DF]/50 flex items-center justify-center mx-auto mb-5 border border-soot/6">
            <Building2 size={28} className="text-moss" />
          </div>
          <h2 className="text-xl font-normal text-soot mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>
            No workspaces yet
          </h2>
          <p className="text-moss text-xs sm:text-sm mb-6 max-w-sm mx-auto font-normal">
            Manage your company workspaces and team reservations directly from the Workspaces tab.
          </p>
          <button
            type="button"
            onClick={() => navigate('company-workspaces')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] font-medium text-sm transition-all shadow-xs border border-soot/8 cursor-pointer"
          >
            <span>Go to Workspaces</span>
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Workspaces overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-soot">Your workspaces</h2>
              <button onClick={() => navigate('company-workspaces')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
                Manage all <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {companySpaces.slice(0, 4).map((space: Space) => {
                const occupancy = space.totalCapacity > 0
                  ? Math.round(((space.totalCapacity - space.availableCapacity) / space.totalCapacity) * 100)
                  : 0;
                const statusColor = space.status === 'published' && space.isVisible
                  ? 'bg-eucalyptus/15 text-moss'
                  : space.status === 'draft'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-soot/8 text-moss';
                const statusLabel = space.status === 'draft' ? 'Draft' : space.isVisible ? 'Active' : 'Hidden';
                return (
                  <div key={space.id} className="bg-white rounded-2xl border border-soot/8 p-4">
                    <div className="flex items-start gap-3">
                      <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-soot text-sm truncate">{space.name}</div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor}`}>{statusLabel}</span>
                        </div>
                        <div className="text-xs text-moss mb-2">{space.city} · {space.type.replace('-', ' ')}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-soot/8 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-eucalyptus transition-all"
                              style={{ width: `${occupancy}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-moss shrink-0">{occupancy}% full</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {(() => {
                          const pInfo = getEffectiveSpacePrice(currentUser, space, 'daily');
                          if (pInfo.isCovered) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eucalyptus/30 text-soot font-semibold text-[11px] border border-eucalyptus/40 shadow-2xs">
                                <Check size={11} className="text-moss shrink-0" />
                                <span>Corporate Pass</span>
                              </span>
                            );
                          }
                          if (pInfo.hasDiscount) {
                            return (
                              <div>
                                <div className="text-xs font-semibold text-soot">SAR {pInfo.effectivePrice}</div>
                                <div className="text-[9px] text-amber-900 font-semibold">{pInfo.discountPercentage}% Discount</div>
                              </div>
                            );
                          }
                          return (
                            <>
                              <div className="text-xs font-medium text-soot">SAR {space.pricing.daily}</div>
                              <div className="text-[10px] text-moss">/day</div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-soot">Recent bookings</h2>
              <button onClick={() => navigate('company-bookings')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>
            {recentBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-soot/8 p-8 text-center">
                <CalendarDays size={24} className="text-moss mx-auto mb-3" />
                <div className="text-sm text-moss">No bookings yet at your spaces</div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-soot/8 divide-y divide-soot/5">
                {recentBookings.map((b: Booking) => (
                  <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-soot truncate">{b.spaceName}</div>
                      <div className="text-xs text-moss">{b.seats} seat{b.seats > 1 ? 's' : ''} · {b.plan} · {b.startDate}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-soot">SAR {b.totalPrice.toLocaleString()}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        b.status === 'active' ? 'bg-eucalyptus/15 text-moss'
                        : b.status === 'cancelled' ? 'bg-red-50 text-red-500'
                        : 'bg-soot/8 text-moss'
                      }`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Add workspace', desc: 'List a new coworking space', action: () => setAddModalOpen(true), icon: Plus },
          { label: 'View bookings', desc: 'Manage customer reservations', action: () => navigate('company-bookings'), icon: CalendarDays },
          { label: 'Manage team', desc: 'Add and organize team members', action: () => navigate('company-team'), icon: Users },
        ].map(a => (
          <button
            key={a.label}
            onClick={a.action}
            className="bg-white rounded-2xl border border-soot/8 p-5 text-left hover:border-eucalyptus/40 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-eucalyptus/15 flex items-center justify-center mb-3 group-hover:bg-eucalyptus/25 transition-colors">
              <a.icon size={16} className="text-moss" />
            </div>
            <div className="font-semibold text-soot text-sm">{a.label}</div>
            <div className="text-xs text-moss mt-0.5">{a.desc}</div>
          </button>
        ))}
      </div>

      {/* Add Workspace Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Workspace"
        subtitle="List a new coworking space or office for your organization."
        size="2xl"
      >
        <AddWorkspace onCloseModal={() => setAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
