'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard, Search, CalendarDays, User, Settings, LogOut,
  Building2, Users, BarChart3, BookOpen, Menu, X, ChevronRight,
  Briefcase
} from 'lucide-react';
import { Screen } from '@/types/types';
import { useApp } from './store';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LogoImage from '@/components/layout/logo';

// Guest screens
import Landing from './Landing';
import Browse from './spaces/page';
import SpaceDetails from './spaces/[id]/page';
import Pricing from './Pricing';
import Contact from './contact';
import { LoginScreen, SignUpScreen, ChooseAccountType } from './Auth/page';

// Individual screens
import IndividualDashboard from './individual/Dashboard';
import BookingFlow from './individual/BookingFlow';
import MyBookings from './individual/MyBookings';
import ProfileSettings from './individual/ProfileSettings';

// Organization screens
import OrgDashboard from './organization/Dashboard';
import TeamBooking from './organization/TeamBooking';
import TeamBookings from './organization/TeamBookings';
import OrgProfile from './organization/OrgProfile';

// Admin screens
import AdminDashboard from './admin/Dashboard';
import SpacesAdmin from './admin/SpacesAdmin';
import UsersAdmin from './admin/UsersAdmin';
import BookingsAdmin from './admin/BookingsAdmin';
import Reports from './admin/Reports';

interface NavItem {
  label: string;
  screen: Screen;
  icon: typeof LayoutDashboard;
}

const individualNav: NavItem[] = [
  { label: 'Dashboard', screen: 'ind-dashboard', icon: LayoutDashboard },
  { label: 'Browse Spaces', screen: 'browse', icon: Search },
  { label: 'My Bookings', screen: 'my-bookings', icon: CalendarDays },
  { label: 'Profile', screen: 'ind-profile', icon: User },
  { label: 'Settings', screen: 'ind-settings', icon: Settings },
];

const orgNav: NavItem[] = [
  { label: 'Dashboard', screen: 'org-dashboard', icon: LayoutDashboard },
  { label: 'Browse Spaces', screen: 'browse', icon: Search },
  { label: 'Team Bookings', screen: 'team-bookings', icon: Briefcase },
  { label: 'Org Profile', screen: 'org-profile', icon: Building2 },
  { label: 'Settings', screen: 'org-settings', icon: Settings },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', screen: 'admin-dashboard', icon: LayoutDashboard },
  { label: 'Spaces', screen: 'admin-spaces', icon: Building2 },
  { label: 'Users', screen: 'admin-users', icon: Users },
  { label: 'Bookings', screen: 'admin-bookings', icon: BookOpen },
  { label: 'Reports', screen: 'admin-reports', icon: BarChart3 },
  { label: 'Settings', screen: 'admin-settings', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, navigate, logout, nav } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const navItems = currentUser.role === 'admin' ? adminNav
    : currentUser.role === 'organization' ? orgNav
    : individualNav;

  const dashboardScreen: Screen = currentUser.role === 'admin' ? 'admin-dashboard'
    : currentUser.role === 'organization' ? 'org-dashboard'
    : 'ind-dashboard';

  const isActive = (item: NavItem) => {
    if (item.screen === nav.screen) return true;
    if (item.screen === 'browse' && (nav.screen === 'browse' || nav.screen === 'space-details' || nav.screen === 'booking-flow' || nav.screen === 'team-booking')) return true;
    return false;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5">
        <button onClick={() => { navigate(dashboardScreen); setMobileOpen(false); }} className="flex items-center gap-2.5">
          <LogoImage className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-plaster text-[15px] tracking-tight">
            Coworking Pass
          </span>
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(item => {
          const active = isActive(item);
          return (
            <button
              key={item.screen}
              onClick={() => { navigate(item.screen); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-eucalyptus text-soot'
                  : 'text-plaster/70 hover:bg-white/10 hover:text-plaster'
              }`}
            >
              <item.icon size={17} className={active ? 'text-soot' : ''} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-5 mt-4 border-t border-plaster/10 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-eucalyptus/30"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-plaster truncate">{currentUser.name}</div>
            <div className="text-xs text-plaster/50 capitalize truncate">{currentUser.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-plaster/60 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-plaster">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-soot h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ backgroundColor: 'rgba(45,53,54,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-64 bg-soot h-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="p-2 text-plaster/60 hover:text-plaster">
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 bg-plaster/95 backdrop-blur-sm border-b border-soot/8 h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-soot/5 text-soot"
          >
            <Menu size={20} />
          </button>
          <button onClick={() => navigate(dashboardScreen)} className="flex items-center gap-2.5">
            <LogoImage className="w-7 h-7 rounded-lg" />
            <span className="font-semibold text-soot text-sm tracking-tight">Coworking Pass</span>
          </button>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const colors = {
    success: 'bg-soot text-plaster',
    error: 'bg-red-500 text-white',
    info: 'bg-mist text-soot',
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
        colors[toast.type as keyof typeof colors] || colors.info
      } transition-all`}
    >
      {toast.message}
    </div>
  );
}

function AdminSettingsPage() {
  const { currentUser, logout } = useApp();
  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl text-soot mb-8" style={{ fontFamily: 'DM Serif Display, serif' }}>
        Admin Settings
      </h1>
      <div className="bg-white rounded-2xl border border-soot/8 p-6 mb-4">
        <h2 className="font-semibold text-soot mb-4">Account</h2>
        <div className="flex items-center gap-4 mb-4">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-14 h-14 rounded-full object-cover" />
          <div>
            <div className="font-semibold text-soot">{currentUser.name}</div>
            <div className="text-sm text-moss">{currentUser.email}</div>
            <div className="text-xs text-moss capitalize mt-0.5">{currentUser.role}</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-soot/8 p-6">
        <button onClick={logout} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium">
          Log out
        </button>
      </div>
    </div>
  );
}

export function Router() {
  const { nav, currentUser } = useApp();
  const screen = nav.screen;

  // Unauthenticated flow
  if (!currentUser) {
    if (screen === 'landing') return <Landing />;

    return (
      <div className="min-h-screen flex flex-col bg-plaster">
        {screen !== 'login' && screen !== 'signup' && screen !== 'choose-type' && <Navbar />}
        <div className="flex-1">
          {screen === 'browse' && <Browse />}
          {screen === 'space-details' && <SpaceDetails />}
          {screen === 'pricing' && <Pricing />}
          {screen === 'contact' && <Contact />}
          {screen === 'login' && <LoginScreen />}
          {screen === 'signup' && <SignUpScreen />}
          {screen === 'choose-type' && <ChooseAccountType />}
        </div>
        {screen !== 'login' && screen !== 'signup' && screen !== 'choose-type' && <Footer />}
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
        {screen === 'admin-settings' && <AdminSettingsPage />}
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
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'team-booking' && <TeamBooking />}
        {screen === 'team-bookings' && <TeamBookings />}
        {screen === 'org-profile' && <OrgProfile />}
        {screen === 'org-settings' && <OrgProfile />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
      </DashboardLayout>
    );
  }

  // Individual flow
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
