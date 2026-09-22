'use client';

import React from 'react';
import { 
  Building2, 
  Users, 
  CalendarDays, 
  TrendingUp, 
  ArrowRight, 
  ArrowUpRight, 
  BarChart3, 
  UserCheck, 
  Building, 
  AlertCircle, 
  CalendarX,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/app/store';
import { getBookingPrice } from '@/types/types';

export interface GrowthRateResult {
  value: number | null;
  formatted: string;
  direction: 'up' | 'down' | 'neutral';
  badgeClass: string;
}

/**
 * Calculates percentage growth rate from previous to current period.
 * Formula: ((current - previous) / previous) * 100
 * Handles division by zero (previous === 0) and missing baseline data (--).
 */
export function calculateGrowthRate(
  current: number,
  previous: number,
  options?: { suffix?: string; zeroAsDash?: boolean }
): GrowthRateResult {
  const suffix = options?.suffix ? ` ${options.suffix.trim()}` : '';

  // Edge Case 1: Missing or invalid numerical input
  if (
    current === undefined ||
    previous === undefined ||
    isNaN(current) ||
    isNaN(previous) ||
    current < 0 ||
    previous < 0
  ) {
    return {
      value: null,
      formatted: '--',
      direction: 'neutral',
      badgeClass: 'text-moss bg-soot/5 border border-soot/10',
    };
  }

  // Edge Case 2: No data or activity in either period
  if (previous === 0 && current === 0) {
    return {
      value: 0,
      formatted: '--',
      direction: 'neutral',
      badgeClass: 'text-moss bg-soot/5 border border-soot/10',
    };
  }

  // Edge Case 3: Division by Zero protection (previous === 0, current > 0)
  if (previous === 0) {
    if (options?.zeroAsDash) {
      return {
        value: null,
        formatted: '--',
        direction: 'neutral',
        badgeClass: 'text-moss bg-soot/5 border border-soot/10',
      };
    }
    return {
      value: 100,
      formatted: `+100%${suffix}`,
      direction: 'up',
      badgeClass: 'font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100',
    };
  }

  // Standard percentage growth formula
  const rate = ((current - previous) / previous) * 100;
  const rounded = Math.round(rate * 10) / 10;

  if (rounded > 0) {
    return {
      value: rounded,
      formatted: `+${rounded}%${suffix}`,
      direction: 'up',
      badgeClass: 'font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100',
    };
  }

  if (rounded < 0) {
    return {
      value: rounded,
      formatted: `${rounded}%${suffix}`,
      direction: 'down',
      badgeClass: 'font-semibold text-rose-800 bg-rose-50 border border-rose-100',
    };
  }

  return {
    value: 0,
    formatted: `0%${suffix}`,
    direction: 'neutral',
    badgeClass: 'text-moss bg-soot/5 border border-soot/10',
  };
}

export default function AdminDashboard() {
  const { spaces, users, bookings, loyaltyRules, navigate, partners, fetchPartners, fetchUsers } = useApp();

  React.useEffect(() => {
    fetchPartners().catch(() => {});
    if (fetchUsers) fetchUsers().catch(() => {});
  }, []);

  const pendingPartnersCount = partners.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const nonAdminUsers = users.filter(u => u.role !== 'admin');
  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + getBookingPrice(b, spaces), 0);
  const activeBookings = bookings.filter(b => b.status === 'active');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const individuals = users.filter(u => u.role === 'individual');
  const orgs = users.filter(u => u.role === 'organization');
  const visibleSpaces = spaces.filter(s => s.isVisible);
  const fullyBooked = spaces.filter(s => s.availableCapacity === 0 && s.isVisible).length;

  const recentBookings = bookings.slice(-5).reverse();
  const recentUsers = nonAdminUsers.slice(-5).reverse();

  // Dynamic Growth Calculations (MoM / Period-over-Period)
  const now = new Date();
  let anchorDate = now;
  for (const b of bookings) {
    const raw = b.createdAt || b.startDate;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime()) && d > anchorDate) {
        anchorDate = d;
      }
    }
  }

  const currentYear = anchorDate.getFullYear();
  const currentMonth = anchorDate.getMonth();
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  const isInRange = (rawDate?: string, start?: Date, end?: Date) => {
    if (!rawDate || !start || !end) return false;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;
    return d >= start && d <= end;
  };

  const isBefore = (rawDate?: string, threshold?: Date) => {
    if (!rawDate || !threshold) return false;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;
    return d < threshold;
  };

  // 1. Total Revenue MoM
  const currentMonthRevenue = bookings
    .filter(b => b.status !== 'cancelled' && isInRange(b.createdAt || b.startDate, currentMonthStart, currentMonthEnd))
    .reduce((sum, b) => sum + getBookingPrice(b, spaces), 0);

  const prevMonthRevenue = bookings
    .filter(b => b.status !== 'cancelled' && isInRange(b.createdAt || b.startDate, prevMonthStart, prevMonthEnd))
    .reduce((sum, b) => sum + getBookingPrice(b, spaces), 0);

  const revenueGrowth = calculateGrowthRate(currentMonthRevenue, prevMonthRevenue, { suffix: 'MoM' });

  // 2. Active Bookings Growth
  const currentMonthBookings = bookings.filter(
    b => b.status !== 'cancelled' && isInRange(b.createdAt || b.startDate, currentMonthStart, currentMonthEnd)
  ).length;

  const prevMonthBookings = bookings.filter(
    b => b.status !== 'cancelled' && isInRange(b.createdAt || b.startDate, prevMonthStart, prevMonthEnd)
  ).length;

  const bookingsGrowth = calculateGrowthRate(currentMonthBookings, prevMonthBookings);

  // 3. Total Users Growth
  const prevUsersCount = nonAdminUsers.filter(u => isBefore(u.joinDate || (u as any).createdAt, currentMonthStart)).length;
  const currentUsersCount = nonAdminUsers.length;
  const usersGrowth = calculateGrowthRate(currentUsersCount, prevUsersCount);

  // 4. Active Spaces Growth
  const newSpacesInPeriod = visibleSpaces.filter(s => isInRange((s as any).createdAt, currentMonthStart, currentMonthEnd)).length;
  const prevSpacesCount = visibleSpaces.length - newSpacesInPeriod;
  const spacesGrowth = calculateGrowthRate(visibleSpaces.length, prevSpacesCount);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <span className="text-moss text-xs font-semibold uppercase tracking-wider block mb-1">
          System Overview
        </span>
        <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
          Dashboard
        </h1>
      </div>

      {/* Pending Space Provider Requests Banner */}
      {pendingPartnersCount > 0 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/25 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-800 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-soot">
                  New Space Partner Applications Pending Approval ({pendingPartnersCount})
                </span>
                <span className="text-[11px] font-semibold bg-amber-500/20 text-amber-900 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-moss mt-0.5">
                New coworking venue providers have submitted registration and commercial verification details awaiting admin approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('admin-users', { filter: 'pending' })}
            className="px-4 py-2 rounded-xl bg-soot text-plaster text-xs font-semibold hover:bg-soot/90 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
          >
            <span>Review Requests</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-eucalyptus/20 flex items-center justify-center text-soot">
              <TrendingUp size={19} />
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${revenueGrowth.badgeClass}`}>
              {revenueGrowth.formatted}
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-normal font-serif-display text-soot tracking-tight">
              SAR {totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-moss mt-1 font-medium">Total revenue</div>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-moss/15 flex items-center justify-center text-soot">
              <CalendarDays size={19} />
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${bookingsGrowth.badgeClass}`}>
              {bookingsGrowth.formatted}
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-normal font-serif-display text-soot tracking-tight">
              {activeBookings.length}
            </div>
            <div className="text-xs text-moss mt-1 font-medium">Active bookings</div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-mist-light flex items-center justify-center text-soot">
              <Users size={19} />
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${usersGrowth.badgeClass}`}>
              {usersGrowth.formatted}
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-normal font-serif-display text-soot tracking-tight">
              {nonAdminUsers.length}
            </div>
            <div className="text-xs text-moss mt-1 font-medium">Total users</div>
          </div>
        </div>

        {/* Active Spaces */}
        <div className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-soot/5 flex items-center justify-center text-soot">
              <Building2 size={19} />
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${spacesGrowth.badgeClass}`}>
              {spacesGrowth.formatted}
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-normal font-serif-display text-soot tracking-tight">
              {visibleSpaces.length}
            </div>
            <div className="text-xs text-moss mt-1 font-medium">Active spaces</div>
          </div>
        </div>
      </div>

      {/* Secondary Detailed Breakdown (The 4 Specific Sub-Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: 'Individuals', 
            value: individuals.length, 
            icon: UserCheck, 
            accent: 'bg-soot/5 text-soot' 
          },
          { 
            label: 'Organizations', 
            value: orgs.length, 
            icon: Building, 
            accent: 'bg-eucalyptus/20 text-soot' 
          },
          { 
            label: 'Fully booked', 
            value: fullyBooked, 
            icon: AlertCircle, 
            accent: fullyBooked > 0 ? 'bg-amber-50 text-amber-700' : 'bg-soot/5 text-moss' 
          },
          { 
            label: 'Cancelled', 
            value: cancelledBookings.length, 
            icon: CalendarX, 
            accent: cancelledBookings.length > 0 ? 'bg-red-50 text-red-600' : 'bg-soot/5 text-moss' 
          },
        ].map(item => (
          <div 
            key={item.label} 
            className="bg-white rounded-2xl p-4 border border-soot/10 shadow-2xs flex items-center justify-between"
          >
            <div>
              <div className="text-xl sm:text-2xl font-serif-display font-normal text-soot">
                {item.value}
              </div>
              <div className="text-xs text-moss font-medium mt-0.5">
                {item.label}
              </div>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.accent}`}>
              <item.icon size={17} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Split: Bookings & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-3xl border border-soot/10 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-soot/8">
              <div>
                <h2 className="text-lg font-serif-display font-normal text-soot">Recent Bookings</h2>
                <p className="text-xs text-moss">Latest workspace transactions</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('admin-bookings')}
                className="text-xs font-semibold text-soot hover:text-moss flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-soot/6">
              {recentBookings.map(b => (
                <div key={b.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={b.spaceImage} 
                      alt={b.spaceName} 
                      className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-soot/8 shadow-2xs" 
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-soot truncate">{b.spaceName}</div>
                      <div className="text-xs text-moss truncate mt-0.5">{b.spaceCity} · <span className="capitalize">{b.plan === 'hourly' ? `Hourly (${b.durationHours || 1} ${b.durationHours === 1 ? 'hr' : 'hrs'})` : b.plan}</span></div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-soot">SAR {getBookingPrice(b, spaces).toLocaleString()}</div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize mt-1 ${
                      b.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : b.status === 'previous'
                        ? 'bg-soot/5 text-moss'
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-3xl border border-soot/10 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-soot/8">
              <div>
                <h2 className="text-lg font-serif-display font-normal text-soot">Recent Members</h2>
                <p className="text-xs text-moss">Newly joined accounts</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('admin-users')}
                className="text-xs font-semibold text-soot hover:text-moss flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-soot/6">
              {recentUsers.map(u => (
                <div key={u.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={u.avatar} 
                      alt={u.name} 
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-soot/8 shadow-2xs" 
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-soot truncate">
                        {u.role === 'organization' ? u.orgName || u.name : u.name}
                      </div>
                      <div className="text-xs text-moss truncate mt-0.5">{u.email}</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                      u.isBlocked
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : u.role === 'organization'
                        ? 'bg-eucalyptus/20 text-soot'
                        : 'bg-soot/5 text-moss'
                    }`}>
                      {u.isBlocked ? 'Blocked' : u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Manage Spaces', 
            desc: 'Review capacity, pricing, and live listings', 
            screen: 'admin-spaces' as const,
            icon: Building2 
          },
          { 
            label: 'User Accounts', 
            desc: 'Audit roles, permissions, and security status', 
            screen: 'admin-users' as const,
            icon: Users 
          },
          { 
            label: 'Support Desk', 
            desc: 'Review complaints, refunds & inquiries', 
            screen: 'admin-support' as const,
            icon: HelpCircle 
          },
          { 
            label: 'Loyalty Proposals', 
            desc: 'Review and moderate partner loyalty points rules', 
            screen: 'admin-loyalty-proposals' as const,
            icon: Sparkles 
          },
          { 
            label: 'Analytics & Reports', 
            desc: 'Export VAT statements and utilization insights', 
            screen: 'admin-reports' as const,
            icon: BarChart3 
          },

        ].map(l => (
          <button
            key={l.screen}
            type="button"
            onClick={() => navigate(l.screen)}
            className="p-5 rounded-3xl bg-white border border-soot/10 shadow-xs hover:shadow-md hover:border-soot/25 transition-all text-left flex items-start justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-soot/5 text-soot flex items-center justify-center shrink-0 group-hover:bg-soot group-hover:text-plaster transition-colors">
                <l.icon size={18} />
              </div>
              <div>
                <div className="font-semibold text-soot text-sm group-hover:text-moss transition-colors">
                  {l.label}
                </div>
                <div className="text-xs text-moss mt-1 leading-relaxed">
                  {l.desc}
                </div>
              </div>
            </div>
            <ArrowUpRight size={15} className="text-moss group-hover:text-soot shrink-0 transition-colors mt-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
