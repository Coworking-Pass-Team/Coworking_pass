'use client';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, User as UserIcon, LogOut, ChevronDown, Calendar, Building2, Users, Settings, CreditCard, HelpCircle, Wallet, Bell, CheckCheck, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react';
import { useApp } from '@/app/store';
import Logo from './logo';
import WalletModal from '@/components/ui/WalletModal';
import SharedWalletModal from '@/components/ui/SharedWalletModal';

export function WalletButton({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  const { currentUser, companyWalletBalance } = useApp();
  if (!currentUser) return null;

  if (currentUser.role === 'admin' || currentUser.role === 'provider') return null;

  const isOrg = currentUser.role === 'organization';
  const balance = isOrg ? (companyWalletBalance ?? 0) : (currentUser.walletBalance ?? 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full bg-[#E2E8E4] hover:bg-[#DDE6DF] border border-[#2D3536]/15 text-soot text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0 ${className}`}
      title={isOrg ? 'Corporate Shared Wallet' : 'Digital Wallet'}
      aria-label={`Wallet balance: SAR ${balance.toLocaleString()}`}
    >
      <Wallet size={14} className="text-moss shrink-0" />
      <span className="font-bold text-soot flex items-center gap-0.5">
        <span className="text-[10px] text-moss/80 font-medium">SAR</span>
        <span>{balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
      </span>
    </button>
  );
}

export function LoyaltyButton() {
  const { navigate, currentUser } = useApp();
  if (!currentUser) return null;

  if (currentUser.role === 'admin' || currentUser.role === 'provider' || currentUser.role === 'organization') return null;

  const points = currentUser.loyaltyPoints || 0;

  return (
    <button
      type="button"
      onClick={() => navigate('loyalty')}
      className="flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full bg-[#E2E8E4] hover:bg-[#DDE6DF] border border-[#2D3536]/15 text-soot text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
      title="Loyalty Rewards Hub"
    >
      <Sparkles size={14} className="text-moss shrink-0" />
      <span className="hidden xl:inline">{points.toLocaleString()} pts</span>
      <span className="xl:hidden">{points.toLocaleString()}</span>
    </button>
  );
}

export function NotificationButton() {
  const { navigate, notifications, unreadNotificationsCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={notifRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 sm:p-2.5 rounded-2xl text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer shrink-0"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] leading-4 text-center font-semibold animate-pulse">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-soot/10 z-[60] overflow-hidden divide-y divide-soot/5 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="p-3.5 bg-moss text-[#FAF8F5] flex items-center justify-between shadow-2xs border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#DDE6DF]" />
              <span className="text-xs font-bold tracking-wide text-[#FAF8F5]">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DDE6DF] text-soot shadow-2xs">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[#FAF8F5] transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-medium border border-white/20"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} className="text-[#DDE6DF]" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-soot/5">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-moss">
                <Bell size={24} className="mx-auto opacity-40 mb-2 text-moss" />
                <p className="text-xs font-medium">No notifications yet.</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markNotificationRead(n.id);
                    setIsOpen(false);
                    navigate('notifications');
                  }}
                  className={`p-3.5 hover:bg-soot/3 transition-colors cursor-pointer flex gap-3 items-start ${
                    n.read ? 'bg-white' : 'bg-[#EAF1F5]/70'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.read ? 'bg-transparent' : 'bg-eucalyptus'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs ${n.read ? 'font-medium text-soot' : 'font-bold text-soot'} truncate`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-moss/80 shrink-0 font-medium">{n.createdAt}</span>
                    </div>
                    <p className="text-xs text-moss line-clamp-2 mt-0.5 leading-snug">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-plaster-dark/25 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('notifications');
              }}
              className="text-xs font-semibold text-soot hover:text-eucalyptus flex items-center justify-center gap-1 w-full py-1 cursor-pointer transition-colors"
            >
              <span>View all notifications</span>
              <ChevronRight size={13} className="text-moss" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CartButton({ className = '' }: { className?: string }) {
  const { cart, openCart, currentUser } = useApp();
  if (!currentUser) return null;

  if (currentUser.role === 'admin' || currentUser.role === 'provider') return null;

  const itemCount = cart.length;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Shopping Cart (${itemCount} reservation${itemCount !== 1 ? 's' : ''})`}
      className={`relative p-2 sm:p-2.5 rounded-2xl text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer shrink-0 flex items-center justify-center ${className}`}
      title={itemCount > 0 ? `Shopping Cart (${itemCount} item${itemCount !== 1 ? 's' : ''})` : 'Shopping Cart (Empty)'}
    >
      <ShoppingBag size={19} />
      {itemCount > 0 && (
        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-soot text-plaster text-[9px] leading-4 text-center font-bold shadow-2xs flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}

export default function Navbar() {
  const { navigate, nav, currentUser, logout, companyWalletBalance } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { label: 'Home', screen: 'landing' as const },
        { label: 'Browse Spaces', screen: 'browse' as const },
        { label: 'Pricing & Plans', screen: 'pricing' as const },
        { label: 'Contact Us', screen: 'contact' as const },
      ];
    }

    const role = currentUser.role;

    // تم تثبيت Plans & Passes هنا لمنظمات الشركات
    if (role === 'organization') {
      return [
        { label: 'Dashboard', screen: 'org-dashboard' as const },
        { label: 'Browse Spaces', screen: 'browse' as const },
        { label: 'Plans & Passes', screen: 'pricing' as const },
        { label: 'Team Bookings', screen: 'company-bookings' as const },
        { label: 'Team Members', screen: 'company-team' as const },
      ];
    }

    if (role === 'provider') {
      return [
        { label: 'Dashboard', screen: 'provider-dashboard' as const },
        { label: 'My Spaces', screen: 'provider-spaces' as const },
        { label: 'Bookings', screen: 'provider-bookings' as const },
        { label: 'Loyalty Proposals', screen: 'provider-loyalty-proposals' as const },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Dashboard', screen: 'admin-dashboard' as const },
        { label: 'Spaces', screen: 'admin-spaces' as const },
        { label: 'Users', screen: 'admin-users' as const },
        { label: 'Bookings', screen: 'admin-bookings' as const },
        { label: 'Loyalty Proposals', screen: 'admin-loyalty-proposals' as const },
        { label: 'Reports', screen: 'admin-reports' as const },
      ];
    }

    return [
      { label: 'Dashboard', screen: 'ind-dashboard' as const },
      { label: 'Browse Spaces', screen: 'browse' as const },
      { label: 'Pricing & Plans', screen: 'pricing' as const },
      { label: 'My Bookings', screen: 'my-bookings' as const },
    ];
  };

  const links = getNavLinks();

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

  const isConsumerOrOrg = currentUser && currentUser.role !== 'admin' && currentUser.role !== 'provider';

  return (
    <header className="sticky top-0 z-50 w-full bg-plaster-surface/95 backdrop-blur-md border-b border-soot/12 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Logo & Main Navigation */}
        <div className="flex items-center gap-3 sm:gap-4 xl:gap-6 min-w-0">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-soot/30 rounded-xl p-1 transition-all shrink-0 cursor-pointer"
            title="Go to Home"
            aria-label="Coworking Pass Home"
          >
            <Logo className="h-8 sm:h-9 xl:h-10 w-auto shrink-0" />
            <span className="font-serif-display font-normal text-soot text-lg sm:text-xl xl:text-2xl tracking-tight group-hover:text-soot-light transition-colors hidden sm:block whitespace-nowrap">
              Coworking Pass
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 min-w-0">
            {links.map(l => {
              const isActive = nav.screen === l.screen;
              return (
                <button
                  key={l.screen}
                  onClick={() => navigate(l.screen)}
                  className={`relative px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all duration-200 focus:outline-none cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/10 font-semibold'
                      : 'text-moss hover:text-soot hover:bg-soot/5 active:scale-98'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Header Actions */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 shrink-0">
          {currentUser && <CartButton />}

          {isConsumerOrOrg && (
            <>
              <WalletButton onClick={() => setWalletModalOpen(true)} />
              <LoyaltyButton />
            </>
          )}

          {currentUser && <NotificationButton />}

          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 xl:gap-2.5 p-1 xl:p-1.5 pr-2 xl:pr-3 rounded-2xl border border-soot/12 bg-plaster-dark/30 hover:bg-plaster-dark/60 transition-all duration-200 cursor-pointer active:scale-98 focus:outline-none focus:ring-2 focus:ring-soot/20"
                aria-label="User profile menu"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                  alt={currentUser.name}
                  className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl object-cover border border-soot/10 shadow-xs shrink-0"
                />
                <div className="text-left hidden xl:block max-w-[110px] 2xl:max-w-[140px]">
                  <div className="text-xs font-semibold text-soot leading-tight truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-moss font-medium truncate">{getRoleLabel()}</div>
                </div>
                <ChevronDown size={14} className={`text-moss transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`absolute right-0 mt-2 w-64 bg-plaster-surface rounded-3xl border border-soot/12 shadow-2xl p-2 z-[60] animate-in fade-in zoom-in-95 duration-150 ${
                  dropdownOpen ? 'block' : 'hidden'
                }`}
              >
                <div className="p-3 border-b border-soot/8 mb-1">
                  <div className="font-semibold text-soot text-sm">{currentUser.name}</div>
                  <div className="text-xs text-moss truncate mt-0.5">{currentUser.email}</div>
                  <div className="mt-2">
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

                  <button
                    onClick={() => {
                      navigate(currentUser.role === 'admin' ? 'admin-support' : 'contact');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-soot hover:bg-plaster-dark/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle size={15} className="text-moss" />
                    <span>Help & Support Desk</span>
                  </button>

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
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('login')}
                className="px-3.5 xl:px-5 py-1.5 xl:py-2.5 rounded-full text-xs xl:text-sm font-medium text-soot hover:bg-soot/5 active:scale-98 transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('signup')}
                className="px-4 xl:px-6 py-1.5 xl:py-2.5 rounded-full text-xs xl:text-sm font-medium bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] border border-soot/8 shadow-xs active:scale-98 transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex lg:hidden items-center gap-1 sm:gap-2 shrink-0">
          {currentUser && <CartButton />}

          {isConsumerOrOrg && (
            <>
              <WalletButton onClick={() => setWalletModalOpen(true)} />
              {currentUser.role !== 'organization' && (
                <div className="hidden sm:block">
                  <LoyaltyButton />
                </div>
              )}
            </>
          )}

          {currentUser && <NotificationButton />}

          <button
            className="p-2 rounded-xl text-soot hover:bg-plaster-dark/50 active:scale-95 transition-all focus:outline-none cursor-pointer shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-soot/10 bg-plaster-surface/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4.5rem)] overflow-y-auto">
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

      {/* المودالات المالية */}
      {isConsumerOrOrg && (
        currentUser.role === 'organization' ? (
          <SharedWalletModal
            isOpen={walletModalOpen}
            onClose={() => setWalletModalOpen(false)}
          />
        ) : (
          <WalletModal
            isOpen={walletModalOpen}
            onClose={() => setWalletModalOpen(false)}
          />
        )
      )}
    </header>
  );
}

export function GuestNav() {
  return <Navbar />;
}
