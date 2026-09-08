'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, X, MapPin, ChevronDown, Check, ArrowUpDown, Sparkles, Building2, Presentation, Clapperboard, LayoutGrid, Navigation, Loader2 } from 'lucide-react';
import { useApp } from '@/app/store';
import SpaceCard from '@/components/spaces/spaceCard';
import Badge from '@/components/ui/Badge';
import { getSpaceCategory, SpaceCategory, calculateHaversineDistance, getSpaceCoordinates } from '@/types/types';

const CITIES = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];
const CATEGORY_TABS: { id: 'all' | SpaceCategory; label: string; icon: any }[] = [
  { id: 'all', label: 'All Spaces', icon: LayoutGrid },
  { id: 'office', label: 'Offices', icon: Building2 },
  { id: 'hall', label: 'Halls', icon: Presentation },
  { id: 'theater', label: 'Theaters', icon: Clapperboard },
];

const OFFICE_TYPES = [
  { id: 'all', label: 'All Offices' },
  { id: 'hot-desk', label: 'Hot Desk' },
  { id: 'shared-desk', label: 'Shared Desk' },
  { id: 'private-office', label: 'Private Office' },
  { id: 'meeting-room', label: 'Meeting Room' },
  { id: 'mixed', label: 'Mixed Workspace' },
];

const HALL_TYPES = [
  { id: 'all', label: 'All Halls' },
  { id: 'meeting-hall', label: 'Meeting Hall' },
  { id: 'training-hall', label: 'Training Hall' },
  { id: 'conference-hall', label: 'Conference Hall' },
  { id: 'workshop-hall', label: 'Workshop Hall' },
  { id: 'event-hall', label: 'Event Hall' },
  { id: 'lecture-hall', label: 'Lecture Hall' },
  { id: 'multipurpose-hall', label: 'Multi-purpose Hall' },
];

const THEATER_TYPES = [
  { id: 'all', label: 'All Theaters' },
  { id: 'theater', label: 'Theaters & Auditoriums' },
  { id: 'performance-theater', label: 'Performance Theater' },
  { id: 'conference-theater', label: 'Conference & Event Theater' },
];

const ALL_TYPES = [
  { id: 'all', label: 'All Types' },
  ...OFFICE_TYPES.filter(t => t.id !== 'all'),
  ...HALL_TYPES.filter(t => t.id !== 'all'),
  ...THEATER_TYPES.filter(t => t.id !== 'all'),
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

export default function Browse() {
  const { spaces, navigate, currentUser, nav, userLocation, locationStatus, requestUserLocation } = useApp();
  const initialCity = nav?.params?.city || (typeof window !== 'undefined' ? (window as any).__browseCity || '' : '');
  const initialCategory = (nav?.params?.category as ('all' | SpaceCategory)) || 'all';

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SpaceCategory>(initialCategory);
  const [city, setCity] = useState(initialCity === 'All Cities' ? '' : initialCity);
  const [spaceType, setSpaceType] = useState('all');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState('Recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Sync navigation params if navigated from another page
  useEffect(() => {
    if (nav?.params?.category) {
      setCategoryFilter(nav.params.category);
      setSpaceType('all');
    }
    if (nav?.params?.city) {
      setCity(nav.params.city === 'All Cities' ? '' : nav.params.city);
    }
  }, [nav?.params]);

  // Dropdown States
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

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: visible.length,
      office: visible.filter(s => getSpaceCategory(s) === 'office').length,
      hall: visible.filter(s => getSpaceCategory(s) === 'hall').length,
      theater: visible.filter(s => getSpaceCategory(s) === 'theater').length,
    };
  }, [visible]);

  // Compute distance for all visible spaces when userLocation is available
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

  const handleSortChange = async (option: string) => {
    setSort(option);
    setSortDropdownOpen(false);
    if (option === 'Nearest to Me' && !userLocation) {
      await requestUserLocation();
    }
  };

  const filtered = useMemo(() => {
    let list = spacesWithDistance.filter(s => {
      if (
        query &&
        !s.name.toLowerCase().includes(query.toLowerCase()) &&
        !s.city.toLowerCase().includes(query.toLowerCase()) &&
        !s.address.toLowerCase().includes(query.toLowerCase())
      ) {
        return false;
      }
      if (categoryFilter !== 'all' && getSpaceCategory(s) !== categoryFilter) return false;
      if (city && s.city !== city) return false;
      if (spaceType !== 'all' && s.type !== spaceType) return false;
      if (s.pricing.daily > maxPrice) return false;
      if (availableOnly && s.availableCapacity <= 0) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => s.amenities.includes(a))) return false;
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
      list.sort((a, b) => a.pricing.daily - b.pricing.daily);
    } else if (sort === 'Price: High to Low') {
      list.sort((a, b) => b.pricing.daily - a.pricing.daily);
    } else if (sort === 'Rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'Availability') {
      list.sort((a, b) => b.availableCapacity - a.availableCapacity);
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
    <div className="min-h-screen bg-plaster text-soot py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-soot/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soot/5 border border-soot/10 text-moss text-xs font-semibold mb-3">
              <Sparkles size={13} className="text-eucalyptus shrink-0" />
              <span>Verified Saudi Workspaces</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-serif-display text-soot tracking-tight">
              Browse Workspaces
            </h1>
            <p className="text-moss text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Discover and book flexible, fully-equipped offices, halls, and theaters across Saudi Arabia.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-moss font-medium">Showing:</span>
            <Badge variant="eucalyptus" className="px-3.5 py-1.5 text-xs font-semibold">
              {filtered.length} {filtered.length === 1 ? 'Space' : 'Spaces'} Available
            </Badge>
          </div>
        </div>

        {/* Category Tabs: All, Offices, Halls, Theaters */}
        <div className="flex flex-wrap gap-2.5 mb-6">
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-soot text-plaster shadow-xs'
                    : 'bg-white border border-soot/10 text-moss hover:text-soot hover:border-soot/30'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-plaster/20 text-plaster' : 'bg-plaster-dark/60 text-soot'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Main Filter Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-6">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
            <input
              type="text"
              placeholder="Search by space name, district, or keywords..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-soot/15 bg-plaster-surface text-soot text-sm placeholder:text-moss/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-moss hover:text-soot p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Custom City Selector */}
          <div className="relative min-w-[170px]" ref={cityRef}>
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="w-full flex items-center justify-between gap-2.5 px-4 py-3 rounded-2xl border border-soot/15 bg-plaster-surface text-soot text-sm font-medium hover:bg-plaster-dark/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin size={15} className="text-moss shrink-0" />
                <span className="truncate">{city || 'All Cities'}</span>
              </div>
              <ChevronDown
                size={15}
                className={`text-moss transition-transform duration-200 shrink-0 ${cityDropdownOpen ? 'rotate-180 text-soot' : ''}`}
              />
            </button>

            {cityDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-soot text-plaster font-semibold'
                            : 'text-soot hover:bg-plaster-dark/60'
                        }`}
                      >
                        <span>{c}</span>
                        {isSelected && <Check size={14} className="text-eucalyptus" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Filter Panel Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all cursor-pointer shadow-xs ${
              showFilters || hasActiveFilters
                ? 'bg-soot text-plaster border-soot'
                : 'bg-plaster-surface text-soot border-soot/15 hover:bg-plaster-dark/30'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-eucalyptus ml-0.5" />
            )}
          </button>

          {/* Custom Sort Selector */}
          <div className="relative min-w-[190px]" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-soot/15 bg-plaster-surface text-soot text-sm font-medium hover:bg-plaster-dark/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown size={14} className="text-moss shrink-0" />
                <span className="truncate">{sort}</span>
              </div>
              <ChevronDown
                size={15}
                className={`text-moss transition-transform duration-200 shrink-0 ${sortDropdownOpen ? 'rotate-180 text-soot' : ''}`}
              />
            </button>

            {sortDropdownOpen && (
              <div className="absolute top-full right-0 w-52 mt-2 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map(o => {
                    const isSelected = sort === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => handleSortChange(o)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-soot text-plaster font-semibold'
                            : 'text-soot hover:bg-plaster-dark/60'
                        }`}
                      >
                        <span>{o}</span>
                        {isSelected && <Check size={14} className="text-eucalyptus" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Status Feedback Banner when sorting by Nearest to Me */}
        {sort === 'Nearest to Me' && (
          <div className="mb-6">
            {locationStatus === 'loading' ? (
              <div className="px-4 py-3 bg-plaster-dark/50 border border-soot/10 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-soot animate-pulse">
                <Loader2 size={16} className="animate-spin text-moss shrink-0" />
                <span>Locating your current position to calculate distance to workspaces...</span>
              </div>
            ) : userLocation ? (
              <div className="px-4 py-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="fill-emerald-700 text-emerald-700 shrink-0" />
                  <span className="font-medium">Sorted by distance from your current location</span>
                </div>
                <button
                  type="button"
                  onClick={() => requestUserLocation()}
                  className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer shrink-0"
                >
                  Refresh Location
                </button>
              </div>
            ) : (
              <div className="px-4 py-2.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-amber-700 shrink-0" />
                  <span>Location access unavailable. Showing standard order without distance sorting.</span>
                </div>
                <button
                  type="button"
                  onClick={() => requestUserLocation()}
                  className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0"
                >
                  Enable Location
                </button>
              </div>
            )}
          </div>
        )}

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-8 mb-8 shadow-sm animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-moss" />
                <span className="font-semibold text-soot text-base font-serif-display">Refine Results</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-moss hover:text-red-700 transition-colors cursor-pointer"
                >
                  <X size={13} />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Space Type */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-moss mb-3 block">
                  Workspace Type
                </label>
                <div className="flex flex-col gap-1.5">
                  {ALL_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSpaceType(t.id)}
                      className={`text-left text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all font-medium cursor-pointer ${
                        spaceType === t.id
                          ? 'bg-soot text-plaster font-semibold shadow-xs'
                          : 'text-soot hover:bg-plaster-dark/50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-moss">
                    Max Rate
                  </label>
                  <span className="text-xs font-bold text-soot bg-soot/5 px-2 py-0.5 rounded-md">
                    SAR {maxPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={maxPrice}
                  onChange={e => setMaxPrice(+e.target.value)}
                  className="w-full accent-soot cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-moss mt-2 font-medium">
                  <span>SAR 50</span>
                  <span>SAR 5,000</span>
                </div>
              </div>

              {/* Amenities Selector */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-moss mb-3 block">
                  Included Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map(a => {
                    const isChecked = selectedAmenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium cursor-pointer active:scale-[0.98] ${
                          isChecked
                            ? 'bg-soot text-plaster border-soot shadow-xs font-semibold'
                            : 'border-soot/15 text-moss hover:text-soot hover:bg-plaster-dark/40 bg-plaster-dark/15'
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Toggle */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-moss mb-3 block">
                  Availability
                </label>
                <div
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-plaster-dark/30 border border-soot/10 cursor-pointer hover:bg-plaster-dark/50 transition-all"
                >
                  <span className="text-xs sm:text-sm font-medium text-soot">Available Desks Only</span>
                  <div
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      availableOnly ? 'bg-soot' : 'bg-soot/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-plaster rounded-full shadow-md transition-transform duration-200 ${
                        availableOnly ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        {filtered.length === 0 ? (
          <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-16 text-center shadow-xs max-w-xl mx-auto my-12">
            <div className="w-14 h-14 rounded-2xl bg-soot/5 flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-moss" />
            </div>
            <h3 className="text-xl font-normal font-serif-display text-soot mb-1.5">No spaces found</h3>
            <p className="text-moss text-xs sm:text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find any workspaces matching your exact criteria. Try adjusting your search or clearing active filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-primary"
            >
              Reset Filters
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
