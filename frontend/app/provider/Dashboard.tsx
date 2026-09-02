'use client';

import { Warehouse, CalendarDays, TrendingUp, Percent, ArrowRight, Plus, MapPin } from 'lucide-react';
import { useApp } from '@/app/store';

export default function ProviderDashboard() {
  const { currentUser, spaces, bookings, navigate } = useApp();
  if (!currentUser) return null;

  const mySpaces = spaces.filter(s => s.ownerId === currentUser.id);
  const mySpaceIds = mySpaces.map(s => s.id);
  const myBookings = bookings.filter(b => mySpaceIds.includes(b.spaceId));
  const activeBookings = myBookings.filter(b => b.status === 'active');
  const totalRevenue = myBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);

  const totalCapacity = mySpaces.reduce((sum, s) => sum + s.totalCapacity, 0);
  const totalAvailable = mySpaces.reduce((sum, s) => sum + s.availableCapacity, 0);
  const occupancy = totalCapacity > 0 ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100) : 0;

  const recentBookings = [...myBookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-moss text-sm mb-1">Space provider dashboard</p>
          <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>{currentUser.businessName || currentUser.name}</h1>
          <p className="text-moss text-sm mt-1">{mySpaces.length} space{mySpaces.length === 1 ? '' : 's'} listed</p>
        </div>
        <button
          onClick={() => navigate('provider-spaces')}
          className="btn-primary"
        >
          <Plus size={15} />
          <span>Add a space</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'My spaces', value: mySpaces.length, icon: Warehouse, color: 'text-eucalyptus' },
          { label: 'Active bookings', value: activeBookings.length, icon: CalendarDays, color: 'text-moss' },
          { label: 'Total revenue', value: `SAR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-soot' },
          { label: 'Occupancy', value: `${occupancy}%`, icon: Percent, color: 'text-mist' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-soot/8">
            <div className={`${s.color} mb-3`}><s.icon size={18} /></div>
            <div className="text-xl font-semibold text-soot">{s.value}</div>
            <div className="text-xs text-moss mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* My spaces */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soot">My spaces</h2>
            <button onClick={() => navigate('provider-spaces')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
              Manage all <ArrowRight size={12} />
            </button>
          </div>

          {mySpaces.length === 0 ? (
            <div className="bg-white rounded-2xl border border-soot/8 p-8 text-center">
              <Warehouse size={28} className="text-moss mx-auto mb-3" />
              <div className="text-sm text-moss mb-3">You haven't listed a space yet</div>
              <button onClick={() => navigate('provider-spaces')} className="px-4 py-2 rounded-xl bg-eucalyptus text-soot text-sm font-medium">
                Add your first space
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mySpaces.map(space => (
                <div key={space.id} className="bg-white rounded-2xl border border-soot/8 p-4">
                  <div className="flex items-start gap-3">
                    <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-soot text-sm">{space.name}</div>
                        {!space.isVisible && <span className="text-[10px] shrink-0 bg-soot/10 text-moss px-2 py-0.5 rounded-full">Hidden</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-moss mt-0.5"><MapPin size={10} />{space.city}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-moss">
                        <span>{space.availableCapacity}/{space.totalCapacity} available</span>
                        <span>SAR {space.pricing.daily}/day</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soot">Recent bookings</h2>
            <button onClick={() => navigate('provider-bookings')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>

          {recentBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-soot/8 p-8 text-center">
              <CalendarDays size={28} className="text-moss mx-auto mb-3" />
              <div className="text-sm text-moss">No bookings yet for your spaces</div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-soot/8 divide-y divide-soot/5">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <img src={b.spaceImage} alt={b.spaceName} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-soot truncate">{b.spaceName}</div>
                    <div className="text-xs text-moss truncate">{b.seats} seat{b.seats > 1 ? 's' : ''} · {b.plan}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    b.status === 'active' ? 'bg-eucalyptus/20 text-moss' : b.status === 'previous' ? 'bg-soot/10 text-moss' : 'bg-red-50 text-red-500'
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}