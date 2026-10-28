'use client';
import { useI18n } from '@/i18n';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, X, MapPin, ChevronDown, Check, ArrowUpDown, Sparkles, Building2, Presentation, Clapperboard, LayoutGrid, Navigation, Loader2, MapPinOff, Info } from 'lucide-react';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';
import SpaceCard from '@/components/spaces/SpaceCard';
import Badge from '@/components/ui/Badge';
import App from '@/app/app';
import { WithChrome } from '@/components/layout/Chrome';
import { ALL_SPACE_TYPES, getSpaceCategory, normalizeSpaceType, SpaceCategory, calculateHaversineDistance, getSpaceCoordinates, SAUDI_CITIES } from '@/types';

const CITIES = ['All Cities', ...SAUDI_CITIES];
const CATEGORY_TABS: { id: 'all' | SpaceCategory; label: string; icon: any }[] = [
  { id: 'all', label: 'All Spaces', icon: LayoutGrid },
  { id: 'office', label: 'Offices', icon: Building2 },
  { id: 'hall', label: 'Halls', icon: Presentation },
  { id: 'theater', label: 'Theaters', icon: Clapperboard },
];

const ALL_TYPES = [
  { id: 'all', label: 'All Types' },
  ...ALL_SPACE_TYPES.map(t => ({ id: t.value as string, label: t.label })),
];

const AMENITIES = ['WiFi', 'Coffee', 'Printer', 'Parking', 'Prayer Room', 'Meeting Rooms', 'Projector', 'Sound System'];
const SORT_OPTIONS = [
  'Recommended',
  'Nearest to Me',
  'Price: Low to High',
  'Price: High to Low',
  'Rating',
  'Availability',
];

/**
 * Route entry for /spaces. Rendered by Next outside the SPA router, so any navigation to another
 * screen (space details, login, ...) must be handed to the SPA router or it would have no visible effect.
 */
export default function Browse() {
  const { nav } = useApp();
  const screen = nav?.screen;
  if (screen && screen !== 'landing' && screen !== 'browse') {
    return <App />;
  }
  // Opened as its own route (/spaces) it draws the header and footer itself; inside the app shell it does not
  return (
    <WithChrome>
      <BrowseView />
    </WithChrome>
  );
}

function BrowseView() {
  const { t, translateMessage } = useI18n();
  const st = useSpaceText();
  const { spaces, spacesLoaded, navigate, currentUser, nav, userLocation, locationStatus, locationErrorMessage, requestUserLocation } = useApp();
  const initialCity = nav?.params?.city || (typeof window !== 'undefined' ? (window as any).__browseCity || '' : '');
  const initialCategory = (nav?.params?.category as ('all' | SpaceCategory)) || 'all';

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SpaceCategory>(initialCategory);
  const [city, setCity] = useState(initialCity === 'All Cities' ? '' : initialCity);
  const [spaceType, setSpaceType] = useState('all');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState(userLocation ? 'Nearest to Me' : 'Recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [dismissedLocationBanner, setDismissedLocationBanner] = useState(false);

  const hasAutoPromptedRef = useRef(false);

  useEffect(() => {
    if (hasAutoPromptedRef.current) return;
    hasAutoPromptedRef.current = true;

    if (userLocation) {
      setSort('Nearest to Me');
      return;
    }

    const storedStatus = typeof window !== 'undefined' ? sessionStorage.getItem('coworking_location_status') : null;
    if (storedStatus === 'denied' || storedStatus === 'unavailable' || storedStatus === 'unsupported') {
      return;
    }

    requestUserLocation(false).then(coords => {
      if (coords) {
        setSort('Nearest to Me');
      }
    });
  }, [userLocation]);

  useEffect(() => {
    if (nav?.params?.category) {
      setCategoryFilter(nav.params.category);
      setSpaceType('all');
    }
    if (nav?.params?.city) {
      setCity(nav.params.city === 'All Cities' ? '' : nav.params.city);
    }
  }, [nav?.params]);

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visible = spaces.filter(s => (currentUser?.role === 'admin' ? true : s.isVisible));

  const categoryCounts = useMemo(() => {
    return {
      all: visible.length,
      office: visible.filter(s => getSpaceCategory(s) === 'office').length,
      hall: visible.filter(s => getSpaceCategory(s) === 'hall').length,
      theater: visible.filter(s => getSpaceCategory(s) === 'theater').length,
    };
  }, [visible]);

  const spacesWithDistance = useMemo(() => {
    return visible.map(space => {
      const coords = getSpaceCoordinates(space);
      let distance: number | null = null;
      if (userLocation && coords) {
        distance = calculateHaversineDistance(
          userLocation.lat,
          userLocation.lng,
          coords.lat,
          coords.lng
        );
      }
      return {
        ...space,
        distance,
      };
    });
  }, [visible, userLocation]);

  const sortLabel = (option: string) => t(('browse.sort.' + option.replace(/[^A-Za-z]/g, '')) as never);

  const handleSortChange = async (option: string) => {
    setSort(option);
    setSortDropdownOpen(false);
    if (option === 'Nearest to Me') {
      setDismissedLocationBanner(false);
      if (!userLocation) {
        const coords = await requestUserLocation(true);
        if (coords) {
          setSort('Nearest to Me');
        }
      }
    }
  };

  const filtered = useMemo(() => {
    let list = spacesWithDistance.filter(s => {
      if (
        query &&
        !s.name?.toLowerCase().includes(query.toLowerCase()) &&
        !(s.nameAr || '').toLowerCase().includes(query.toLowerCase()) &&
        !(s.cityAr || '').toLowerCase().includes(query.toLowerCase()) &&
        !(s.addressAr || '').toLowerCase().includes(query.toLowerCase()) &&
        !s.city?.toLowerCase().includes(query.toLowerCase()) &&
        !s.address?.toLowerCase().includes(query.toLowerCase())
      ) {
        return false;
      }
      if (categoryFilter !== 'all' && getSpaceCategory(s) !== categoryFilter) return false;
      if (city && s.city !== city) return false;
      if (spaceType !== 'all' && normalizeSpaceType(s.type) !== spaceType) return false;
      
      if ((s.pricing?.daily ?? 0) > maxPrice) return false;
      
      if (availableOnly && (s.availableCapacity ?? 0) <= 0) return false;
      
      if (
        selectedAmenities.length > 0 &&
        !selectedAmenities.every(a => (s.amenities || []).includes(a))
      ) {
        return false;
      }
      return true;
    });

    if (sort === 'Nearest to Me') {
      if (userLocation) {
        list.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }
    } else if (sort === 'Price: Low to High') {
      list.sort((a, b) => (a.pricing?.daily ?? 0) - (b.pricing?.daily ?? 0));
    } else if (sort === 'Price: High to Low') {
      list.sort((a, b) => (b.pricing?.daily ?? 0) - (a.pricing?.daily ?? 0));
    } else if (sort === 'Rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === 'Availability') {
      list.sort((a, b) => (b.availableCapacity ?? 0) - (a.availableCapacity ?? 0));
    }

    return list;
  }, [spacesWithDistance, query, categoryFilter, city, spaceType, maxPrice, availableOnly, selectedAmenities, sort, userLocation]);

  const clearFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setCity('');
    setSpaceType('all');
    setMaxPrice(5000);
    setSelectedAmenities([]);
    setAvailableOnly(false);
  };

  const hasActiveFilters = Boolean(
    query || categoryFilter !== 'all' || city || spaceType !== 'all' || maxPrice < 5000 || selectedAmenities.length > 0 || availableOnly
  );

  const toggleAmenity = (a: string) => {
    setSelectedAmenities(prev => (prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]));
  };

  return (
    <div className="bg-plaster text-soot py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border border-zinc-200/80 shadow-sm text-soot-light text-xs font-medium mb-4">
              <Sparkles size={13} className="text-accent shrink-0" />
              <span>{t('browse.verified')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-serif-display text-soot tracking-tight">
              {t('browse.title')}
            </h1>
            <p className="text-soot-light text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              {t('browse.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-moss font-medium">{t('browse.showing')}</span>
            <Badge variant="eucalyptus" className="px-3.5 py-1.5 text-xs font-semibold">
              {t(filtered.length === 1 ? 'browse.spacesAvailableOne' : 'browse.spacesAvailableMany', { count: filtered.length })}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = categoryFilter === tab.id;
            const count = categoryCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(tab.id);
                  setSpaceType('all');
                }}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 h-11 ps-4 pe-2 rounded-full border text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-soot border-soot text-white shadow-sm'
                    : 'bg-white border-zinc-200/90 text-soot-light hover:text-soot hover:border-zinc-300'
                }`}
              >
                <Icon size={15} />
                <span>{t(('categories.' + tab.id) as never)}</span>
                <span className={`min-w-7 h-7 px-2 inline-flex items-center justify-center rounded-full text-xs font-semibold ${
                  isSelected ? 'bg-white/15 text-white' : 'bg-zinc-100 text-soot-light'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={17} className="absolute start-4 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
            <input
              type="text"
              placeholder={t('browse.searchPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full ps-11 pe-10 h-12 rounded-full border border-zinc-200/90 bg-white text-soot text-sm placeholder:text-moss/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 focus-visible:border-accent shadow-xs transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute end-3.5 top-1/2 -translate-y-1/2 text-moss hover:text-soot p-1 cursor-pointer"
                aria-label={t('browse.clearSearch')}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="relative min-w-[170px]" ref={cityRef}>
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="w-full flex items-center justify-between gap-2.5 px-4 h-12 rounded-full border border-zinc-200/90 bg-white text-soot text-sm font-medium hover:bg-plaster-dark/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin size={15} className="text-moss shrink-0" />
                <span className="truncate">{city ? st.cityName(city) : t('browse.allCities')}</span>
              </div>
              <ChevronDown
                size={15}
                className={`text-moss transition-transform duration-200 shrink-0 ${cityDropdownOpen ? 'rotate-180 text-soot' : ''}`}
              />
            </button>

            {cityDropdownOpen && (
              <div className="absolute top-full start-0 end-0 mt-2 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {CITIES.map(c => {
                    const isSelected = (c === 'All Cities' && !city) || city === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCity(c === 'All Cities' ? '' : c);
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-start ${
                          isSelected
                            ? 'bg-soot text-plaster font-semibold'
                            : 'text-soot hover:bg-plaster-dark/60'
                        }`}
                      >
                        <span>{c === 'All Cities' ? t('browse.allCities') : st.cityName(c)}</span>
                        {isSelected && <Check size={14} className="text-eucalyptus" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            className={`flex items-center justify-center gap-2 px-5 h-12 rounded-full border text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
              showFilters || hasActiveFilters
                ? 'bg-soot text-white border-soot'
                : 'bg-white text-soot border-zinc-200/90 hover:border-zinc-300'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>{t('browse.filters')}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-eucalyptus ms-0.5" />
            )}
          </button>

          <div className="relative min-w-[190px]" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 h-12 rounded-full border border-zinc-200/90 bg-white text-soot text-sm font-medium hover:bg-plaster-dark/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown size={14} className="text-moss shrink-0" />
                <span className="truncate">{sortLabel(sort)}</span>
              </div>
              <ChevronDown
                size={15}
                className={`text-moss transition-transform duration-200 shrink-0 ${sortDropdownOpen ? 'rotate-180 text-soot' : ''}`}
              />
            </button>

            {sortDropdownOpen && (
              <div className="absolute top-full end-0 w-52 mt-2 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map(o => {
                    const isSelected = sort === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => handleSortChange(o)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-start ${
                          isSelected
                            ? 'bg-soot text-plaster font-semibold'
                            : 'text-soot hover:bg-plaster-dark/60'
                        }`}
                      >
                        <span>{sortLabel(o)}</span>
                        {isSelected && <Check size={14} className="text-eucalyptus" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {!dismissedLocationBanner && (
          <div className="mb-6">
            {locationStatus === 'loading' ? (
              <div className="px-4 py-3 bg-white border border-soot/12 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-soot shadow-2xs animate-pulse">
                <div className="flex items-center gap-2.5">
                  <Loader2 size={16} className="animate-spin text-eucalyptus shrink-0" />
                  <span>{t('browse.locating')}</span>
                </div>
              </div>
            ) : locationStatus === 'granted' && userLocation && sort === 'Nearest to Me' ? (
              <div className="px-4 py-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="fill-emerald-700 text-emerald-700 shrink-0" />
                  <span className="font-medium">{t('browse.gpsEnabled')}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => requestUserLocation(true)}
                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    {t('browse.refresh')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedLocationBanner(true)}
                    className="text-emerald-800/70 hover:text-emerald-950 p-0.5 cursor-pointer"
                    aria-label={t('browse.dismiss')}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : locationStatus === 'denied' ? (
              <div className="p-4 bg-amber-50/95 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-950 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <MapPinOff size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-amber-950">{t('browse.locationDenied')}</span>
                    <span className="text-amber-900/90 text-xs leading-relaxed">
                      {t('browse.locationDeniedBody')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => requestUserLocation(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    {t('browse.enableLocation')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedLocationBanner(true)}
                    className="text-amber-800 hover:text-amber-950 p-1 cursor-pointer"
                    aria-label={t('browse.dismiss')}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : locationStatus === 'unavailable' ? (
              <div className="p-4 bg-amber-50/95 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-950 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <MapPinOff size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-amber-950">{t('browse.locationUnavailable')}</span>
                    <span className="text-amber-900/90 text-xs leading-relaxed">
                      {locationErrorMessage ? translateMessage(locationErrorMessage) : t('browse.locationServicesUnavailableFallback')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => requestUserLocation(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    {t('browse.tryAgain')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedLocationBanner(true)}
                    className="text-amber-800 hover:text-amber-950 p-1 cursor-pointer"
                    aria-label={t('browse.dismiss')}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : locationStatus === 'unsupported' ? (
              <div className="px-4 py-3 bg-soot/5 border border-soot/10 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-soot shadow-2xs">
                <div className="flex items-center gap-2">
                  <Info size={15} className="text-moss shrink-0" />
                  <span>{t('browse.geoUnsupported')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedLocationBanner(true)}
                  className="text-moss hover:text-soot p-0.5 cursor-pointer"
                  aria-label={t('browse.dismiss')}
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {showFilters && (
          <div className="bg-white rounded-[28px] border border-zinc-200/70 p-6 sm:p-8 mb-8 shadow-ambient animate-reveal">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-moss" />
                <span className="font-semibold text-soot text-base font-serif-display">{t('browse.refine')}</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-moss hover:text-red-700 transition-colors cursor-pointer"
                >
                  <X size={13} />
                  <span>{t('browse.resetAll')}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-moss mb-3 block">
                  {t('browse.workspaceType')}
                </label>
                <div className="flex flex-col gap-1.5">
                  {ALL_TYPES.map(typeItem => (
                    <button
                      key={typeItem.id}
                      type="button"
                      onClick={() => setSpaceType(typeItem.id)}
                      className={`text-start text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all font-medium cursor-pointer ${
                        spaceType === typeItem.id
                          ? 'bg-soot text-plaster font-semibold shadow-xs'
                          : 'text-soot hover:bg-plaster-dark/50'
                      }`}
                    >
                      {typeItem.id === 'all' ? t('browse.allTypes') : st.typeLabel(typeItem.id)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-moss">
                    {t('browse.maxRate')}
                  </label>
                  <span className="text-xs font-bold text-soot bg-soot/5 px-2 py-0.5 rounded-md">
                    {t('common.sar')} {maxPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={maxPrice}
                  onChange={e => setMaxPrice(+e.target.value)}
                  className="ui-range cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-moss mt-2 font-medium">
                  <span>{t('common.sar')} 50</span>
                  <span>{t('common.sar')} 5,000</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-moss mb-3 block">
                  {t('browse.includedAmenities')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map(a => {
                    const isChecked = selectedAmenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        aria-pressed={isChecked}
                        className={`text-xs h-9 px-3.5 rounded-full border transition-all font-medium cursor-pointer active:scale-[0.98] ${
                          isChecked
                            ? 'bg-soot text-white border-soot shadow-xs'
                            : 'border-zinc-200 text-soot-light hover:text-soot hover:border-zinc-300 bg-white'
                        }`}
                      >
                        {st.amenity(a)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span id="availability-filter-label" className="text-xs font-semibold uppercase tracking-wider text-moss mb-3 block">
                  {t('browse.availabilityLabel')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={availableOnly}
                  aria-labelledby="availability-filter-label"
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-plaster-dark/30 border border-soot/10 cursor-pointer hover:bg-plaster-dark/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus focus-visible:ring-offset-1 text-start"
                >
                  <span className="text-xs sm:text-sm font-medium text-soot">{t('browse.availableOnly')}</span>
                  <span
                    aria-hidden="true"
                    className={`w-11 h-6 rounded-full transition-colors relative inline-block shrink-0 ${
                      availableOnly ? 'bg-soot' : 'bg-soot/20'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-plaster rounded-full shadow-md transition-transform duration-200 block ${
                        availableOnly ? 'translate-x-5.5 rtl:-translate-x-5.5' : 'translate-x-0.5 rtl:-translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!spacesLoaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label={t('common.loading')}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-white rounded-[28px] border border-zinc-200/70 p-2.5 pb-5 flex flex-col gap-3.5">
                <div className="ui-skeleton aspect-[4/3] rounded-[20px]" />
                <div className="ui-skeleton h-4 w-3/5 rounded-lg mx-2.5" />
                <div className="ui-skeleton h-3.5 w-2/5 rounded-lg mx-2.5" />
                <div className="ui-skeleton h-7 w-4/5 rounded-full mx-2.5 mt-1" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-dashed border-zinc-300 p-16 text-center shadow-xs max-w-xl mx-auto my-12">
            <div className="w-14 h-14 rounded-2xl bg-soot/5 flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-moss" />
            </div>
            <h3 className="text-xl font-normal font-serif-display text-soot mb-1.5">{t('browse.noSpaces')}</h3>
            <p className="text-moss text-xs sm:text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              {t('browse.noResultsBody')}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-primary"
            >
              {t('browse.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(space => (
              <SpaceCard
                key={space.id}
                space={space}
                distance={space.distance}
                onSelect={s => navigate('space-details', { spaceId: s.id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
