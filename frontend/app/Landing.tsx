'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, MapPin, Star, Users, Zap, Headphones, Shield, ChevronDown, Quote, Check, Building2, Presentation, Clapperboard } from 'lucide-react';
import { useApp } from '@/app/store';
import { isUserPassHolder, getEffectiveSpacePrice, getSpaceCategory } from '@/types/types';
import GuestNav from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const cities = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];

export default function Landing() {
  const { navigate, spaces, currentUser } = useApp();
  const passActive = isUserPassHolder(currentUser);
  const [searchCity, setSearchCity] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleSpaces = spaces.filter(s => s.isVisible);
  const officeCount = visibleSpaces.filter(s => getSpaceCategory(s) === 'office').length;
  const hallCount = visibleSpaces.filter(s => getSpaceCategory(s) === 'hall').length;
  const theaterCount = visibleSpaces.filter(s => getSpaceCategory(s) === 'theater').length;

  const featured = spaces.filter(s => s.isFeatured && s.isVisible).slice(0, 3);

  const handleSearch = () => {
    navigate('browse', { city: searchCity });
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
    <div className="min-h-screen flex flex-col bg-plaster">
      <GuestNav />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pb-16">
        <div className="absolute inset-0">
          <img
            src="/landing-hero.jpg"
            alt="Modern coworking space"
            className="w-full h-full object-cover object-center saturate-110"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-soot/45 via-soot/60 to-soot/85 pointer-events-none" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-14 w-full flex flex-col items-center justify-center text-center z-10">
          {/* Top Badge */}
          <div className="mb-6 inline-flex items-center gap-2 bg-soot/80 backdrop-blur-md text-plaster border border-plaster/25 shadow-md px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
            <Zap size={14} className="text-plaster shrink-0" />
            <span>Saudi Arabia&apos;s Premier Coworking Network</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-plaster leading-[1.15] mb-6 tracking-tight drop-shadow-md text-center font-serif-display">
            Your Perfect Workspace,<br />
            <span className="text-eucalyptus italic font-serif">Anywhere in the Kingdom.</span>
          </h1>

          <p className="text-plaster/95 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl font-normal text-center mx-auto drop-shadow-sm">
            Instantly access flexible, fully equipped coworking spaces in Riyadh, Jeddah, Dammam, and beyond. Book by the day, month, or year.
          </p>

          {/* Clean Integrated Search Bar */}
          <div className="relative z-40 w-full max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-plaster-surface/95 backdrop-blur-md rounded-2xl border border-soot/15 shadow-2xl">
            <div className="relative flex-1 w-full" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/60 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus focus-visible:ring-offset-1"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
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
                <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-[#FAF8F3] border border-soot/15 rounded-2xl shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {cities.map(city => {
                      const isSelected = (city === 'All Cities' && !searchCity) || searchCity === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setSearchCity(city === 'All Cities' ? '' : city);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus ${
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
              className="w-full sm:w-auto px-7 py-3 font-semibold text-sm shrink-0 bg-soot text-plaster hover:bg-moss focus-visible:ring-2 focus-visible:ring-eucalyptus transition-colors duration-200 shadow-md active:scale-[0.98] cursor-pointer rounded-xl"
            >
              Find Spaces
              <ArrowRight size={16} />
            </Button>
          </div>

          {/* Larger & Polished Trust Pills */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-10">
            <div className="bg-soot/80 backdrop-blur-md border border-plaster/20 px-5 py-2.5 rounded-full text-plaster text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-lg">
              <Star size={16} fill="currentColor" className="text-eucalyptus" />
              <span>4.8 Avg Rating</span>
            </div>
            <div className="bg-soot/80 backdrop-blur-md border border-plaster/20 px-5 py-2.5 rounded-full text-plaster text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-lg">
              <Users size={16} className="text-eucalyptus" />
              <span>2,400+ Active Members</span>
            </div>
            <div className="bg-soot/80 backdrop-blur-md border border-plaster/20 px-5 py-2.5 rounded-full text-plaster text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-lg">
              <MapPin size={16} className="text-eucalyptus" />
              <span>Verified Workspaces</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-plaster/70 animate-bounce pointer-events-none">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Explore by Space Category Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-moss text-xs font-semibold uppercase tracking-wider mb-2">Space Categories</p>
          <h2 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            Find the Right Space for Every Need
          </h2>
          <p className="text-moss text-sm mt-2">
            Explore dedicated work environments tailored for individuals, teams, presentations, and events.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Offices Card */}
          <div
            onClick={() => navigate('browse', { category: 'office' })}
            className="p-6 rounded-3xl bg-plaster-surface border border-soot/12 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-soot text-plaster flex items-center justify-center mb-5 shadow-xs group-hover:bg-moss transition-colors">
                <Building2 size={24} />
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xl font-semibold text-soot font-serif-display">Offices</h3>
                <span className="text-xs font-bold text-moss bg-plaster-dark/60 px-2.5 py-0.5 rounded-full">
                  {officeCount} Available
                </span>
              </div>
              <p className="text-xs text-moss leading-relaxed mb-4">
                Hot desks, shared desks, dedicated workstations, and private team suites. Available for daily, monthly, and annual bookings.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-soot group-hover:text-emerald-900 transition-colors pt-3 border-t border-soot/8">
              <span>Browse Offices</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Halls Card */}
          <div
            onClick={() => navigate('browse', { category: 'hall' })}
            className="p-6 rounded-3xl bg-plaster-surface border border-soot/12 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E5ECE9] text-soot border border-eucalyptus/40 flex items-center justify-center mb-5 shadow-xs group-hover:bg-eucalyptus transition-colors">
                <Presentation size={24} className="text-moss" />
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xl font-semibold text-soot font-serif-display">Halls</h3>
                <span className="text-xs font-bold text-moss bg-plaster-dark/60 px-2.5 py-0.5 rounded-full">
                  {hallCount} Available
                </span>
              </div>
              <p className="text-xs text-moss leading-relaxed mb-4">
                Meeting halls, interactive training halls, workshop spaces, and multi-purpose event halls with flexible hourly scheduling.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-soot group-hover:text-emerald-900 transition-colors pt-3 border-t border-soot/8">
              <span>Browse Halls</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Theaters Card */}
          <div
            onClick={() => navigate('browse', { category: 'theater' })}
            className="p-6 rounded-3xl bg-plaster-surface border border-soot/12 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-soot/10 text-soot flex items-center justify-center mb-5 shadow-xs group-hover:bg-soot group-hover:text-plaster transition-colors">
                <Clapperboard size={24} />
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xl font-semibold text-soot font-serif-display">Theaters</h3>
                <span className="text-xs font-bold text-moss bg-plaster-dark/60 px-2.5 py-0.5 rounded-full">
                  {theaterCount} Available
                </span>
              </div>
              <p className="text-xs text-moss leading-relaxed mb-4">
                Auditoriums, cinema-grade screening halls, and tiered conference & performance theaters equipped with laser projection and stage lighting.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-soot group-hover:text-emerald-900 transition-colors pt-3 border-t border-soot/8">
              <span>Browse Theaters</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Spaces Section */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-moss text-xs font-semibold uppercase tracking-wider mb-2">Featured Workspaces</p>
            <h2 className="text-4xl sm:text-5xl text-soot font-normal font-serif-display">Popular spaces</h2>
          </div>
          <button
            onClick={() => navigate('browse')}
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-soot hover:text-moss focus-visible:ring-2 focus-visible:ring-eucalyptus rounded-lg px-2 py-1 transition-colors duration-200 cursor-pointer"
          >
            View all <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featured.map(space => (
            <div
              key={space.id}
              className="group cursor-pointer bg-plaster-dark/40 hover:bg-plaster-dark/80 rounded-3xl border border-soot/12 overflow-hidden transition-colors duration-200 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-eucalyptus"
              tabIndex={0}
              onClick={() => navigate('space-details', { spaceId: space.id })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('space-details', { spaceId: space.id });
                }
              }}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={space.images[0]}
                  alt={space.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-soot/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-white font-semibold text-lg leading-snug font-serif-display">{space.name}</div>
                  <div className="flex items-center gap-1.5 text-plaster/90 text-xs font-medium mt-1">
                    <MapPin size={13} className="text-eucalyptus" />
                    {space.city} • {space.address}
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-plaster-surface/95 backdrop-blur-md rounded-2xl px-3 py-1.5 text-center border border-soot/12 shadow-xs">
                  {(() => {
                    const planInfo = getEffectiveSpacePrice(currentUser, space, 'daily');
                    if (planInfo.isCovered) {
                      return (
                        <div className="flex items-center gap-1 text-soot font-bold text-xs">
                          <Check size={12} className="text-moss shrink-0" />
                          <span>Included</span>
                        </div>
                      );
                    }
                    if (planInfo.hasDiscount) {
                      return (
                        <div>
                          <div className="text-soot font-bold text-xs">SAR {planInfo.effectivePrice}</div>
                          <div className="text-moss text-[9px] font-medium">{planInfo.discountPercentage}% Off</div>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="text-soot font-bold text-sm">SAR {space.pricing.daily}</div>
                        <div className="text-moss text-[10px] font-medium">/ day</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-soot font-semibold">
                  <Star size={14} fill="currentColor" className="text-eucalyptus" />
                  <span>{space.rating}</span>
                  <span className="text-moss font-normal text-xs">({space.reviewCount} reviews)</span>
                </div>
                <Badge variant={space.availableCapacity === 0 ? 'danger' : space.availableCapacity <= 5 ? 'warning' : 'eucalyptus'}>
                  {space.availableCapacity === 0 ? 'Fully Booked' : space.availableCapacity <= 5 ? 'Limited Seats' : 'Available'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Button
            onClick={() => navigate('browse')}
            variant="secondary"
            className="px-6 py-2.5 text-sm font-medium"
          >
            View all spaces
          </Button>
        </div>
      </section>

      {/* How it works - Visual Photo Cards */}
      <section className="py-24 bg-plaster-dark/25 border-y border-soot/8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-plaster-surface border border-soot/10 text-moss text-xs font-semibold mb-3 shadow-xs">
              <Zap size={13} className="text-eucalyptus shrink-0" />
              <span>Seamless Experience</span>
            </div>
            <h2 className="text-4xl sm:text-5xl text-soot font-normal font-serif-display tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-moss text-sm sm:text-base leading-relaxed">
              Get instant access to top-tier coworking spaces across the Kingdom in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 - Discover */}
            <div className="group bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-soot/5 border border-soot/8">
                  <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80"
                    alt="Browse spaces"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-soot/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 bg-plaster-surface/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-soot/10 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-moss shrink-0" />
                      <span className="text-[11px] font-semibold text-soot">Riyadh &bull; Digital City</span>
                    </div>
                    <span className="text-[10px] font-bold text-eucalyptus uppercase bg-soot/90 px-2 py-0.5 rounded-md">8+ Spaces</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-soot text-plaster text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-xl font-semibold text-soot font-serif-display">
                    Browse & Discover
                  </h3>
                </div>
                <p className="text-moss text-xs sm:text-sm leading-relaxed mt-2">
                  Explore curated, high-speed verified workspaces across Saudi Arabia filtered by your exact needs.
                </p>
              </div>
            </div>

            {/* Card 2 - Choose Plan */}
            <div className="group bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-soot/5 border border-soot/8">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80"
                    alt="Choose your plan"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-soot/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 bg-plaster-surface/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-soot/10 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <Zap size={13} className="text-moss shrink-0" />
                      <span className="text-[11px] font-semibold text-soot">Flexible Passes</span>
                    </div>
                    <span className="text-[10px] font-bold text-soot bg-eucalyptus/30 border border-soot/10 px-2 py-0.5 rounded-md">Day / Monthly</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-soot text-plaster text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-xl font-semibold text-soot font-serif-display">
                    Choose Your Plan
                  </h3>
                </div>
                <p className="text-moss text-xs sm:text-sm leading-relaxed mt-2">
                  Select a flexible daily pass or recurring monthly membership with zero lock-in and seamless upgrades.
                </p>
              </div>
            </div>

            {/* Card 3 - Book & Work */}
            <div className="group bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-soot/5 border border-soot/8">
                  <img
                    src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80"
                    alt="Instant workspace access"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-soot/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 bg-plaster-surface/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-soot/10 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-eucalyptus shrink-0 stroke-[3]" />
                      <span className="text-[11px] font-semibold text-soot">Instant Check-in</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-plaster bg-soot px-2 py-0.5 rounded-md">Pass Ready</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-soot text-plaster text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h3 className="text-xl font-semibold text-soot font-serif-display">
                    Book & Access
                  </h3>
                </div>
                <p className="text-moss text-xs sm:text-sm leading-relaxed mt-2">
                  Confirm instantly, receive digital access passes, and work productively right away.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Coworking Pass */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-soot/5 border border-soot/10 text-moss text-xs font-semibold mb-4 shadow-xs">
            <Shield size={13} className="text-moss shrink-0" />
            <span>Enterprise Grade</span>
          </div>
          <h2 className="text-4xl sm:text-5xl text-soot font-normal font-serif-display tracking-tight leading-[1.15] mb-4">
            Built for the modern <span className="text-moss italic font-serif">professional.</span>
          </h2>
          <p className="text-moss text-sm sm:text-base leading-relaxed">
            Everything you need to stay productive, flexible, and connected across Saudi Arabia’s fastest-growing workspace network.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="flex flex-col justify-between gap-4">
            {[
              {
                icon: Zap,
                title: 'Instant 2-Minute Booking',
                desc: 'Reserve on demand with real-time seat availability and zero waiting times.',
                bg: 'bg-eucalyptus/25',
                iconColor: 'text-soot',
              },
              {
                icon: Shield,
                title: 'Secure & Verified',
                desc: 'Every space is personally vetted for ultra-fast Wi-Fi, ergonomics, and quiet zones.',
                bg: 'bg-mist-light',
                iconColor: 'text-moss',
              },
              {
                icon: Headphones,
                title: 'Dedicated Support',
                desc: '24/7 dedicated assistance for your team bookings, modifications, and billing.',
                bg: 'bg-eucalyptus/25',
                iconColor: 'text-soot',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex-1 flex items-start gap-4 p-5 rounded-3xl bg-plaster-surface border border-soot/10 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-2xl ${f.bg} flex items-center justify-center shrink-0 shadow-xs mt-0.5`}>
                  <f.icon size={19} className={f.iconColor} />
                </div>
                <div>
                  <h3 className="font-semibold text-soot text-base mb-1 font-serif-display">
                    {f.title}
                  </h3>
                  <p className="text-moss text-xs sm:text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-soot/12 shadow-sm min-h-[360px] h-full flex flex-col justify-end">
            <img
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1000&auto=format&fit=crop&q=80"
              alt="Coworking professionals collaborating"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-soot/60 via-soot/10 to-transparent pointer-events-none" />

            <div className="relative z-10 m-4 sm:m-6 bg-plaster-surface/95 backdrop-blur-md rounded-2xl p-4 border border-soot/12 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-soot text-plaster flex items-center justify-center font-bold text-sm">
                  99%
                </div>
                <div>
                  <div className="text-xs font-bold text-soot">Member Satisfaction</div>
                  <div className="text-[10px] text-moss">Over 2,400+ reviews Kingdom-wide</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-eucalyptus uppercase bg-soot/90 px-2.5 py-1 rounded-lg">
                Top Rated
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Band */}
      <section className="bg-plaster-dark/40 py-16 border-y border-soot/10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <Quote size={32} className="text-eucalyptus mx-auto opacity-80" />
          <p className="text-xl sm:text-2xl text-soot font-serif-display italic leading-relaxed">
            &ldquo;Coworking Pass simplified remote work for our entire team across Riyadh and Jeddah. Seamless booking and outstanding space quality.&rdquo;
          </p>
          <div className="pt-2">
            <div className="text-sm font-semibold text-soot">Sarah Al-Qahtani</div>
            <div className="text-xs text-moss">Head of People &amp; Culture, TechFlow Saudi</div>
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width Floating Banner */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="relative w-full bg-soot rounded-3xl p-10 sm:p-16 text-center overflow-hidden border border-soot/20 shadow-2xl">
          {/* Background Glow Accents */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 rounded-full bg-eucalyptus/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-eucalyptus/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl text-plaster mb-4 font-normal font-serif-display tracking-tight">
              Ready to find your workspace?
            </h2>
            <p className="text-plaster/80 text-sm sm:text-base mb-8 leading-relaxed max-w-xl mx-auto">
              Join thousands of professionals working smarter across Saudi Arabia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => navigate('signup')}
                className="btn-primary w-full sm:w-auto px-8 py-3.5"
              >
                Get started free
              </button>
              <button
                type="button"
                onClick={() => navigate('browse')}
                className="btn-secondary w-full sm:w-auto px-8 py-3.5 border-white/20 text-plaster hover:bg-white/10"
              >
                Browse spaces
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
