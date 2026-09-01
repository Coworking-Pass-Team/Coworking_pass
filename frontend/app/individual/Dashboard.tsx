'use client';
import { CalendarDays, MapPin, Search, Star, Clock, ArrowRight, Bookmark } from 'lucide-react';
import { useApp } from '@/app/store';

export default function IndividualDashboard() {
  const { currentUser, bookings, spaces, navigate, favorites } = useApp();
  if (!currentUser) return null;

  const myBookings = bookings.filter(b => b.userId === currentUser.id);
  const activeBookings = myBookings.filter(b => b.status === 'active');
  const favoriteSpaces = spaces.filter(s => favorites.includes(s.id) && s.isVisible).slice(0, 3);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-moss text-sm mb-1">{greeting()},</p>
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>{currentUser.name}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active bookings', value: activeBookings.length, color: 'text-eucalyptus', icon: CalendarDays, bg: 'bg-white border-soot/8' },
          { label: 'Total bookings', value: myBookings.length, color: 'text-soot', icon: Bookmark, bg: 'bg-white border-soot/8' },
          { label: 'Saved spaces', value: favorites.length, color: 'text-moss', icon: Star, bg: 'bg-white border-soot/8' },
          { label: 'Days booked', value: myBookings.filter(b => b.status !== 'cancelled').length * 3, color: 'text-soot', icon: Clock, bg: 'bg-mist/20 border-mist/40' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 border ${s.bg}`}>
            <div className={`${s.color} mb-3`}>
              <s.icon size={18} />
            </div>
            <div className="text-2xl font-semibold text-soot">{s.value}</div>
            <div className="text-xs text-moss mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>


      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soot">Active bookings</h2>
            <button onClick={() => navigate('my-bookings')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-soot/8 p-8 text-center">
              <CalendarDays size={28} className="text-moss mx-auto mb-2" />
              <div className="text-sm text-moss">No active bookings</div>
              <button onClick={() => navigate('browse')} className="mt-3 text-xs font-medium text-soot hover:underline">Browse spaces →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBookings.slice(0, 3).map(b => (
                <div
                  key={b.id}
                  onClick={() => navigate('booking-details', { bookingId: b.id })}
                  className="bg-white rounded-2xl border border-soot/8 p-4 cursor-pointer hover:border-eucalyptus/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img src={b.spaceImage} alt={b.spaceName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-soot text-sm truncate">{b.spaceName}</div>
                      <div className="flex items-center gap-1 text-xs text-moss mt-0.5">
                        <MapPin size={10} />
                        {b.spaceCity}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-moss">{b.startDate} → {b.endDate}</span>
                        <span className="text-xs font-medium bg-eucalyptus/15 text-moss px-2 py-0.5 rounded-full capitalize">{b.plan}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved spaces */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soot">Saved spaces</h2>
            <button onClick={() => navigate('browse')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
              Browse more <ArrowRight size={12} />
            </button>
          </div>

          {favoriteSpaces.length === 0 ? (
            <div className="bg-white rounded-2xl border border-soot/8 p-8 text-center">
              <Star size={28} className="text-moss mx-auto mb-2" />
              <div className="text-sm text-moss">No saved spaces yet</div>
              <button onClick={() => navigate('browse')} className="mt-3 text-xs font-medium text-soot hover:underline">Browse spaces →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {favoriteSpaces.map(space => (
                <div
                  key={space.id}
                  onClick={() => navigate('space-details', { spaceId: space.id })}
                  className="bg-white rounded-2xl border border-soot/8 p-4 cursor-pointer hover:border-eucalyptus/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-soot text-sm truncate">{space.name}</div>
                      <div className="flex items-center gap-1 text-xs text-moss mt-0.5">
                        <MapPin size={10} />
                        {space.city}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-xs text-moss">
                          <Star size={10} fill="#98AA9D" className="text-eucalyptus" />
                          {space.rating}
                        </div>
                        <span className="text-xs font-medium text-soot">SAR {space.pricing.daily}/day</span>
                      </div>
                    </div>
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
