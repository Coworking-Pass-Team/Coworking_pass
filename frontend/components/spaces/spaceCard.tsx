'use client';
import { Heart, MapPin, Star, Users } from 'lucide-react';
import { Space } from '@/types/types';
import { useApp } from '@/app/store';


interface SpaceCardProps {
  space: Space;
  onSelect: (space: Space) => void;
}

export default function SpaceCard({ space, onSelect }: SpaceCardProps) {
  const { favorites, toggleFavorite, currentUser } = useApp();
  const isFav = favorites.includes(space.id);

  const availability = space.availableCapacity === 0
    ? { label: 'Fully Booked', color: 'text-red-500 bg-red-50' }
    : space.availableCapacity <= 5
    ? { label: 'Limited', color: 'mist-badge' }
    : { label: 'Available', color: 'text-moss bg-eucalyptus/20' };

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-soot/5"
      onClick={() => onSelect(space)}
    >
      <div className="relative overflow-hidden h-48">
        <img
          src={space.images[0]}
          alt={space.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-soot/30 to-transparent" />
        <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full ${availability.color}`}>
          {availability.label}
        </span>
        {currentUser && (
          <button
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors"
            onClick={e => { e.stopPropagation(); toggleFavorite(space.id); }}
          >
            <Heart size={14} fill={isFav ? '#98AA9D' : 'none'} stroke={isFav ? '#98AA9D' : '#2D3536'} />
          </button>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs">
          <Star size={11} fill="white" />
          <span>{space.rating}</span>
          <span className="opacity-70">({space.reviewCount})</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-soot text-[15px] leading-snug">{space.name}</h3>
            <div className="flex items-center gap-1 mt-1 text-moss text-xs">
              <MapPin size={11} />
              <span>{space.city}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-soot font-semibold text-sm">SAR {space.pricing.daily}</div>
            <div className="text-moss text-xs">/ day</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {space.amenities.slice(0, 3).map(a => (
            <span key={a} className="text-[11px] px-2 py-0.5 rounded-full mist-hover text-moss border border-soot/5">
              {a}
            </span>
          ))}
          {space.amenities.length > 3 && (
            <span className="text-[11px] text-moss">+{space.amenities.length - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-3 text-xs text-moss">
          <Users size={11} />
          <span>{space.availableCapacity}/{space.totalCapacity} available</span>
        </div>
      </div>
    </div>
  );
}
