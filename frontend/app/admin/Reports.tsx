'use client';
import { useState } from 'react';
import { TrendingUp, CalendarDays, Users, Building2, BarChart3 } from 'lucide-react';
import { useApp } from '@/app/store';

const PERIODS = ['Today', 'This week', 'This month', 'This year'];

// Simple bar chart using CSS
function BarChart({
  data,
  color = '#98AA9D',
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="mt-4">
      <div className="flex items-end gap-3 h-40 border-b border-soot/10">
        {data.map(d => {
          const barHeight =
            d.value === 0
              ? 5
              : Math.max((d.value / max) * 100, 8);

          return (
            <div
              key={d.label}
              className="flex-1 h-full min-w-0 flex flex-col items-center justify-end gap-1"
            >
              <div className="text-[10px] text-moss font-medium">
                {d.value.toLocaleString()}
              </div>

              <div
                className="w-full max-w-12 rounded-t-lg transition-all duration-500 hover:opacity-80"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  opacity: d.value === 0 ? 0.25 : 1,
                }}
                title={`${d.label}: ${d.value.toLocaleString()}`}
              />

              <div className="text-[10px] text-moss truncate w-full text-center mt-1">
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function Reports() {
  const { bookings, users, spaces } = useApp();
  const [period, setPeriod] = useState('This month');

  const nonAdminUsers = users.filter(u => u.role !== 'admin');
  const activeBookings = bookings.filter(b => b.status === 'active');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);

  // Mock period-based data
  const periodMultiplier = period === 'Today' ? 0.03 : period === 'This week' ? 0.2 : period === 'This month' ? 1 : 12;

  const stats = [
    { label: 'Total revenue', value: `SAR ${Math.round(totalRevenue * periodMultiplier).toLocaleString()}`, icon: TrendingUp, change: '+12%', color: 'text-moss' },
    { label: 'Total bookings', value: Math.round(bookings.length * periodMultiplier), icon: CalendarDays, change: '+8%', color: 'text-eucalyptus' },
    { label: 'Active bookings', value: Math.round(activeBookings.length * periodMultiplier), icon: CalendarDays, change: '+5%', color: 'text-soot' },
    { label: 'Cancelled', value: Math.round(cancelledBookings.length * periodMultiplier), icon: CalendarDays, change: '-2%', color: 'text-red-400' },
    { label: 'New users', value: Math.round(nonAdminUsers.length * periodMultiplier), icon: Users, change: '+15%', color: 'text-mist' },
    { label: 'Organizations', value: Math.round(nonAdminUsers.filter(u => u.role === 'organization').length * periodMultiplier), icon: Building2, change: '+3%', color: 'text-moss' },
    { label: 'Available spaces', value: spaces.filter(s => s.isVisible && s.availableCapacity > 0).length, icon: Building2, change: 'stable', color: 'text-eucalyptus' },
    { label: 'Fully booked', value: spaces.filter(s => s.availableCapacity === 0).length, icon: Building2, change: '+1', color: 'text-red-400' },
  ];

  const revenueData = [
    { label: 'Riyadh', value: Math.round(totalRevenue * 0.42 * periodMultiplier) },
    { label: 'Jeddah', value: Math.round(totalRevenue * 0.28 * periodMultiplier) },
    { label: 'Dammam', value: Math.round(totalRevenue * 0.15 * periodMultiplier) },
    { label: 'Khobar', value: Math.round(totalRevenue * 0.08 * periodMultiplier) },
    { label: 'Madinah', value: Math.round(totalRevenue * 0.07 * periodMultiplier) },
  ];

  const bookingsByPlan = [
    { label: 'Daily', value: Math.round(bookings.filter(b => b.plan === 'daily').length * periodMultiplier) },
    { label: 'Monthly', value: Math.round(bookings.filter(b => b.plan === 'monthly').length * periodMultiplier) },
    { label: 'Yearly', value: Math.round(bookings.filter(b => b.plan === 'yearly').length * periodMultiplier) },
  ];

  const occupancyData = spaces.slice(0, 5).map(s => ({
    label: s.name.split(' ')[0],
    value: Math.round(((s.totalCapacity - s.availableCapacity) / s.totalCapacity) * 100),
  }));

  const userGrowth = period === 'Today'
    ? [{ label: '9am', value: 1 }, { label: '12pm', value: 2 }, { label: '3pm', value: 1 }, { label: '6pm', value: 0 }]
    : period === 'This week'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({ label: d, value: Math.floor(Math.random() * 3) + 1 }))
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m, i) => ({ label: m, value: Math.floor(i * 1.5 + 2) }));

  const topSpaces = spaces.map(s => ({
    ...s,
    bookingCount: bookings.filter(b => b.spaceId === s.id && b.status !== 'cancelled').length,
    revenue: bookings.filter(b => b.spaceId === s.id && b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0),
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Reports & Analytics</h1>
        <div className="flex gap-1 bg-white border border-soot/8 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-soot text-plaster' : 'text-moss hover:text-soot'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-soot/8">
            <div className="flex items-center justify-between mb-3">
              <div className={s.color}><s.icon size={17} /></div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.change.startsWith('-') ? 'bg-red-50 text-red-400' : 'bg-eucalyptus/15 text-moss'}`}>
                {s.change}
              </span>
            </div>
            <div className="text-xl font-semibold text-soot">{s.value}</div>
            <div className="text-xs text-moss mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by city */}
        <div className="bg-white rounded-2xl border border-soot/8 p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={15} className="text-moss" />
            <h2 className="font-semibold text-soot text-sm">Revenue by city</h2>
          </div>
          <p className="text-xs text-moss mb-1">{period}</p>
          <BarChart data={revenueData} color="#98AA9D" />
        </div>

        {/* Bookings by plan */}
        <div className="bg-white rounded-2xl border border-soot/8 p-5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={15} className="text-moss" />
            <h2 className="font-semibold text-soot text-sm">Bookings by plan</h2>
          </div>
          <p className="text-xs text-moss mb-1">{period}</p>
          <BarChart data={bookingsByPlan} color="#697C70" />
        </div>

        {/* Space occupancy */}
        <div className="bg-white rounded-2xl border border-soot/8 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={15} className="text-moss" />
            <h2 className="font-semibold text-soot text-sm">Space occupancy (%)</h2>
          </div>
          <p className="text-xs text-moss mb-1">Current status</p>
          <BarChart data={occupancyData} color="#B3C9D6" />
        </div>

        {/* User growth */}
        <div className="bg-white rounded-2xl border border-soot/8 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users size={15} className="text-moss" />
            <h2 className="font-semibold text-soot text-sm">New user signups</h2>
          </div>
          <p className="text-xs text-moss mb-1">{period}</p>
          <BarChart data={userGrowth} color="#2D3536" />
        </div>
      </div>

      {/* Top spaces table */}
      <div className="bg-white rounded-2xl border border-soot/8 p-5">
        <h2 className="font-semibold text-soot mb-4">Top performing spaces</h2>
        <div className="divide-y divide-soot/5">
          {topSpaces.map((space, i) => (
            <div key={space.id} className="flex items-center gap-4 py-3">
              <div className="w-6 h-6 rounded-full bg-soot/8 flex items-center justify-center text-xs font-semibold text-moss shrink-0">
                {i + 1}
              </div>
              <img src={space.images[0]} alt={space.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-soot text-sm truncate">{space.name}</div>
                <div className="text-xs text-moss">{space.city}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-soot text-sm">SAR {space.revenue.toLocaleString()}</div>
                <div className="text-xs text-moss">{space.bookingCount} bookings</div>
              </div>
              <div className="w-20 shrink-0">
                <div className="flex justify-between text-[10px] text-moss mb-1">
                  <span>Occupancy</span>
                  <span>{Math.round(((space.totalCapacity - space.availableCapacity) / space.totalCapacity) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-soot/8 rounded-full">
                  <div
                    className="h-full bg-eucalyptus rounded-full"
                    style={{ width: `${((space.totalCapacity - space.availableCapacity) / space.totalCapacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
