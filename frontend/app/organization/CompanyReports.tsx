'use client';

import { useState } from 'react';
import { TrendingUp, CalendarDays, Users, Building2, BarChart3 } from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, Space } from '@/types';

const PERIODS = ['Today', 'This week', 'This month', 'This year'];

function BarChart({ data, color = '#98AA9D' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="mt-4">
      <div className="flex items-end gap-3 h-36 border-b border-soot/10">
        {data.map(d => {
          const barH = d.value === 0 ? 4 : Math.max((d.value / max) * 100, 6);
          return (
            <div key={d.label} className="flex-1 h-full min-w-0 flex flex-col items-center justify-end gap-1">
              <div className="text-[10px] text-moss font-medium">{d.value.toLocaleString()}</div>
              <div className="w-full max-w-10 rounded-t-lg transition-all duration-500" style={{ height: `${barH}%`, backgroundColor: color, opacity: d.value === 0 ? 0.2 : 1 }} title={`${d.label}: ${d.value}`} />
              <div className="text-[10px] text-moss truncate w-full text-center mt-1">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompanyReports() {
  const { currentUser, bookings, spaces, users } = useApp();
  if (!currentUser) return null;

  const [period, setPeriod] = useState('This month');

  const companySpaces = spaces.filter((s: Space) => s.ownerId === currentUser.id);
  const companySpaceIds = companySpaces.map((s: Space) => s.id);
  const companyBookings = bookings.filter((b: Booking) => companySpaceIds.includes(b.spaceId));
  const activeBookings = companyBookings.filter((b: Booking) => b.status === 'active');
  const cancelledBookings = companyBookings.filter((b: Booking) => b.status === 'cancelled');
  const totalRevenue = companyBookings.filter((b: Booking) => b.status !== 'cancelled').reduce((sum: number, b: Booking) => sum + b.totalPrice, 0);

  const multiplier = period === 'Today' ? 0.03 : period === 'This week' ? 0.22 : period === 'This month' ? 1 : 12;

  const stats = [
    { label: 'Revenue', value: `SAR ${Math.round(totalRevenue * multiplier).toLocaleString()}`, icon: TrendingUp, change: '+14%', color: 'text-eucalyptus' },
    { label: 'Total bookings', value: Math.round(companyBookings.length * multiplier), icon: CalendarDays, change: '+9%', color: 'text-moss' },
    { label: 'Active bookings', value: Math.round(activeBookings.length * multiplier), icon: CalendarDays, change: '+5%', color: 'text-soot' },
    { label: 'Cancelled', value: Math.round(cancelledBookings.length * multiplier), icon: CalendarDays, change: '-1%', color: 'text-red-400' },
    { label: 'Unique customers', value: Math.round(new Set(companyBookings.map((b: Booking) => b.userId)).size * multiplier), icon: Users, change: '+11%', color: 'text-mist' },
    { label: 'Active workspaces', value: companySpaces.filter((s: Space) => s.isVisible && s.status === 'published').length, icon: Building2, change: 'stable', color: 'text-eucalyptus' },
    { label: 'Avg seats/booking', value: companyBookings.length > 0 ? (companyBookings.reduce((s: number, b: Booking) => s + b.seats, 0) / companyBookings.length).toFixed(1) : '0', icon: Users, change: '+0.3', color: 'text-moss' },
    { label: 'Total capacity', value: companySpaces.reduce((s: number, sp: Space) => s + sp.totalCapacity, 0), icon: Building2, change: 'stable', color: 'text-soot' },
  ];

  const revenueByWorkspace = companySpaces.map((s: Space) => ({
    label: s.name.split(' ')[0],
    value: Math.round(companyBookings.filter((b: Booking) => b.spaceId === s.id && b.status !== 'cancelled').reduce((sum: number, b: Booking) => sum + b.totalPrice, 0) * multiplier),
  }));

  const bookingsByPlan = [
    { label: 'Daily', value: Math.round(companyBookings.filter((b: Booking) => b.plan === 'daily').length * multiplier) },
    { label: 'Monthly', value: Math.round(companyBookings.filter((b: Booking) => b.plan === 'monthly').length * multiplier) },
    { label: 'Yearly', value: Math.round(companyBookings.filter((b: Booking) => b.plan === 'yearly').length * multiplier) },
  ];

  const occupancyData = companySpaces.map((s: Space) => ({
    label: s.name.split(' ')[0],
    value: s.totalCapacity > 0 ? Math.round(((s.totalCapacity - s.availableCapacity) / s.totalCapacity) * 100) : 0,
  }));

  const customerGrowth = period === 'Today'
    ? [{ label: '9am', value: 1 }, { label: '12pm', value: 2 }, { label: '3pm', value: 0 }, { label: '6pm', value: 1 }]
    : period === 'This week'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => ({ label: d, value: i + 1 }))
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m, i) => ({ label: m, value: Math.floor(i * 0.8 + 1) }));

  const topSpaces = companySpaces.map((s: Space) => ({
    ...s,
    bookingCount: companyBookings.filter((b: Booking) => b.spaceId === s.id && b.status !== 'cancelled').length,
    revenue: companyBookings.filter((b: Booking) => b.spaceId === s.id && b.status !== 'cancelled').reduce((sum: number, b: Booking) => sum + b.totalPrice, 0),
  })).sort((a, b) => b.revenue - a.revenue);

  const hasData = companyBookings.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Reports & Analytics</h1>
        <div className="flex gap-1 bg-white border border-soot/8 rounded-xl p-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-soot text-plaster' : 'text-moss hover:text-soot'}`}>{p}</button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-2xl border border-soot/8 p-16 text-center">
          <BarChart3 size={32} className="text-moss mx-auto mb-4" />
          <h3 className="font-semibold text-soot mb-2">No data yet</h3>
          <p className="text-sm text-moss">Analytics will appear once your workspaces start receiving bookings.</p>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-soot/8">
                <div className="flex items-center justify-between mb-3">
                  <div className={s.color}><s.icon size={17} /></div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.change.startsWith('-') ? 'bg-red-50 text-red-400' : 'bg-eucalyptus/15 text-moss'}`}>{s.change}</span>
                </div>
                <div className="text-xl font-semibold text-soot">{s.value}</div>
                <div className="text-xs text-moss mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue by workspace */}
            <div className="bg-white rounded-2xl border border-soot/8 p-5">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={15} className="text-moss" />
                <h2 className="font-semibold text-soot text-sm">Revenue by workspace</h2>
              </div>
              <p className="text-xs text-moss mb-1">{period}</p>
              {revenueByWorkspace.length === 0 ? (
                <p className="text-xs text-moss mt-4">No workspaces to display.</p>
              ) : (
                <BarChart data={revenueByWorkspace} color="#98AA9D" />
              )}
            </div>

            {/* Bookings by plan */}
            <div className="bg-white rounded-2xl border border-soot/8 p-5">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={15} className="text-moss" />
                <h2 className="font-semibold text-soot text-sm">Bookings by plan</h2>
              </div>
              <p className="text-xs text-moss mb-1">{period}</p>
              <BarChart data={bookingsByPlan} color="#B3C9D6" />
            </div>

            {/* Workspace occupancy */}
            <div className="bg-white rounded-2xl border border-soot/8 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={15} className="text-moss" />
                <h2 className="font-semibold text-soot text-sm">Workspace occupancy %</h2>
              </div>
              <p className="text-xs text-moss mb-1">Current state</p>
              {occupancyData.length === 0 ? (
                <p className="text-xs text-moss mt-4">No workspaces yet.</p>
              ) : (
                <BarChart data={occupancyData} color="#697C70" />
              )}
            </div>

            {/* Customer growth */}
            <div className="bg-white rounded-2xl border border-soot/8 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Users size={15} className="text-moss" />
                <h2 className="font-semibold text-soot text-sm">New customers</h2>
              </div>
              <p className="text-xs text-moss mb-1">{period}</p>
              <BarChart data={customerGrowth} color="#98AA9D" />
            </div>
          </div>

          {/* Top workspaces table */}
          {topSpaces.length > 0 && (
            <div className="bg-white rounded-2xl border border-soot/8 p-5">
              <h2 className="font-semibold text-soot text-sm mb-4">Workspace performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-soot/8">
                      {['Workspace', 'City', 'Type', 'Bookings', 'Revenue', 'Occupancy'].map(h => (
                        <th key={h} className="pb-3 text-left text-xs font-medium text-moss">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-soot/5">
                    {topSpaces.map((s: any, i: number) => {
                      const occ = s.totalCapacity > 0 ? Math.round(((s.totalCapacity - s.availableCapacity) / s.totalCapacity) * 100) : 0;
                      return (
                        <tr key={s.id} className="hover:bg-plaster/30 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-moss w-5">{i + 1}</span>
                              <span className="font-medium text-soot">{s.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-moss">{s.city}</td>
                          <td className="py-3 text-moss capitalize">{s.type.replace('-', ' ')}</td>
                          <td className="py-3 text-soot">{s.bookingCount}</td>
                          <td className="py-3 font-medium text-soot">SAR {s.revenue.toLocaleString()}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-soot/8 rounded-full overflow-hidden">
                                <div className="h-full bg-eucalyptus rounded-full" style={{ width: `${occ}%` }} />
                              </div>
                              <span className="text-xs text-moss">{occ}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
