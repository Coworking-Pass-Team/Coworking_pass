'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/store';
import Button from '@/components/ui/Button';

const CITIES = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];

export default function LandingHeroSearch() {
  const router = useRouter();
  const { navigate } = useApp();
  const [searchCity, setSearchCity] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    const targetCity = searchCity === 'All Cities' ? '' : searchCity;
    // Update store state if within SPA session
    if (typeof navigate === 'function') {
      navigate('browse', { city: targetCity });
    }
    // Also push real URL route for navigation & history
    if (targetCity) {
      router.push(`/spaces?city=${encodeURIComponent(targetCity)}`);
    } else {
      router.push('/spaces');
    }
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
    <div className="relative z-40 w-full max-w-lg mx-auto flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-plaster-surface/95 backdrop-blur-md rounded-2xl border border-soot/15 shadow-2xl">
      <div className="relative flex-1 w-full" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/60 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus focus-visible:ring-offset-1"
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          aria-label="Select City"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin size={18} className="text-moss shrink-0" />
            <span className="text-sm font-medium text-soot truncate">
              {searchCity || 'All Cities'}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`text-moss transition-transform duration-200 shrink-0 ${
              dropdownOpen ? 'rotate-180 text-soot' : ''
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 p-1 bg-[#FAF8F3] border border-soot/15 rounded-2xl shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {CITIES.map(city => {
                const isSelected = (city === 'All Cities' && !searchCity) || searchCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setSearchCity(city === 'All Cities' ? '' : city);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus ${
                      isSelected
                        ? 'bg-soot text-plaster font-semibold'
                        : 'text-soot hover:bg-plaster-dark/70 hover:text-soot'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-eucalyptus' : 'bg-transparent'}`} />
                      <span>{city}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-eucalyptus" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleSearch}
        variant="primary"
        className="w-full sm:w-auto px-6 py-2.5 font-semibold text-sm shrink-0 bg-soot text-plaster hover:bg-moss focus-visible:ring-2 focus-visible:ring-eucalyptus transition-colors duration-200 shadow-md active:scale-[0.98] cursor-pointer rounded-xl"
      >
        Find Spaces
        <ArrowRight size={16} />
      </Button>
    </div>
  );
}
