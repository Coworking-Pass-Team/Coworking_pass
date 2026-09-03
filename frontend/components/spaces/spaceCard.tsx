'use client';

import { Heart, MapPin, Star, Users, Check } from 'lucide-react';
import { Space, BookingPlan, getEffectiveSpacePrice } from '@/types/types';
import { useApp } from '@/app/store';
import Badge from '@/components/ui/Badge';

interface SpaceCardProps {
  space: Space;
  onSelect: (space: Space) => void;
}

export default function SpaceCard({ space, onSelect }: SpaceCardProps) {
  const { favorites, toggleFavorite, currentUser } = useApp();
  const isFav = favorites.includes(space.id);
  const userTier = (currentUser?.membershipTier || '').toLowerCase();
  const userPlan: BookingPlan = userTier.includes('yearly') || userTier.includes('enterprise') || userTier.includes('all-access')
    ? 'yearly'
    : userTier.includes('monthly') || userTier.includes('pro')
    ? 'monthly'
    : 'daily';

  const planInfo = getEffectiveSpacePrice(currentUser, space, userPlan);

  const availability = space.availableCapacity === 0
    ? { label: 'Fully Booked', variant: 'danger' as const }
    : space.availableCapacity <= 5
    ? { label: 'Limited', variant: 'warning' as const }
    : { label: 'Available', variant: 'eucalyptus' as const };

  return (
    <div
      className="bg-plaster-dark/40 hover:bg-plaster-dark/80 rounded-3xl overflow-hidden shadow-xs transition-colors duration-200 cursor-pointer group border border-soot/12 flex flex-col justify-between active:scale-[0.99] w-full"
      onClick={() => onSelect(space)}
    >
      {/* Image Thumbnail */}
      <div className="relative overflow-hidden h-48 sm:h-52">
        <img
          src={space.images?.[0] ? space.images[0] : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'}
          alt={space.name || 'Workspace'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-soot/60 via-transparent to-black/10" />

        {/* Top-left Status Badge */}
        <div className="absolute top-3.5 left-3.5">
          <Badge variant={availability.variant} className="shadow-xs text-xs font-semibold px-3 py-1 bg-white/95 backdrop-blur-md">
            {availability.label}
          </Badge>
        </div>

        {/* Top-right Favorite Button */}
        {currentUser && (
          <button
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-sm transition-transform active:scale-90"
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
            <h3 className="font-semibold text-soot text-sm sm:text-base leading-snug group-hover:text-moss transition-colors line-clamp-1 flex-1 min-w-0">
              {space.name}
            </h3>
            <div className="text-right shrink-0">
              {planInfo.isCovered ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eucalyptus/30 text-soot font-semibold text-[11px] border border-eucalyptus/40 shadow-2xs whitespace-nowrap">
                  <Check size={11} className="text-moss shrink-0" />
                  <span>Included in Pass</span>
                </span>
              ) : planInfo.hasDiscount ? (
                <div>
                  <div className="text-soot font-semibold text-xs sm:text-sm">SAR {planInfo.effectivePrice}</div>
                  <div className="text-moss text-[10px] font-medium font-mono">{planInfo.discountPercentage}% Pass Discount</div>
                </div>
              ) : (
                <>
                  <div className="text-soot font-semibold text-xs sm:text-sm">SAR {space.pricing.daily}</div>
                  <div className="text-moss text-[10px] sm:text-[11px] font-normal">/ day</div>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-moss text-xs mb-3">
            <MapPin size={13} className="shrink-0" />
            <span>{space.city}</span>
          </div>

          {/* Amenities Chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {space.amenities.slice(0, 2).map(a => (
              <span
                key={a}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F2EFE8] text-soot/80 font-medium border border-soot/5"
              >
                {a}
              </span>
            ))}
            {space.amenities.length > 2 && (
              <span className="text-[11px] px-2 py-1 rounded-lg bg-[#F2EFE8] text-moss font-medium border border-soot/5">
                +{space.amenities.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Capacity Footer */}
        <div className="flex items-center gap-1.5 text-xs text-moss pt-3 border-t border-soot/6">
          <Users size={13} />
          <span>{space.availableCapacity}/{space.totalCapacity} available</span>
        </div>
      </div>
    </div>
  );
}
