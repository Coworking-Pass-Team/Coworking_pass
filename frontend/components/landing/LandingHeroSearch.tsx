'use client';

import { useI18n } from '@/i18n';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown, Check, Search } from 'lucide-react';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import { SAUDI_CITIES, SpaceCategory } from '@/types';

const CITIES = ['All Cities', ...SAUDI_CITIES];

type Access = 'pass' | 'hourly';

// Offices are booked by the day/month/year (and covered by passes); halls and theaters by the hour
const CATEGORIES_BY_ACCESS: Record<Access, SpaceCategory[]> = {
  pass: ['office'],
  hourly: ['hall', 'theater'],
};
const ALL_CATEGORIES: SpaceCategory[] = ['office', 'hall', 'theater'];

export default function LandingHeroSearch() {
  const { t } = useI18n();
  const st = useSpaceText();
  const router = useRouter();
  const { navigate } = useApp();
  const [searchCity, setSearchCity] = useState('');
  const [access, setAccess] = useState<Access>('pass');
  const [category, setCategory] = useState<SpaceCategory>('office');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pickAccess = (next: Access) => {
    setAccess(next);
    if (!CATEGORIES_BY_ACCESS[next].includes(category)) setCategory(CATEGORIES_BY_ACCESS[next][0]);
  };

  const pickCategory = (next: SpaceCategory) => {
    setCategory(next);
    setAccess(next === 'office' ? 'pass' : 'hourly');
  };

  const handleSearch = () => {
    const targetCity = searchCity === 'All Cities' ? '' : searchCity;
    // Update store state if within SPA session
    if (typeof navigate === 'function') {
      navigate('browse', { city: targetCity, category });
    }
    // Also push real URL route for navigation & history
    const params = new URLSearchParams();
    if (targetCity) params.set('city', targetCity);
    params.set('category', category);
    router.push(`/spaces?${params.toString()}`);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full">
      <form
        role="search"
        onSubmit={e => {
          e.preventDefault();
          handleSearch();
        }}
        className="ui-glass relative z-40 w-full flex flex-col lg:flex-row lg:items-center gap-1 p-2.5 rounded-[28px] lg:rounded-full text-start"
      >
        {/* City */}
        <div className="relative lg:flex-[1_1_200px] min-w-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex flex-col gap-1 px-5 py-2.5 rounded-3xl lg:rounded-full hover:bg-zinc-100/70 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label={t('landing.selectCity')}
          >
            <span className="text-xs font-semibold text-soot">{t('landing.search.where')}</span>
            <span className="flex items-center justify-between gap-2 min-w-0">
              <span className="flex items-center gap-2 min-w-0">
                <MapPin size={15} className="text-moss shrink-0" />
                <span className="text-[15px] text-soot-light truncate">
                  {searchCity ? st.cityName(searchCity) : t('browse.allCities')}
                </span>
              </span>
              <ChevronDown
                size={15}
                className={`text-moss transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180 text-soot' : ''}`}
              />
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full start-0 w-full min-w-56 mt-2 p-1.5 bg-white border border-zinc-200/70 rounded-2xl shadow-float z-50 animate-reveal">
              <div className="max-h-60 overflow-y-auto space-y-0.5" role="listbox">
                {CITIES.map(city => {
                  const isSelected = (city === 'All Cities' && !searchCity) || searchCity === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSearchCity(city === 'All Cities' ? '' : city);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                        isSelected ? 'bg-soot text-white' : 'text-soot hover:bg-zinc-100'
                      }`}
                    >
                      <span>{city === 'All Cities' ? t('browse.allCities') : st.cityName(city)}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <span aria-hidden="true" className="hidden lg:block w-px h-9 bg-zinc-200" />

        {/* Space category */}
        <div className="lg:flex-[2_1_320px] min-w-0 px-3 py-1.5 flex flex-col gap-1.5">
          <span id="hero-space-label" className="text-xs font-semibold text-soot px-2">{t('landing.search.space')}</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="hero-space-label">
            {ALL_CATEGORIES.map(c => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pickCategory(c)}
                  className={`h-9 px-3.5 rounded-full text-[13px] font-medium border transition-colors ${
                    active
                      ? 'bg-soot border-soot text-white'
                      : 'bg-transparent border-zinc-200 text-soot-light hover:border-zinc-300 hover:text-soot'
                  }`}
                >
                  {t(`landing.category.${c}.title` as const)}
                </button>
              );
            })}
          </div>
        </div>

        <span aria-hidden="true" className="hidden lg:block w-px h-9 bg-zinc-200" />

        {/* Booking mode */}
        <div className="lg:flex-[1_1_230px] min-w-0 px-3 py-1.5 flex flex-col gap-1.5">
          <span id="hero-access-label" className="text-xs font-semibold text-soot px-2">{t('landing.search.access')}</span>
          <div className="flex w-fit p-1 rounded-full bg-zinc-100" role="group" aria-labelledby="hero-access-label">
            {(['pass', 'hourly'] as Access[]).map(a => {
              const active = access === a;
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pickAccess(a)}
                  className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-all ${
                    active ? 'bg-white text-soot shadow-sm' : 'text-soot-light hover:text-soot'
                  }`}
                >
                  {t(`landing.search.${a}` as const)}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="h-14 px-7 rounded-full bg-accent text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 shrink-0 shadow-glow hover:bg-emerald-800 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/30"
        >
          <Search size={18} strokeWidth={2.2} />
          <span>{t('landing.findSpaces')}</span>
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-soot-light">
        {t(access === 'hourly' ? 'landing.search.hintHourly' : 'landing.search.hintPass')}
      </p>
    </div>
  );
}
