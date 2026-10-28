'use client';

import { useI18n } from '@/i18n';
import Link from 'next/link';
import { MapPin, Star, Check } from 'lucide-react';
import { Space, getEffectiveSpacePrice, isHourlyAllowed, getSpaceCategory } from '@/types';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';

interface LandingSpaceCardProps {
  space: Space;
}

export default function LandingSpaceCard({ space }: LandingSpaceCardProps) {
  const { t } = useI18n();
  const st = useSpaceText();
  const { navigate, currentUser } = useApp();

  const handleClick = (e: React.MouseEvent) => {
    if (typeof navigate === 'function') {
      // Allow navigation state sync within app store
      navigate('space-details', { spaceId: space.id });
    }
  };

  const hourly = isHourlyAllowed(space);
  const planInfo = getEffectiveSpacePrice(currentUser, space, hourly ? 'hourly' : 'daily');
  const fallbackImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format';
  const imageUrl = space.images && space.images.length > 0 ? space.images[0] : fallbackImage;

  const primaryPrice = hourly ? space.pricing?.hourly : space.pricing?.daily;
  const availability = space.availableCapacity === 0
    ? { label: t('landing.fullyBooked'), cls: 'bg-soot text-white' }
    : space.availableCapacity <= 5
    ? { label: t('landing.almostFull'), cls: 'bg-amber-100 text-amber-900' }
    : null;
  const tags = [
    t(`landing.category.${getSpaceCategory(space)}.title` as const),
    space.is24Hours ? t('landing.tag.allDay') : t('landing.tag.qr'),
  ];

  return (
    <Link
      href={`/spaces/${space.id}`}
      onClick={handleClick}
      className="group flex flex-col gap-4 p-2.5 pb-5 bg-white rounded-[28px] border border-zinc-200/70 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-float focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-label={t('landing.viewDetails', { name: st.name(space), city: st.city(space) })}
    >
      <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-plaster-dark">
        <img
          src={imageUrl}
          alt={st.name(space)}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute top-3 start-3 end-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="h-7 px-2.5 rounded-full bg-white/85 backdrop-blur-xl text-xs font-medium text-soot inline-flex items-center">
                {tag}
              </span>
            ))}
          </div>
          {/* Ratings are only shown for spaces that have reviews */}
          {(space.reviewCount ?? 0) > 0 && (
            <span className="h-7 px-2.5 rounded-full bg-soot text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0">
              <Star size={12} fill="#FBBF24" stroke="#FBBF24" />
              {space.rating}
            </span>
          )}
        </div>
        {availability && (
          <span className={`absolute bottom-3 start-3 h-7 px-2.5 rounded-full text-xs font-semibold inline-flex items-center ${availability.cls}`}>
            {availability.label}
          </span>
        )}
      </div>

      <div className="px-2.5 flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold text-soot leading-snug truncate">{st.name(space)}</h3>
        <div className="flex items-center gap-1.5 text-sm text-soot-light min-w-0">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{st.location(space)}</span>
        </div>
      </div>

      <div className="mx-2.5 pt-3.5 border-t border-zinc-200/70 flex items-center justify-between gap-3">
        {planInfo.isCovered ? (
          <span className="text-sm text-soot-light">
            {primaryPrice ? `${t('common.sar')} ${primaryPrice}` : ''} {primaryPrice ? (hourly ? t('space.perHour') : t('space.perDay')) : ''}
          </span>
        ) : planInfo.hasDiscount ? (
          <span className="text-[15px]">
            <span className="font-semibold text-soot">{t('common.sar')} {planInfo.effectivePrice}</span>
            <span className="text-soot-light"> · {t('space.percentOff', { percent: planInfo.discountPercentage ?? 0 })}</span>
          </span>
        ) : primaryPrice ? (
          <span className="text-[15px]">
            <span className="font-semibold text-soot">{t('common.sar')} {primaryPrice}</span>
            <span className="text-soot-light"> {hourly ? t('space.perHour') : t('space.perDay')}</span>
          </span>
        ) : (
          <span className="text-sm text-soot-light">{t('landing.contactForPrice')}</span>
        )}
        {planInfo.isCovered ? (
          <span className="h-7 px-2.5 rounded-full bg-accent-soft text-accent text-xs font-semibold inline-flex items-center gap-1 shrink-0">
            <Check size={13} strokeWidth={2.4} />
            {t('space.included')}
          </span>
        ) : !hourly && space.pricing?.monthly ? (
          <span className="text-xs text-soot-light shrink-0">
            {t('common.sar')} {space.pricing.monthly.toLocaleString()} {t('spaceDetails.perMonth')}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
