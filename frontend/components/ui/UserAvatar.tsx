'use client';

import React, { useState } from 'react';
import { Camera } from 'lucide-react';

export const DEFAULT_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%"><circle cx="64" cy="64" r="64" fill="%23E2E8F0"/><circle cx="64" cy="46" r="22" fill="%2394A3B8"/><path d="M26 106c0-21 17-38 38-38s38 17 38 38v10H26v-10z" fill="%2394A3B8"/></svg>`;

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  onClick?: () => void;
  showCameraBadge?: boolean;
  onCameraClick?: () => void;
  alt?: string;
  ring?: boolean;
}

const sizeClasses = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 sm:w-28 sm:h-28 text-2xl',
  '3xl': 'w-28 h-28 sm:w-32 sm:h-32 text-3xl',
};

export default function UserAvatar({
  src,
  name = 'User',
  size = 'md',
  className = '',
  onClick,
  showCameraBadge = false,
  onCameraClick,
  alt,
  ring = false,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Check if src is valid custom image or empty / default
  const isDefaultOrEmpty =
    !src ||
    src === DEFAULT_AVATAR_SVG ||
    src === '/default-avatar.svg' ||
    src.trim() === '';
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative inline-block select-none ${className}`}>
      <div
        onClick={onClick}
        className={`relative ${sizeClass} rounded-full overflow-hidden flex items-center justify-center transition-all ${
          ring ? 'ring-4 ring-white shadow-md' : ''
        } ${onClick ? 'cursor-pointer hover:opacity-95 active:scale-95 group' : ''}`}
        style={{ backgroundColor: '#E2E8F0' }}
      >
        {!isDefaultOrEmpty && !imgError ? (
          <img
            src={src}
            alt={alt || name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          /* High-res minimal gray silhouette avatar matching the individual profile */
          <svg
            viewBox="0 0 128 128"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="64" cy="64" r="64" fill="#E2E8F0" />
            <circle cx="64" cy="46" r="21" fill="#94A3B8" />
            <path
              d="M26 106c0-21 17-38 38-38s38 17 38 38v10H26v-10z"
              fill="#94A3B8"
            />
          </svg>
        )}

        {onClick && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors rounded-full flex items-center justify-center">
            <Camera
              size={size === '2xl' || size === '3xl' ? 22 : 14}
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm"
            />
          </div>
        )}
      </div>

      {showCameraBadge && (
        <button
          type="button"
          onClick={onCameraClick || onClick}
          className="absolute bottom-0 right-0 p-2 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] shadow-md transition-all active:scale-90 border-2 border-white cursor-pointer"
          title="Change photo"
        >
          <Camera size={14} />
        </button>
      )}
    </div>
  );
}
