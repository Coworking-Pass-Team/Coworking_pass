'use client';

import { Warehouse, CalendarDays, TrendingUp, Percent, ArrowRight, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/app/store';
import { getBookingPrice, getSpaceCategory, isHourlyAllowed } from '@/types/types';

export default function ProviderDashboard() {
  const { currentUser, spaces, bookings, navigate } = useApp();
  if (!currentUser) return null;

  const mySpaces = spaces.filter((s) => s.ownerId === currentUser.id);
  const mySpaceIds = mySpaces.map((s) => s.id);
  const myBookings = bookings.filter((b) => mySpaceIds.includes(b.spaceId));
  const activeBookings = myBookings.filter((b) => b.status === 'active');
  const totalRevenue = myBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + getBookingPrice(b, spaces), 0);

  const totalCapacity = mySpaces.reduce((sum, s) => sum + s.totalCapacity, 0);
  const totalAvailable = mySpaces.reduce((sum, s) => sum + s.availableCapacity, 0);
  const occupancy =
    totalCapacity > 0 ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100) : 0;

  const recentBookings = myBookings
    .slice()
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 flex-wrap gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            Space Provider Dashboard
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            {currentUser.businessName || currentUser.name}
          </h1>
          <p className="text-moss text-sm mt-1">
            {mySpaces.length} workspace{mySpaces.length === 1 ? '' : 's'} listed on platform
          </p>
        </div>
      </div>

      {/* Admin-Matching Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Spaces',
            value: mySpaces.length,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Building2,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Active Bookings',
            value: activeBookings.length,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: CalendarDays,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Total Revenue',
            value: `SAR ${totalRevenue.toLocaleString()}`,
            badge: 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
            icon: TrendingUp,
            iconBg: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
          },
          {
            label: 'Occupancy Rate',
            value: `${occupancy}%`,
            badge: 'bg-teal-500/15 text-teal-800 border border-teal-500/30',
            icon: Percent,
            iconBg: 'bg-teal-500/15 text-teal-800 border-teal-500/30',
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
                <div className="text-2xl font-semibold text-soot tracking-tight font-sans">{stat.value}</div>
                <div className="text-xs font-medium text-moss mt-0.5">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* My spaces */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif-display text-soot">My Workspaces</h2>
            <button
              type="button"
              onClick={() => navigate('provider-spaces')}
              className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Manage all</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {mySpaces.length === 0 ? (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 p-8 text-center shadow-2xs">
              <Warehouse size={32} className="text-moss mx-auto mb-3" />
              <div className="text-sm text-moss font-medium">You haven&apos;t listed a workspace yet</div>
            </div>
          ) : (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs divide-y divide-soot/8">
              {mySpaces.map((space) => (
                <div
                  key={space.id}
                  onClick={() => navigate('provider-spaces')}
                  className="p-4 hover:bg-plaster-dark/30 transition-colors flex items-center gap-3.5 cursor-pointer group"
                >
                  <img
                    src={space.images[0]}
                    alt={space.name}
                    className="w-12 h-12 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-soot truncate group-hover:text-emerald-900 transition-colors">
                        {space.name}
                      </span>
                      {!space.isVisible && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-500/10 text-red-700 shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-moss mt-1 font-medium">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-soot/8 text-soot border border-soot/10 capitalize">
                        {getSpaceCategory(space)}
                      </span>
                      <span>·</span>
                      <MapPin size={12} className="text-moss shrink-0" />
                      <span className="truncate">{space.city}</span>
                      <span>·</span>
                      <span>
                        {space.availableCapacity}/{space.totalCapacity} available
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs font-semibold text-soot shrink-0">
                    SAR {isHourlyAllowed(space) ? (space.pricing.hourly || 150) : space.pricing.daily}
                    <span className="text-[10px] text-moss font-normal block">
                      {isHourlyAllowed(space) ? '/ hour' : '/ day'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif-display text-soot">Recent Bookings</h2>
            <button
              type="button"
              onClick={() => navigate('provider-bookings')}
              className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {recentBookings.length === 0 ? (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 p-8 text-center shadow-2xs">
              <CalendarDays size={32} className="text-moss mx-auto mb-3" />
              <div className="text-sm text-moss font-medium">No bookings yet for your spaces</div>
            </div>
          ) : (
            <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs divide-y divide-soot/8">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate('provider-bookings')}
                  className="p-4 hover:bg-plaster-dark/30 transition-colors flex items-center gap-3.5 cursor-pointer group"
                >
                  <img
                    src={b.spaceImage}
                    alt={b.spaceName}
                    className="w-11 h-11 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-soot truncate group-hover:text-emerald-900 transition-colors">
                      {b.spaceName}
                    </div>
                    <div className="text-xs text-moss mt-0.5 truncate">
                      {b.seats} seat{b.seats > 1 ? 's' : ''} · <span className="capitalize">{b.plan}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        b.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                          : b.status === 'previous'
                          ? 'bg-soot/10 text-soot border border-soot/15'
                          : 'bg-red-500/15 text-red-700 border border-red-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="text-xs font-semibold text-soot block mt-1">SAR {getBookingPrice(b, spaces).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
