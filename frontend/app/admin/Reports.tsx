'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, CalendarDays, Users, Building2, BarChart3 } from 'lucide-react';
import { useApp } from '@/app/store';
import { getAdminReportApi, ReportPeriod } from '@/services/authApi';

const PERIODS = ['Today', 'This week', 'This month', 'This year'];

// Simple bar chart using CSS (أحجام خطوط أكبر للرسم البياني)
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
      <div className="flex items-end gap-3 h-48 border-b border-soot/10 pb-1">
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
              <div className="text-xs text-moss font-semibold">
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

              <div className="text-xs text-moss font-medium truncate w-full text-center mt-1">
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PERIOD_KEYS: Record<string, ReportPeriod> = {
  'Today': 'today',
  'This week': 'week',
  'This month': 'month',
  'This year': 'year',
};

interface ReportData {
  revenue: number;
  grossRevenue: number;
  refunds: number;
  totalBookings: number;
  activeBookings: number;
  cancelledBookings: number;
  totalUsers: number;
  organizations: number;
  partners: number;
  individuals: number;
  availableSpaces: number;
  fullyBookedSpaces: number;
  revenueByCity: { label: string; value: number }[];
  bookingsByPlan: { label: string; value: number }[];
  usersByType: { label: string; value: number }[];
  occupancy: { id: string; name: string; occupancyPercent: number }[];
  topSpaces: { id: string; name: string; city: string; revenue: number; bookingCount: number; occupancyPercent: number }[];
}

export default function Reports() {
  const { spaces } = useApp();
  const [period, setPeriod] = useState('This month');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // All figures come from live database aggregations on the server
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getAdminReportApi(PERIOD_KEYS[period] || 'month').then((res) => {
      if (cancelled) return;
      if (res.success) setReport(res.data as ReportData);
      else setError(res.error);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [period]);

  const stats = report ? [
    { label: 'Net revenue', value: `SAR ${Math.round(report.revenue).toLocaleString()}`, icon: TrendingUp, color: 'text-moss' },
    { label: 'Total bookings', value: report.totalBookings, icon: CalendarDays, color: 'text-eucalyptus' },
    { label: 'Active bookings', value: report.activeBookings, icon: CalendarDays, color: 'text-soot' },
    { label: 'Cancelled / refunded', value: report.cancelledBookings, icon: CalendarDays, color: 'text-red-400' },
    { label: 'Total users', value: report.totalUsers, icon: Users, color: 'text-mist' },
    { label: 'Organizations', value: report.organizations, icon: Building2, color: 'text-moss' },
    { label: 'Available spaces', value: report.availableSpaces, icon: Building2, color: 'text-eucalyptus' },
    { label: 'Fully booked', value: report.fullyBookedSpaces, icon: Building2, color: 'text-red-400' },
  ] : [];

  const revenueData = report?.revenueByCity ?? [];
  const bookingsByPlan = report?.bookingsByPlan ?? [];
  const occupancyData = (report?.occupancy ?? []).map(o => ({ label: o.name.split(' ')[0], value: o.occupancyPercent }));
  const userGrowth = report?.usersByType ?? [];
  const topSpaces = (report?.topSpaces ?? []).map(t => ({ ...t, images: spaces.find(sp => sp.id === t.id)?.images ?? [] }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-4xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Reports & Analytics</h1>
        <div className="flex gap-1 bg-white border border-soot/8 rounded-xl p-1 shadow-xs">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${period === p ? 'bg-soot text-plaster' : 'text-moss hover:text-soot'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-sm text-moss mb-6">Loading live report...</div>}
      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-6">{error}</div>}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-soot/8 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className={s.color}><s.icon size={20} /></div>
            </div>
            <div className="text-2xl font-bold text-soot">{s.value}</div>
            <div className="text-sm font-medium text-moss mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by city */}
        <div className="bg-white rounded-2xl border border-soot/8 p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-moss" />
            <h2 className="font-bold text-soot text-base">Net revenue by city (SAR)</h2>
          </div>
          <p className="text-sm text-moss mb-2">{period}</p>
          <BarChart data={revenueData} color="#98AA9D" />
        </div>

        {/* Bookings by plan */}
        <div className="bg-white rounded-2xl border border-soot/8 p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={18} className="text-moss" />
            <h2 className="font-bold text-soot text-base">Bookings by plan</h2>
          </div>
          <p className="text-sm text-moss mb-2">{period}</p>
          <BarChart data={bookingsByPlan} color="#697C70" />
        </div>

        {/* Space occupancy */}
        <div className="bg-white rounded-2xl border border-soot/8 p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={18} className="text-moss" />
            <h2 className="font-bold text-soot text-base">Space occupancy (%)</h2>
          </div>
          <p className="text-sm text-moss mb-2">Current status</p>
          <BarChart data={occupancyData} color="#B3C9D6" />
        </div>

        {/* User growth */}
        <div className="bg-white rounded-2xl border border-soot/8 p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-moss" />
            <h2 className="font-bold text-soot text-base">Users by account type</h2>
          </div>
          <p className="text-sm text-moss mb-2">Current totals</p>
          <BarChart data={userGrowth} color="#2D3536" />
        </div>
      </div>

      {/* Top spaces table */}
      <div className="bg-white rounded-2xl border border-soot/8 p-6 shadow-2xs">
        <h2 className="font-bold text-soot text-lg mb-5">Top performing spaces</h2>
        <div className="divide-y divide-soot/5">
          {topSpaces.map((space, i) => (
            <div key={space.id} className="flex items-center gap-4 py-4">
              <div className="w-8 h-8 rounded-full bg-soot/8 flex items-center justify-center text-sm font-bold text-moss shrink-0">
                {i + 1}
              </div>
              <img src={space.images[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=60'} alt={space.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-soot text-base truncate">{space.name}</div>
                <div className="text-sm text-moss">{space.city}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-soot text-base">SAR {space.revenue.toLocaleString()}</div>
                <div className="text-sm text-moss">{space.bookingCount} bookings</div>
              </div>
              <div className="w-28 shrink-0 hidden sm:block">
                <div className="flex justify-between text-xs text-moss mb-1">
                  <span>Occupancy</span>
                  <span className="font-semibold">{space.occupancyPercent}%</span>
                </div>
                <div className="h-2 bg-soot/8 rounded-full">
                  <div
                    className="h-full bg-eucalyptus rounded-full"
                    style={{ width: `${space.occupancyPercent}%` }}
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
