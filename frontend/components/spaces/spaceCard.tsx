'use client';

import { Heart, MapPin, Star, Users, Check, Navigation } from 'lucide-react';
import { Space, BookingPlan, getEffectiveSpacePrice, isHourlyAllowed, formatDistance } from '@/types/types';
import { useApp } from '@/app/store';

interface SpaceCardProps {
  space: Space;
  distance?: number | null;
  onSelect: (space: Space) => void;
}

export default function SpaceCard({ space, distance, onSelect }: SpaceCardProps) {
  const { favorites, toggleFavorite, currentUser, getSpaceCrowding } = useApp();
  const isFav = favorites.includes(space.id);
  const userTier = (currentUser?.membershipTier || '').toLowerCase();
  const userPlan: BookingPlan = userTier.includes('yearly') || userTier.includes('enterprise') || userTier.includes('all-access')
    ? 'yearly'
    : userTier.includes('monthly') || userTier.includes('pro')
    ? 'monthly'
    : 'daily';

  const planInfo = getEffectiveSpacePrice(currentUser, space, userPlan);

  // Live crowding calculation connected to QR code check-in scans
  const crowding = getSpaceCrowding ? getSpaceCrowding(space) : {
    scannedCount: 0,
    totalCapacity: space.totalCapacity || 30,
    availableCapacity: space.availableCapacity ?? 15,
    occupiedSeats: (space.totalCapacity || 30) - (space.availableCapacity ?? 15),
    occupancyPercentage: 50,
    level: 'Moderate' as const,
    badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-200/90',
    barColor: 'bg-[#D97706]',
    textColor: 'text-[#D97706]',
    trackColor: 'bg-[#E5EBE7]',
  };

  const isAlmostFull = crowding.availableCapacity > 0 && crowding.availableCapacity <= 5;
  const isFullyBooked = crowding.availableCapacity === 0 || crowding.level === 'Busy';

  const availability = isFullyBooked
    ? { label: 'Limited', badgeClass: 'bg-soot/80 text-white border-white/10 backdrop-blur-md font-semibold' }
    : isAlmostFull
    ? { label: 'Limited', badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-200/90 backdrop-blur-md font-semibold' }
    : { label: 'Available', badgeClass: 'bg-white/90 text-soot border-soot/10 backdrop-blur-md font-semibold' };

  const formattedDist = distance !== undefined && distance !== null && !isNaN(distance)
    ? formatDistance(distance)
    : '';

  const amenitiesList = Array.isArray(space.amenities) ? space.amenities : [];

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group border border-soot/10 flex flex-col justify-between active:scale-[0.99] w-full"
      onClick={() => onSelect(space)}
    >
      {/* Image Thumbnail */}
      <div className="relative overflow-hidden h-48 sm:h-52 bg-soot/5">
        <img
          src={space.images?.[0] ? space.images[0] : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
          alt={space.name || 'Workspace'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-soot/60 via-transparent to-black/10" />

        {/* Top-left Status Badge */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 flex-wrap max-w-[85%]">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border shadow-xs backdrop-blur-md ${availability.badgeClass}`}>
            {availability.label}
          </span>
        </div>

        {/* Top-right Favorite Button */}
        {currentUser && (
          <button
            type="button"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              toggleFavorite(space.id);
            }}
          >
            <Heart
              size={15}
              fill={isFav ? '#98AA9D' : 'none'}
              stroke={isFav ? '#98AA9D' : '#2D3536'}
              className="transition-colors"
            />
          </button>
        )}

        {/* Bottom-left Rating Overlay */}
        <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 text-white text-xs font-medium drop-shadow-sm">
          <Star size={12} fill="#FDB813" stroke="#FDB813" />
          <span>{space.rating}</span>
          <span className="opacity-80">({space.reviewCount})</span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title and Price */}
          <div className="flex items-start justify-between gap-2.5 mb-1.5">
            <h3 className="font-semibold text-soot text-sm sm:text-base leading-snug group-hover:text-emerald-950 transition-colors line-clamp-1 flex-1 min-w-0">
              {space.name}
            </h3>
            <div className="text-right shrink-0">
              {planInfo.isCovered ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eucalyptus/30 text-soot font-semibold text-[11px] border border-eucalyptus/40 shadow-2xs whitespace-nowrap">
                  <Check size={11} className="text-moss shrink-0" />
                  <span>Included</span>
                </span>
              ) : planInfo.hasDiscount ? (
                <div>
                  <div className="text-soot font-bold text-xs sm:text-sm">SAR {planInfo.effectivePrice}</div>
                  <div className="text-moss text-[10px] font-medium font-mono">{planInfo.discountPercentage}% Off</div>
                </div>
              ) : (
                <>
                  {/* حماية استخراج السعر */}
                  <div className="text-soot font-bold text-xs sm:text-sm">
                    SAR {isHourlyAllowed(space) ? (space.pricing?.hourly ?? 150) : (space.pricing?.daily ?? 0)}
                  </div>
                  <div className="text-moss text-[10px] sm:text-[11px] font-normal block -mt-0.5">
                    {isHourlyAllowed(space) ? '/ hour' : '/ day'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location and Distance */}
          <div className="flex items-center gap-3 text-moss text-xs mb-3 flex-wrap">
            <div className="flex items-center gap-1 truncate">
              <MapPin size={12} className="shrink-0 text-moss" />
              <span className="truncate">{space.city}</span>
            </div>
            {formattedDist && (
              <div className="flex items-center gap-1 text-moss text-xs">
                <Navigation size={11} className="shrink-0 text-moss" />
                <span>{formattedDist}</span>
              </div>
            )}
          </div>

          {/* Amenities Chips (تمت الحماية باستخدام amenitiesList) */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
            {amenitiesList.slice(0, 3).map(a => (
              <span
                key={typeof a === 'string' ? a : (a as any)?.name}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F5F3ED] text-soot/80 font-medium border border-soot/5"
              >
                {typeof a === 'string' ? a : (a as any)?.name}
              </span>
            ))}
            {amenitiesList.length > 3 && (
              <span className="text-[11px] px-2 py-1 rounded-lg bg-[#F5F3ED] text-moss font-medium border border-soot/5">
                +{amenitiesList.length - 3}
              </span>
            )}
          </div>

          {/* Available Capacity */}
          <div className="flex items-center gap-1.5 text-xs text-moss mb-3">
            <Users size={13} className="text-moss shrink-0" />
            <span>{crowding.availableCapacity}/{crowding.totalCapacity} available</span>
          </div>
        </div>

        {/* Crowding Indicator Progress Bar Matching Screenshot */}
        <div className="space-y-1.5 pt-3 border-t border-soot/6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-moss font-normal">Capacity</span>
            <span className={`font-semibold text-xs ${crowding.textColor}`}>
              {crowding.level}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#E5EBE7] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${crowding.barColor}`}
              style={{
                width: `${
                  crowding.level === 'Busy'
                    ? 100
                    : Math.min(100, Math.max(10, crowding.occupancyPercentage))
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
