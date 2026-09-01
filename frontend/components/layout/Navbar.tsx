'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useApp } from '@/app/store';
import Logo from './logo';

export default function GuestNav() {
  const { navigate, nav } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

const links = [
  { label: 'Home', screen: 'landing' as const },
  { label: 'Browse Spaces', screen: 'browse' as const },
  { label: 'Plans', screen: 'pricing' as const },
  { label: 'Contact', screen: 'contact' as const },
];

  return (
    <header className="sticky top-0 z-40 bg-plaster/95 backdrop-blur-sm border-b border-soot/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2.5 group"
        >
          <Logo />
          <span className="font-semibold text-soot text-[15px] tracking-tight">Coworking Pass</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <button
              key={l.screen}
              onClick={() => navigate(l.screen)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                nav.screen === l.screen
                  ? 'bg-soot text-plaster'
                  : 'text-moss hover:text-soot hover:bg-soot/5'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => navigate('login')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-moss hover:text-soot transition-colors"
          >
            Log in
          </button>
          <button
            onClick={() => navigate('signup')}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-eucalyptus text-soot hover:bg-eucalyptus-dark transition-colors"
          >
            Sign up
          </button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-soot/5 text-soot"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-soot/8 bg-plaster px-4 py-3 space-y-1">
          {links.map(l => (
            <button
              key={l.screen}
              onClick={() => { navigate(l.screen); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-moss hover:text-soot hover:bg-soot/5 transition-colors"
            >
              {l.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => { navigate('login'); setMobileOpen(false); }}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-soot/15 text-soot"
            >
              Log in
            </button>
            <button
              onClick={() => { navigate('signup'); setMobileOpen(false); }}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-eucalyptus text-soot"
            >
              Sign up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
