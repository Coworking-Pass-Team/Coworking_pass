'use client';
import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, MapPin, ChevronDown } from 'lucide-react';
import { useApp } from '@/app/store';
import SpaceCard from '@/components/spaces/spaceCard';

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];
const TYPES = ['all', 'hot-desk', 'private-office', 'meeting-room', 'mixed'];
const AMENITIES = ['WiFi', 'Coffee', 'Printer', 'Parking', 'Prayer Room', 'Meeting Rooms'];
const SORT_OPTIONS = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Availability'];

export default function Browse() {
  const { spaces, navigate, currentUser, nav } = useApp();
  const initialCity = nav?.params?.city || (typeof window !== 'undefined' ? (window as any).__browseCity || '' : '');

  const [query, setQuery] = useState('');
  const [city, setCity] = useState(initialCity);
  const [spaceType, setSpaceType] = useState('all');
  const [maxPrice, setMaxPrice] = useState(300);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState('Recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  const visible = spaces.filter(s => currentUser?.role === 'admin' ? true : s.isVisible);

  const filtered = useMemo(() => {
    let list = visible.filter(s => {
      if (query && !s.name.toLowerCase().includes(query.toLowerCase()) && !s.city.toLowerCase().includes(query.toLowerCase()) && !s.address.toLowerCase().includes(query.toLowerCase())) return false;
      if (city && s.city !== city) return false;
      if (spaceType !== 'all' && s.type !== spaceType) return false;
      if (s.pricing.daily > maxPrice) return false;
      if (availableOnly && s.availableCapacity === 0) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => s.amenities.includes(a))) return false;
      return true;
    });

    if (sort === 'Price: Low to High') list = [...list].sort((a, b) => a.pricing.daily - b.pricing.daily);
    else if (sort === 'Price: High to Low') list = [...list].sort((a, b) => b.pricing.daily - a.pricing.daily);
    else if (sort === 'Rating') list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === 'Availability') list = [...list].sort((a, b) => b.availableCapacity - a.availableCapacity);

    return list;
  }, [visible, query, city, spaceType, maxPrice, availableOnly, selectedAmenities, sort]);

  const clearFilters = () => {
    setQuery(''); setCity(''); setSpaceType('all'); setMaxPrice(300);
    setSelectedAmenities([]); setAvailableOnly(false);
  };

  const hasActiveFilters = query || city || spaceType !== 'all' || maxPrice < 300 || selectedAmenities.length > 0 || availableOnly;

  const toggleAmenity = (a: string) => {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>Browse Spaces</h1>
        <p className="text-moss text-sm">{filtered.length} space{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Search + Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            placeholder="Search by space name or city..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 placeholder:text-moss/60"
          />
        </div>

        <div className="relative">
          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-moss" />
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className="pl-8 pr-8 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus appearance-none cursor-pointer"
          >
            <option value="">All Cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? 'bg-soot text-plaster border-soot' : 'border-soot/12 bg-white text-moss hover:text-soot'}`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-eucalyptus text-soot text-[9px] flex items-center justify-center font-bold">!</span>}
        </button>

        <div className="relative">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-mist/10 rounded-2xl border border-mist/40 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-soot text-sm">Filter options</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-moss hover:text-soot">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-medium text-moss mb-2 block">Space type</label>
              <div className="flex flex-col gap-1.5">
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setSpaceType(t)}
                    className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${spaceType === t ? 'mist-active font-medium' : 'text-moss mist-hover'}`}
                  >
                    {t === 'all' ? 'All types' : t.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-moss mb-2 block">
                Max price / day: SAR {maxPrice}
              </label>
              <input
                type="range"
                min={50}
                max={300}
                step={10}
                value={maxPrice}
                onChange={e => setMaxPrice(+e.target.value)}
                className="w-full accent-eucalyptus"
              />
              <div className="flex justify-between text-xs text-moss mt-1">
                <span>SAR 50</span>
                <span>SAR 300</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-moss mb-2 block">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedAmenities.includes(a) ? 'mist-active border-transparent': 'border-soot/12 text-moss mist-hover'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-moss mb-2 block">Availability</label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className={`w-10 h-5.5 rounded-full transition-colors relative ${availableOnly ? 'bg-eucalyptus' : 'bg-soot/15'}`}
                >
                  <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${availableOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-soot">Available only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-soot/5 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-moss" />
          </div>
          <h3 className="text-lg font-semibold text-soot mb-2">No spaces found</h3>
          <p className="text-moss text-sm mb-4">Try adjusting your filters or search query.</p>
          <button onClick={clearFilters} className="px-4 py-2 rounded-lg bg-eucalyptus text-soot text-sm font-medium">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(space => (
            <SpaceCard
              key={space.id}
              space={space}
              onSelect={s => navigate('space-details', { spaceId: s.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
