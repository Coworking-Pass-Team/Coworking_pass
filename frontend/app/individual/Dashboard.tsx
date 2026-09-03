'use client';

import React from 'react';
import { CalendarDays, MapPin, Star, Clock, ArrowRight, Bookmark, Check } from 'lucide-react';
import { useApp } from '@/app/store';
import { isUserPassHolder, getEffectiveSpacePrice } from '@/types/types';

export default function IndividualDashboard() {
  const { currentUser, bookings, spaces, navigate, favorites } = useApp();
  const passActive = isUserPassHolder(currentUser);
  if (!currentUser) return null;

  const myBookings = bookings.filter(b => b.userId === currentUser.id);
  const activeBookings = myBookings.filter(b => b.status === 'active');
  const favoriteSpaces = spaces.filter(s => favorites.includes(s.id) && s.isVisible);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
      {/* Welcome Header */}
      <div className="mb-8">
        <p className="text-moss text-base font-normal mb-1">{greeting()},</p>
        <h1 className="text-4xl sm:text-5xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
          {currentUser.name}
        </h1>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        {/* Active bookings */}
        <div className="bg-white rounded-3xl p-6 border border-soot/8 shadow-sm flex flex-col justify-between h-36">
          <div className="text-moss">
            <CalendarDays size={22} className="stroke-[1.5]" />
          </div>
          <div>
            <div className="text-3xl font-semibold text-soot leading-none mb-1.5">{activeBookings.length}</div>
            <div className="text-xs sm:text-sm text-moss font-medium">Active bookings</div>
          </div>
        </div>

        {/* Total bookings */}
        <div className="bg-white rounded-3xl p-6 border border-soot/8 shadow-sm flex flex-col justify-between h-36">
          <div className="text-moss">
            <Bookmark size={22} className="stroke-[1.5]" />
          </div>
          <div>
            <div className="text-3xl font-semibold text-soot leading-none mb-1.5">{myBookings.length}</div>
            <div className="text-xs sm:text-sm text-moss font-medium">Total bookings</div>
          </div>
        </div>

        {/* Saved spaces */}
        <div className="bg-white rounded-3xl p-6 border border-soot/8 shadow-sm flex flex-col justify-between h-36">
          <div className="text-moss">
            <Star size={22} className="stroke-[1.5]" />
          </div>
          <div>
            <div className="text-3xl font-semibold text-soot leading-none mb-1.5">{favorites.length}</div>
            <div className="text-xs sm:text-sm text-moss font-medium">Saved spaces</div>
          </div>
        </div>

        {/* Days booked */}
        <div className="bg-[#E5ECE9] rounded-3xl p-6 border border-eucalyptus/20 shadow-sm flex flex-col justify-between h-36">
          <div className="text-moss">
            <Clock size={22} className="stroke-[1.5]" />
          </div>
          <div>
            <div className="text-3xl font-semibold text-soot leading-none mb-1.5">
              {myBookings.filter(b => b.status !== 'cancelled').length * 3}
            </div>
            <div className="text-xs sm:text-sm text-moss font-medium">Days booked</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active bookings & Saved spaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Active bookings column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Active bookings
            </h2>
            <button
              onClick={() => navigate('my-bookings')}
              className="text-sm font-medium text-moss hover:text-soot flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-soot/8 p-12 text-center shadow-sm min-h-[220px] flex flex-col items-center justify-center">
              <CalendarDays size={32} className="text-moss stroke-[1.5] mx-auto mb-3" />
              <div className="text-base font-semibold text-soot mb-2">No active bookings</div>
              <button
                onClick={() => navigate('browse')}
                className="text-sm font-medium text-moss hover:text-soot flex items-center gap-1 transition-colors"
              >
                Browse spaces →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.slice(0, 3).map(b => (
                <div
                  key={b.id}
                  onClick={() => navigate('booking-details', { bookingId: b.id })}
                  className="bg-white rounded-2xl border border-soot/8 p-4 shadow-sm hover:shadow-md hover:border-eucalyptus/40 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={b.spaceImage} alt={b.spaceName} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-soot text-base truncate">{b.spaceName}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5">
                        <MapPin size={12} />
                        <span>{b.spaceCity}</span>
                        <span>•</span>
                        <span>{b.startDate} → {b.endDate}</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="text-[11px] font-medium bg-eucalyptus/20 text-moss px-2 py-0.5 rounded-full capitalize">
                          {b.plan} pass • {b.seats} seat{b.seats > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-semibold text-soot">SAR {b.totalPrice.toLocaleString()}</div>
                    <span className="text-xs text-moss">Confirmed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved spaces column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Saved spaces
            </h2>
            <button
              onClick={() => navigate('browse')}
              className="text-sm font-medium text-moss hover:text-soot flex items-center gap-1 transition-colors"
            >
              Browse more <ArrowRight size={14} />
            </button>
          </div>

          {favoriteSpaces.length === 0 ? (
            <div className="bg-white rounded-3xl border border-soot/8 p-12 text-center shadow-sm min-h-[220px] flex flex-col items-center justify-center">
              <Star size={32} className="text-moss stroke-[1.5] mx-auto mb-3" />
              <div className="text-base font-semibold text-soot mb-2">No saved spaces yet</div>
              <button
                onClick={() => navigate('browse')}
                className="text-sm font-medium text-moss hover:text-soot flex items-center gap-1 transition-colors"
              >
                Browse spaces →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteSpaces.map(space => (
                <div
                  key={space.id}
                  onClick={() => navigate('space-details', { spaceId: space.id })}
                  className="bg-white rounded-2xl border border-soot/8 p-4 shadow-sm hover:shadow-md hover:border-eucalyptus/40 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={space.images[0]}
                      alt={space.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-soot text-base truncate">{space.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-moss mt-0.5">
                        <MapPin size={12} />
                        <span>{space.city}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-moss mt-1 font-medium">
                        <Star size={12} fill="#98AA9D" className="text-eucalyptus" />
                        <span>{space.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {(() => {
                      const planInfo = getEffectiveSpacePrice(currentUser, space, 'daily');
                      if (planInfo.isCovered) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eucalyptus/30 text-soot font-semibold text-[11px] border border-eucalyptus/40 shadow-2xs">
                            <Check size={11} className="text-moss shrink-0" />
                            <span>Included in Pass</span>
                          </span>
                        );
                      }
                      if (planInfo.hasDiscount) {
                        return (
                          <div>
                            <div className="text-sm font-semibold text-soot">SAR {planInfo.effectivePrice}/day</div>
                            <div className="text-[10px] text-amber-900 font-semibold">{planInfo.discountPercentage}% Pass Discount</div>
                          </div>
                        );
                      }
                      return <div className="text-sm font-semibold text-soot">SAR {space.pricing.daily}/day</div>;
                    })()}
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
