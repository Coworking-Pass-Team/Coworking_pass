'use client';
import { useState } from 'react';
import { ArrowRight, MapPin, Star, Users, Zap, Shield, Headphones, ChevronDown } from 'lucide-react';
import { useApp } from './store';
import GuestNav from '@/components/layout/Navbar';
import LogoImage from '@/components/layout/logo';

const cities = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];

export default function Landing() {
  const { navigate, spaces } = useApp();
  const [searchCity, setSearchCity] = useState('');

  const featured = spaces.filter(s => s.isFeatured && s.isVisible).slice(0, 3);

  const handleSearch = () => {
    navigate('browse', { city: searchCity });
  };

  return (
    <div className="min-h-full bg-plaster">
      <GuestNav />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=1000&fit=crop&auto=format"
            alt="Modern coworking space"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-soot/55" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-white/20">
              <Zap size={11} className="text-eucalyptus" />
              Saudi Arabia's Coworking Platform
            </div>
            <h1 className="text-5xl sm:text-6xl font-normal text-white leading-tight mb-5" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Your perfect workspace,<br />
              <span className="text-eucalyptus italic">anywhere in the Kingdom.</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
              Access premium coworking spaces in Riyadh, Jeddah, Dammam, and beyond. Book by the day, month, or year.
            </p>

            {/* Search */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2.5 flex-1 px-3 py-2 border border-soot/10 rounded-xl">
                <MapPin size={16} className="text-moss shrink-0" />
                <select
                  className="flex-1 bg-transparent text-soot text-sm outline-none"
                  value={searchCity}
                  onChange={e => setSearchCity(e.target.value)}
                >
                  {cities.map(c => <option key={c} value={c === 'All Cities' ? '' : c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 bg-soot text-plaster px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-soot-light transition-colors"
              >
                Find Spaces
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="flex items-center gap-6 mt-6 text-white/70 text-sm">
              <div className="flex items-center gap-1.5">
                <Star size={13} fill="currentColor" className="text-eucalyptus" />
                <span>4.8 avg rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={13} />
                <span>2,400+ members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={13} />
                <span>8 spaces</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <ChevronDown size={22} />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-soot py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '8+', label: 'Spaces' },
            { value: '6', label: 'Cities' },
            { value: '2,400+', label: 'Members' },
            { value: '4.8★', label: 'Avg Rating' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-semibold text-eucalyptus mb-1">{s.value}</div>
              <div className="text-white/60 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured spaces */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-moss text-sm font-medium mb-2 uppercase tracking-wider">Featured</p>
            <h2 className="text-4xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Popular spaces</h2>
          </div>
          <button
            onClick={() => navigate('browse')}
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-moss hover:text-soot transition-colors"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featured.map(space => (
            <div
              key={space.id}
              className="group cursor-pointer"
              onClick={() => navigate('space-details', { spaceId: space.id })}
            >
              <div className="relative h-56 rounded-2xl overflow-hidden mb-4">
                <img
                  src={space.images[0]}
                  alt={space.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-soot/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-white font-semibold text-lg leading-snug" style={{ fontFamily: 'DM Serif Display, serif' }}>{space.name}</div>
                  <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                    <MapPin size={11} />
                    {space.city}
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center">
                  <div className="text-soot font-semibold text-sm">SAR {space.pricing.daily}</div>
                  <div className="text-moss text-[10px]">/ day</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-soot">
                  <Star size={13} fill="#98AA9D" className="text-eucalyptus" />
                  <span className="font-medium">{space.rating}</span>
                  <span className="text-moss">({space.reviewCount} reviews)</span>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    space.availableCapacity === 0 ? 'bg-red-50 text-red-500'
                    : space.availableCapacity <= 5 ? 'bg-amber-50 text-amber-600'
                    : 'bg-eucalyptus/20 text-moss'
                  }`}>
                    {space.availableCapacity === 0 ? 'Fully Booked' : space.availableCapacity <= 5 ? 'Limited' : 'Available'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <button
            onClick={() => navigate('browse')}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-soot text-plaster"
          >
            View all spaces
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-mist/30 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-moss text-sm font-medium mb-2 uppercase tracking-wider">Simple process</p>
            <h2 className="text-4xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Browse & discover', desc: 'Explore premium coworking spaces across Saudi Arabia, filtered by city, type, and amenities.' },
              { step: '02', title: 'Choose your plan', desc: 'Select a daily, monthly, or yearly plan that fits your schedule and budget perfectly.' },
              { step: '03', title: 'Book & work', desc: 'Confirm instantly and access your space. Manage, edit, or cancel anytime from your dashboard.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-mist/40 flex items-center justify-center mx-auto mb-4">
                  <span className="text-soot font-semibold text-sm">{item.step}</span>
                </div>
                <h3 className="font-semibold text-soot text-lg mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>{item.title}</h3>
                <p className="text-moss text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-moss text-sm font-medium mb-2 uppercase tracking-wider">Why Coworking Pass</p>
            <h2 className="text-4xl text-soot mb-6" style={{ fontFamily: 'DM Serif Display, serif' }}>Built for the modern professional</h2>
            <div className="space-y-5">
              {[
                { icon: Zap, title: 'Instant booking', desc: 'Book any space in under 2 minutes with real-time availability.', bg: 'bg-eucalyptus/15' },
                { icon: Shield, title: 'Secure & reliable', desc: 'Every space is verified, every transaction is protected.', bg: 'bg-mist/30' },
                { icon: Headphones, title: '24/7 support', desc: 'Our team is always here to help with any questions or issues.', bg: 'bg-eucalyptus/15' },
              ].map(f => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                    <f.icon size={18} className="text-moss" />
                  </div>
                  <div>
                    <div className="font-semibold text-soot mb-1">{f.title}</div>
                    <div className="text-moss text-sm leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-80 rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop&auto=format"
              alt="Coworking professionals"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-soot/20 rounded-3xl" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-soot py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Ready to find your workspace?
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Join thousands of professionals working smarter across Saudi Arabia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('signup')}
              className="px-8 py-3 rounded-xl font-semibold bg-eucalyptus text-soot hover:bg-eucalyptus-dark transition-colors"
            >
              Get started free
            </button>
            <button
              onClick={() => navigate('browse')}
              className="px-8 py-3 rounded-xl font-medium border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Browse spaces
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-plaster-dark py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-eucalyptus flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="#2D3536" />
                <rect x="9" y="2" width="5" height="5" rx="1" fill="#2D3536" opacity="0.5" />
                <rect x="2" y="9" width="5" height="5" rx="1" fill="#2D3536" opacity="0.5" />
                <rect x="9" y="9" width="5" height="5" rx="1" fill="#2D3536" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
             <LogoImage className="w-6 h-6 rounded-md" />
             <span className="font-semibold text-soot text-sm">
               Coworking Pass
             </span>
            </div>

          </div>
          <p className="text-moss text-sm">© 2025 Coworking Pass. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-moss">
            <button className="hover:text-soot transition-colors">Privacy</button>
            <button className="hover:text-soot transition-colors">Terms</button>
            <button onClick={() => navigate('contact')} className="hover:text-soot transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
