'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, X, User as UserIcon, LogOut, ChevronDown, Calendar, Building2, MoreHorizontal, Users, Settings } from 'lucide-react';
import { useApp } from '@/app/store';
import Logo from './logo';

export default function Navbar() {
  const { navigate, nav, currentUser, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMoreMouseEnter = () => {
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
    setMoreOpen(true);
  };

  const handleMoreMouseLeave = () => {
    moreTimeoutRef.current = setTimeout(() => {
      setMoreOpen(false);
    }, 250);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
    };
  }, []);

  // Determine navigation links based on user role
  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { label: 'Home', screen: 'landing' as const },
        { label: 'Browse Spaces', screen: 'browse' as const },
        { label: 'Plans & Pricing', screen: 'pricing' as const },
        { label: 'Contact Us', screen: 'contact' as const },
      ];
    }

    const role = currentUser.role;

    if (role === 'organization') {
      return [
        { label: 'Dashboard', screen: 'org-dashboard' as const },
        { label: 'Workspaces', screen: 'company-workspaces' as const },
        { label: 'Reports', screen: 'company-reports' as const },
      ];
    }

    if (role === 'provider') {
      return [
        { label: 'Dashboard', screen: 'provider-dashboard' as const },
        { label: 'My Spaces', screen: 'provider-spaces' as const },
        { label: 'Bookings', screen: 'provider-bookings' as const },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Dashboard', screen: 'admin-dashboard' as const },
        { label: 'Spaces', screen: 'admin-spaces' as const },
        { label: 'Users', screen: 'admin-users' as const },
        { label: 'Bookings', screen: 'admin-bookings' as const },
        { label: 'Reports', screen: 'admin-reports' as const },
      ];
    }

    // Default: Individual B2C User
    return [
      { label: 'Dashboard', screen: 'ind-dashboard' as const },
      { label: 'Browse Spaces', screen: 'browse' as const },
      { label: 'My Bookings', screen: 'my-bookings' as const },
    ];
  };

  const links = getNavLinks();

  // Profile screen target based on role
  const getProfileScreen = () => {
    if (!currentUser) return 'login';
    if (currentUser.role === 'organization') return 'org-profile';
    if (currentUser.role === 'provider') return 'provider-profile';
    if (currentUser.role === 'admin') return 'admin-settings';
    return 'ind-profile';
  };

  const profileScreen = getProfileScreen();

  const getRoleLabel = () => {
    if (!currentUser) return '';
    if (currentUser.role === 'admin') return 'Admin Portal';
    if (currentUser.role === 'organization') return 'HR Admin (B2B)';
    if (currentUser.role === 'provider') return 'Space Partner';
    return 'Individual Member';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-plaster-surface/95 backdrop-blur-md border-b border-soot/12 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name */}
        <button
          onClick={() => navigate(currentUser ? (currentUser.role === 'admin' ? 'admin-dashboard' : currentUser.role === 'organization' ? 'org-dashboard' : currentUser.role === 'provider' ? 'provider-dashboard' : 'ind-dashboard') : 'landing')}
          className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-soot/30 rounded-xl p-1 transition-all shrink-0 cursor-pointer"
        >
          <Logo className="h-9 sm:h-11 w-auto" />
          <span className="font-serif-display font-normal text-soot text-xl sm:text-2xl lg:text-3xl tracking-tight group-hover:text-soot-light transition-colors hidden sm:block">
            Coworking Pass
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center mx-2 min-w-0">
          {links.map(l => {
            const isActive = nav.screen === l.screen;
            return (
              <button
                key={l.screen}
                onClick={() => navigate(l.screen)}
                className={`relative px-3 xl:px-4 py-2 rounded-full text-xs xl:text-sm font-medium transition-all duration-200 focus:outline-none cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/10 font-semibold'
                    : 'text-moss hover:text-soot hover:bg-soot/5 active:scale-98'
                }`}
              >
                {l.label}
              </button>
            );
          })}

          {currentUser?.role === 'organization' && (
            <div
              className="relative shrink-0"
              ref={moreRef}
              onMouseEnter={handleMoreMouseEnter}
              onMouseLeave={handleMoreMouseLeave}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreOpen(prev => !prev);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs xl:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  ['company-bookings', 'company-team', 'browse', 'org-settings', 'team-bookings'].includes(nav.screen) || moreOpen
                    ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/10 font-semibold'
                    : 'text-moss hover:text-soot hover:bg-soot/5'
                }`}
              >
                <MoreHorizontal size={16} />
                <span>Management</span>
                <ChevronDown size={14} className={`text-moss transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-plaster-surface rounded-2xl border border-soot/15 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {[
                    { label: 'Team Bookings', screen: 'company-bookings' as const, icon: Calendar },
                    { label: 'Team Members', screen: 'company-team' as const, icon: Users },
                    { label: 'Browse Spaces', screen: 'browse' as const, icon: Building2 },
                    { label: 'Settings', screen: 'org-settings' as const, icon: Settings },
                  ].map(item => {
                    const active = nav.screen === item.screen;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.screen}
                        type="button"
                        onClick={() => {
                          navigate(item.screen);
                          setMoreOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#DDE6DF] text-soot shadow-2xs'
                            : 'text-soot hover:bg-soot/5'
                        }`}
                      >
                        <Icon size={15} className="text-moss shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Desktop Auth / User Profile Menu */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {currentUser ? (
            /* Logged-In User Profile Dropdown Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl border border-soot/12 bg-plaster-dark/30 hover:bg-plaster-dark/60 transition-all duration-200 cursor-pointer active:scale-98 focus:outline-none focus:ring-2 focus:ring-soot/20"
                aria-label="User profile menu"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover border border-soot/10 shadow-xs"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-soot leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-moss font-medium">{getRoleLabel()}</div>
                </div>
                <ChevronDown size={14} className={`text-moss transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Popup */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-plaster-surface rounded-3xl border border-soot/12 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-soot/8 mb-1">
                    <div className="font-semibold text-soot text-sm">{currentUser.name}</div>
                    <div className="text-xs text-moss truncate mt-0.5">{currentUser.email}</div>
                    <div className="mt-2">
                      {/* Unified Badge style for all roles */}
                      <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-[#DDE6DF] text-soot border border-soot/6 shadow-2xs">
                        {getRoleLabel()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        navigate(profileScreen);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-soot hover:bg-plaster-dark/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserIcon size={15} className="text-moss" />
                      <span>My Profile & Account</span>
                    </button>

                    {currentUser.role === 'individual' && (
                      <button
                        onClick={() => {
                          navigate('my-bookings');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-soot hover:bg-plaster-dark/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Calendar size={15} className="text-moss" />
                        <span>My Bookings</span>
                      </button>
                    )}

                    {currentUser.role === 'organization' && (
                      <button
                        onClick={() => {
                          navigate('company-bookings');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-soot hover:bg-plaster-dark/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Building2 size={15} className="text-moss" />
                        <span>Company Bookings</span>
                      </button>
                    )}

                    <div className="pt-1 mt-1 border-t border-soot/8">
                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guest Auth Buttons */
            <>
              <button
                onClick={() => navigate('login')}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-soot hover:bg-soot/5 active:scale-98 transition-all duration-200 cursor-pointer"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('signup')}
                className="px-6 py-2.5 rounded-full text-sm font-medium bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] border border-soot/8 shadow-xs active:scale-98 transition-all duration-200 cursor-pointer"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-xl text-soot hover:bg-plaster-dark/50 active:scale-95 transition-all focus:outline-none cursor-pointer shrink-0"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-soot/10 bg-plaster-surface/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          {currentUser && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-plaster-dark/30 border border-soot/10 mb-2">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-soot truncate">{currentUser.name}</div>
                <div className="text-xs text-moss truncate">{currentUser.email}</div>
              </div>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-semibold bg-[#DDE6DF] text-soot border border-soot/6">
                {getRoleLabel()}
              </span>
            </div>
          )}

          <nav className="space-y-1">
            {links.map(l => {
              const isActive = nav.screen === l.screen;
              return (
                <button
                  key={l.screen}
                  onClick={() => {
                    navigate(l.screen);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-soot text-plaster font-semibold'
                      : 'text-moss hover:text-soot hover:bg-plaster-dark/40'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}

            {currentUser && (
              <button
                onClick={() => {
                  navigate(profileScreen);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-150 cursor-pointer flex items-center justify-between ${
                  nav.screen === profileScreen
                    ? 'bg-soot text-plaster font-semibold'
                    : 'text-moss hover:text-soot hover:bg-plaster-dark/40'
                }`}
              >
                <span>My Profile & Settings</span>
                <UserIcon size={18} />
              </button>
            )}
          </nav>

          <div className="pt-3 border-t border-soot/8 flex flex-col gap-2.5">
            {currentUser ? (
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="w-full px-4 py-3 rounded-xl text-base font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('login');
                    setMobileOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-base font-medium border border-soot/15 text-soot hover:bg-plaster-dark/40 active:scale-98 transition-all cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    navigate('signup');
                    setMobileOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-base font-semibold bg-soot text-plaster hover:bg-moss active:scale-98 transition-all cursor-pointer"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function GuestNav() {
  return <Navbar />;
}
