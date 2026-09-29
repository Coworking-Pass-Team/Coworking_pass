'use client';

import { useApp } from '@/app/store';
import { useI18n, pickLocalized } from '@/i18n';
import { SAUDI_CITIES_DATA, type Space } from '@/types/types';

/**
 * Localized text of workspaces (dynamic content). Providers/admins author both languages; in Arabic mode the
 * Arabic value is shown when present and the English one is the graceful fallback.
 * Bookings only carry a copied name string, so `bookingName` resolves the workspace by id first.
 */
export function useSpaceText() {
  const { lang, t } = useI18n();
  const { spaces } = useApp();

  const byId = (id?: string) => (id ? spaces.find((s) => s.id === id) : undefined);

  const name = (space?: Pick<Space, 'name' | 'nameAr'> | null) => pickLocalized(lang, space?.name, space?.nameAr);
  const description = (space?: Pick<Space, 'description' | 'descriptionAr'> | null) =>
    pickLocalized(lang, space?.description, space?.descriptionAr);
  const address = (space?: Pick<Space, 'address' | 'addressAr'> | null) =>
    pickLocalized(lang, space?.address, space?.addressAr);

  /** City: provider-authored Arabic city first, then the standard Saudi cities list, then the raw value. */
  const cityName = (city?: string | null, cityAr?: string | null) => {
    if (!city) return '';
    if (lang !== 'ar') return city;
    if (cityAr && cityAr.trim()) return cityAr;
    // Common spelling variants used in stored data
    const aliases: Record<string, string> = { mecca: 'makkah', medina: 'madinah', 'al khobar': 'khobar', 'al-khobar': 'khobar' };
    const normalized = city.trim().toLowerCase();
    const wanted = aliases[normalized] ?? normalized;
    const known = SAUDI_CITIES_DATA.find((c) => c.name.toLowerCase() === wanted);
    return known?.nameAr || city;
  };
  /** Localized label of a space type such as 'hot-desk' or 'theater'. */
  const typeLabel = (type?: string | null) => {
    if (!type) return '';
    const key = `spaceTypes.${type}`;
    const translated = t(key as never);
    return translated === key ? type.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : translated;
  };
  const city = (space?: Pick<Space, 'city' | 'cityAr'> | null) => cityName(space?.city, space?.cityAr);

  /** Standard amenities (stored as English names) are translated; custom ones stay as typed. */
  const amenity = (name?: string | null) => {
    if (!name) return '';
    const key = `amenities.${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
    const translated = t(key as never);
    return translated === key ? name : translated;
  };

  const bookingName = (b: { spaceId?: string; spaceName?: string }) => {
    const space = byId(b.spaceId);
    return space ? name(space) : b.spaceName || '';
  };
  const bookingCity = (b: { spaceId?: string; spaceCity?: string }) => {
    const space = byId(b.spaceId);
    return space ? city(space) : cityName(b.spaceCity);
  };

  return { name, description, address, city, cityName, typeLabel, amenity, bookingName, bookingCity, byId };
}
