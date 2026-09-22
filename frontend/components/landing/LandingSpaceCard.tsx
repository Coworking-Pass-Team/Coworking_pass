'use client';

import Link from 'next/link';
import { MapPin, Star, Check } from 'lucide-react';
import { Space, getEffectiveSpacePrice } from '@/types/types';
import { useApp } from '@/app/store';
import Badge from '@/components/ui/Badge';

interface LandingSpaceCardProps {
  space: Space;
}

export default function LandingSpaceCard({ space }: LandingSpaceCardProps) {
  const { navigate, currentUser } = useApp();

  const handleClick = (e: React.MouseEvent) => {
    if (typeof navigate === 'function') {
      // Allow navigation state sync within app store
      navigate('space-details', { spaceId: space.id });
    }
  };

  const planInfo = getEffectiveSpacePrice(currentUser, space, 'daily');
  const fallbackImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format';
  const imageUrl = space.images && space.images.length > 0 ? space.images[0] : fallbackImage;

  return (
    <Link
      href={`/spaces/${space.id}`}
      onClick={handleClick}
      className="group block bg-plaster-dark/40 hover:bg-plaster-dark/80 rounded-3xl border border-soot/12 overflow-hidden transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
      aria-label={`View details for ${space.name} in ${space.city}`}
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={space.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-soot/20 to-transparent" />
        
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-semibold text-lg leading-snug font-serif-display truncate">
            {space.name}
          </h3>
          <div className="flex items-center gap-1.5 text-plaster/90 text-xs font-medium mt-1 truncate">
            <MapPin size={13} className="text-eucalyptus shrink-0" />
            <span className="truncate">{space.city} • {space.address}</span>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-plaster-surface/95 backdrop-blur-md rounded-2xl px-3 py-1.5 text-center border border-soot/12 shadow-xs">
          {planInfo.isCovered ? (
            <div className="flex items-center gap-1 text-soot font-bold text-xs">
              <Check size={12} className="text-moss shrink-0" />
              <span>Included</span>
            </div>
          ) : planInfo.hasDiscount ? (
            <div>
              <div className="text-soot font-bold text-xs">SAR {planInfo.effectivePrice}</div>
              <div className="text-moss text-[9px] font-medium">{planInfo.discountPercentage}% Off</div>
            </div>
          ) : (
            <>
              <div className="text-soot font-bold text-sm">
                {space.pricing?.daily ? `SAR ${space.pricing.daily}` : 'Contact for price'}
              </div>
              <div className="text-moss text-[10px] font-medium">/ day</div>
            </>
          )}
        </div>
      </div>

      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-soot font-semibold">
          <Star size={14} fill="currentColor" className="text-eucalyptus shrink-0" />
          <span>{space.rating}</span>
          <span className="text-moss font-normal text-xs">({space.reviewCount} reviews)</span>
        </div>
        <Badge variant={space.availableCapacity === 0 ? 'danger' : space.availableCapacity <= 5 ? 'warning' : 'eucalyptus'}>
          {space.availableCapacity === 0 ? 'Fully Booked' : space.availableCapacity <= 5 ? 'Almost Full' : 'Available'}
        </Badge>
      </div>
    </Link>
  );
}
