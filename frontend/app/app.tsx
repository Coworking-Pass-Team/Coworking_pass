'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard, Search, CalendarDays, Settings, LogOut,
  Building2, Users, BarChart3, BookOpen,
  Briefcase, AlertCircle, Bell, Sparkles, CheckCheck, ChevronRight, ShoppingBag
} from 'lucide-react';
import { Screen } from '@/types/types';
import { useApp } from '@/app/store';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LogoImage from '@/components/layout/logo';
import Modal from '@/components/ui/Modal';
import UserAvatar from '@/components/ui/UserAvatar';
import CartDrawer from '@/app/CartDrawer';

// Guest screens
import Landing from './Landing';
import Browse from '@/app/spaces/page';
import SpaceDetails from '@/app/spaces/[id]/page';
import Pricing from './Pricing';
import Contact from './contact';
import { LoginScreen, SignUpScreen, ChooseAccountType, ForgotPasswordScreen } from '@/app/Auth/page';
import Notifications from '@/Notifications';

// Individual screens
import IndividualDashboard from './individual/Dashboard';
import BookingFlow from './individual/BookingFlow';
import MyBookings from './individual/MyBookings';
import LoyaltyPage from '@/app/loyalty/page';
import ProfileSettings from './individual/ProfileSettings';

// Organization screens
import OrgDashboard from './organization/Dashboard';
import TeamBooking from './organization/TeamBooking';
import TeamBookings from './organization/TeamBookings';
import OrgProfile from './organization/OrgProfile';
import CompanyBookings from './organization/CompanyBookings';
import CompanyTeam from './organization/CompanyTeam';

// Provider screens
import ProviderDashboard from './provider/Dashboard';
import ProviderMySpaces from './provider/MySpaces';
import ProviderSpaceBookings from './provider/SpaceBookings';
import ProviderProfileSettings from './provider/ProfileSettings';

// Admin screens
import AdminDashboard from './admin/Dashboard';
import SpacesAdmin from './admin/SpacesAdmin';
import UsersAdmin from './admin/UsersAdmin';
import BookingsAdmin from './admin/BookingsAdmin';
import Reports from './admin/Reports';
import AdminSettings from './admin/AdminSettings';

interface NavItem {
  label: string;
  screen: Screen;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const individualNav: NavItem[] = [
  { label: 'Dashboard', screen: 'ind-dashboard', icon: LayoutDashboard },
  { label: 'Browse Spaces', screen: 'browse', icon: Search },
  { label: 'My Bookings', screen: 'my-bookings', icon: CalendarDays },
  { label: 'Settings', screen: 'ind-settings', icon: Settings },
];

const orgNav: NavItem[] = [
  { label: 'Dashboard', screen: 'org-dashboard', icon: LayoutDashboard },
  { label: 'Browse Spaces', screen: 'browse', icon: Search },
  { label: 'Team Bookings', screen: 'team-bookings', icon: Briefcase },
  { label: 'Team Members', screen: 'company-team', icon: Users },
  { label: 'Settings', screen: 'org-settings', icon: Settings },
];

const providerNav: NavItem[] = [
  { label: 'Dashboard', screen: 'provider-dashboard', icon: LayoutDashboard },
  { label: 'My Spaces', screen: 'provider-spaces', icon: Building2 },
  { label: 'Bookings', screen: 'provider-bookings', icon: BookOpen },
  { label: 'Settings', screen: 'provider-settings', icon: Settings },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', screen: 'admin-dashboard', icon: LayoutDashboard },
  { label: 'Spaces', screen: 'admin-spaces', icon: Building2 },
  { label: 'Users', screen: 'admin-users', icon: Users },
  { label: 'Bookings', screen: 'admin-bookings', icon: BookOpen },
  { label: 'Reports', screen: 'admin-reports', icon: BarChart3 },
  { label: 'Settings', screen: 'admin-settings', icon: Settings },
];

function NotificationButton() {
  const { navigate, notifications, unreadNotificationsCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
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
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-soot/10 z-50 overflow-hidden divide-y divide-soot/5 animate-in fade-in-50 zoom-in-95 duration-100">
            {/* Header with Moss background */}
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

            {/* Notification List */}
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

            {/* Footer link */}
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
        </>
      )}
    </div>
  );
}


function CartButton({ onClick }: { onClick: () => void }) {
  const { cart } = useApp();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Shopping Cart"
      className="relative p-2 sm:p-2.5 rounded-2xl text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer shrink-0"
      title="Shopping Cart"
    >
      <ShoppingBag size={19} />
      {cart.length > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-emerald-800 text-white text-[9px] leading-4 text-center font-bold animate-pulse shadow-2xs">
          {cart.length}
        </span>
      )}
    </button>
  );
}

export function LoyaltyButton() {
  const { navigate, currentUser } = useApp();
  if (!currentUser) return null;
  const points = currentUser.loyaltyPoints || 0;

  return (
    <button
      type="button"
      onClick={() => navigate('loyalty')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E2E8E4] hover:bg-[#DDE6DF] border border-[#2D3536]/15 text-soot text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
      title="Loyalty Rewards Hub"
    >
      <Sparkles size={14} className="text-moss shrink-0" />
      <span>{points.toLocaleString()} pts</span>
    </button>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, navigate, logout, nav } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const role = currentUser.role;

  const navItems = role === 'admin' ? adminNav
    : role === 'organization' ? orgNav
    : role === 'provider' ? providerNav
    : individualNav;

  const dashboardScreen: Screen = role === 'admin' ? 'admin-dashboard'
    : role === 'organization' ? 'org-dashboard'
    : role === 'provider' ? 'provider-dashboard'
    : 'ind-dashboard';

  const profileScreen: Screen = role === 'admin' ? 'admin-settings'
    : role === 'organization' ? 'org-profile'
    : role === 'provider' ? 'provider-profile'
    : 'ind-profile';

  const isActive = (item: NavItem) => {
    if (item.screen === nav.screen) return true;
    if (item.screen === 'browse' && (nav.screen === 'browse' || nav.screen === 'space-details' || nav.screen === 'booking-flow' || nav.screen === 'team-booking')) return true;
    if (item.screen === 'ind-profile' && nav.screen === 'ind-profile') return true;
    if (item.screen === 'ind-settings' && nav.screen === 'ind-settings') return true;
    if (item.screen === 'org-profile' && nav.screen === 'org-profile') return true;
    if (item.screen === 'org-settings' && nav.screen === 'org-settings') return true;
    return false;
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-plaster text-soot">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 w-full bg-plaster-surface/95 backdrop-blur-md border-b border-soot/12 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 w-full">
          
          {/* Brand Logo & Title */}
          <button
            type="button"
            onClick={() => navigate(dashboardScreen)}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer focus:outline-none shrink-0 group mr-2"
          >
            <LogoImage className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform shrink-0" />
            <span className="font-serif-display font-normal text-soot text-lg sm:text-xl xl:text-2xl tracking-tight hidden sm:inline-block whitespace-nowrap">
              Coworking Pass
            </span>
          </button>

          {/* Centered Navigation Row */}
          <nav className="hidden xl:flex items-center justify-center gap-1 flex-1 min-w-0 mx-2">
            {navItems.map(item => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.screen}
                  type="button"
                  onClick={() => navigate(item.screen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs xl:text-sm font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    active
                      ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/10 font-semibold'
                      : 'text-moss hover:text-soot hover:bg-soot/5'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-soot' : 'text-moss'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            <span
              className={`hidden 2xl:inline-flex text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs shrink-0 ${
                role === 'organization' || role === 'admin'
                  ? 'bg-[#DDE6DF] text-soot border-soot/10'
                  : role === 'provider'
                  ? 'bg-mist/30 text-soot border-mist/50'
                  : 'bg-eucalyptus/20 text-soot border-eucalyptus/30'
              }`}
            >
              {role === 'organization' ? 'HR Admin (B2B)' : role === 'admin' ? 'Admin Portal' : `${role} portal`}
            </span>

            {(role === 'individual' || role === 'organization' || (role as any) === 'B2C' || (role as any) === 'HR_ADMIN') && (
              <>
                <LoyaltyButton />
                <CartButton onClick={() => setCartOpen(true)} />
              </>
            )}
            <NotificationButton />

            <button
              type="button"
              onClick={() => navigate(profileScreen)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-full hover:bg-soot/5 border border-transparent hover:border-soot/10 transition-all cursor-pointer shrink-0"
            >
              <UserAvatar
                src={currentUser.avatar}
                name={currentUser.name}
                size="sm"
              />
              <span className="hidden lg:block text-xs sm:text-sm font-semibold text-soot">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="p-1.5 sm:p-2 rounded-xl text-moss hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Subnav Row */}
        <div className="xl:hidden border-t border-soot/10 bg-plaster-surface py-2 px-4 overflow-x-auto scrollbar-none flex items-center gap-2">
          {navItems.map(item => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <button
                key={item.screen}
                type="button"
                onClick={() => navigate(item.screen)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'bg-[#E2E8E4] text-[#2D3536] ring-1 ring-[#2D3536]/15 shadow-2xs'
                    : 'text-moss hover:text-soot'
                }`}
              >
                <Icon size={14} className={active ? 'text-[#2D3536]' : 'text-moss'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <Footer />

      {/* Logout Confirmation Modal */}
      <Modal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="btn-danger"
            >
              Log Out
            </button>
          </>
        }
      >
        <div className="flex items-start gap-4 py-2">
          <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle size={22} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-soot mb-1 font-serif-display">
              Are you sure you want to log out?
            </h3>
            <p className="text-xs text-moss leading-relaxed">
              You will need to sign in again to access your active bookings and workspace dashboard.
            </p>
          </div>
        </div>
      </Modal>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const colors = {
    success: 'bg-moss text-plaster border border-plaster/30',
    error: 'bg-red-600 text-white',
    info: 'bg-plaster-surface text-soot font-medium border border-soot/10',
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-100 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
        colors[toast.type as keyof typeof colors] || colors.info
      } transition-all animate-bounce`}
    >
      {toast.message}
    </div>
  );
}

export function Router() {
  const { nav, currentUser } = useApp();
  const screen = nav.screen;

  // Unauthenticated / Guest flow
  if (!currentUser) {
    if (screen === 'landing') return <Landing />;

    return (
      <div className="min-h-screen flex flex-col bg-plaster">
        {screen !== 'login' && screen !== 'signup' && screen !== 'choose-type' && screen !== 'forgot-password' && <Navbar />}
        <div className="flex-1">
          {screen === 'browse' && <Browse />}
          {screen === 'space-details' && <SpaceDetails />}
          {screen === 'pricing' && <Pricing />}
          {screen === 'contact' && <Contact />}
          {screen === 'login' && <LoginScreen />}
          {screen === 'signup' && <SignUpScreen />}
          {screen === 'choose-type' && <ChooseAccountType />}
          {screen === 'forgot-password' && <ForgotPasswordScreen />}
        </div>
        {screen !== 'login' && screen !== 'signup' && screen !== 'choose-type' && screen !== 'forgot-password' && <Footer />}
      </div>
    );
  }

  const role = currentUser.role;

  // Admin flow
  if (role === 'admin') {
    return (
      <DashboardLayout>
        {screen === 'admin-dashboard' && <AdminDashboard />}
        {screen === 'admin-spaces' && <SpacesAdmin />}
        {screen === 'admin-users' && <UsersAdmin />}
        {screen === 'admin-bookings' && <BookingsAdmin />}
        {screen === 'admin-reports' && <Reports />}
        {screen === 'admin-settings' && <AdminSettings />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
      </DashboardLayout>
    );
  }

  // Organization flow
  if (role === 'organization') {
    return (
      <DashboardLayout>
        {screen === 'org-dashboard' && <OrgDashboard />}
        {screen === 'company-workspaces' && <OrgDashboard />}
        {screen === 'company-add-workspace' && <OrgDashboard />}
        {screen === 'company-bookings' && <TeamBookings />}
        {screen === 'company-team' && <CompanyTeam />}
        {screen === 'team-booking' && <TeamBooking />}
        {screen === 'team-bookings' && <TeamBookings />}
        {screen === 'org-profile' && <OrgProfile />}
        {screen === 'org-settings' && <OrgProfile />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'loyalty' && <LoyaltyPage />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
      </DashboardLayout>
    );
  }

  // Space Provider flow
  if (role === 'provider') {
    return (
      <DashboardLayout>
        {screen === 'provider-dashboard' && <ProviderDashboard />}
        {screen === 'provider-spaces' && <ProviderMySpaces />}
        {screen === 'provider-bookings' && <ProviderSpaceBookings />}
        {screen === 'provider-profile' && <ProviderProfileSettings />}
        {screen === 'provider-settings' && <ProviderProfileSettings />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'loyalty' && <LoyaltyPage />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
      </DashboardLayout>
    );
  }

  // Individual Member flow
  return (
    <DashboardLayout>
      {screen === 'ind-dashboard' && <IndividualDashboard />}
      {screen === 'browse' && <Browse />}
      {screen === 'space-details' && <SpaceDetails />}
      {screen === 'booking-flow' && <BookingFlow />}
      {screen === 'booking-confirm' && <BookingFlow />}
      {screen === 'my-bookings' && <MyBookings />}
      {screen === 'booking-details' && <MyBookings />}
      {screen === 'ind-profile' && <ProfileSettings mode="profile" />}
      {screen === 'ind-settings' && <ProfileSettings mode="settings" />}
      {screen === 'notifications' && <Notifications />}
      {screen === 'loyalty' && <LoyaltyPage />}
      {screen === 'pricing' && <Pricing />}
      {screen === 'contact' && <Contact />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <>
      <Router />
      <Toast />
    </>
  );
}
