'use client';

import { AppProvider, useApp } from './store';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Guest screens
import Landing from './Landing';
import Browse from './spaces/page';
import SpaceDetails from './spaces/[id]/page';
import Pricing from './Pricing';
import Contact from './contact';
import { LoginScreen, SignUpScreen, ChooseAccountType, ForgotPasswordScreen, OtpVerificationScreen, ResetPasswordScreen } from '@/app/Auth/page';
import Notifications from '@/Notifications';

// Individual screens
import IndividualDashboard from './individual/Dashboard';
import BookingFlow from './individual/BookingFlow';
import MyBookings from './individual/MyBookings';
import LoyaltyPage from '@/app/loyalty/page';
import LegalPage from '@/app/legal/page';
import ProfileSettings from './individual/ProfileSettings';

// Organization screens
import OrgDashboard from './organization/Dashboard';
import OrgProfile from './organization/OrgProfile';
import TeamBooking from './organization/TeamBooking';
import TeamBookings from './organization/TeamBookings';
import CompanyTeam from './organization/CompanyTeam';

// Provider screens
import ProviderDashboard from './provider/Dashboard';
import ProviderMySpaces from './provider/MySpaces';
import ProviderSpaceBookings from './provider/SpaceBookings';
import ProviderLoyaltyProposals from './provider/LoyaltyProposals';
import ProviderProfileSettings from './provider/ProfileSettings';

// Admin screens
import AdminDashboard from './admin/Dashboard';
import SpacesAdmin from './admin/SpacesAdmin';
import UsersAdmin from './admin/UsersAdmin';
import BookingsAdmin from './admin/BookingsAdmin';
import HourlyBookingsAdmin from './admin/HourlyBookingsAdmin';
import MembershipPlansAdmin from './admin/MembershipPlansAdmin';
import SubscriptionsAdmin from './admin/SubscriptionsAdmin';
import PaymentsAdmin from './admin/PaymentsAdmin';
import PayoutsAdmin from './admin/PayoutsAdmin';
import LoyaltyProposalsAdmin from './admin/LoyaltyProposalsAdmin';
import SupportAdmin from './admin/SupportAdmin';
import Reports from './admin/Reports';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-plaster">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export const DashboardLayout = AppLayout;

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

function Router() {
  const { nav, currentUser } = useApp();
  const screen = nav.screen;

  // Unauthenticated / Guest flow
  if (!currentUser) {
    if (screen === 'landing') return <Landing />;

    return (
      <div className="min-h-screen flex flex-col bg-plaster">
        {screen !== 'login' && screen !== 'signup' && screen !== 'choose-type' && screen !== 'forgot-password' && screen !== 'otp-verify' && screen !== 'reset-password' && <Navbar />}
        <div className="flex-1">
          {screen === 'browse' && <Browse />}
          {screen === 'space-details' && <SpaceDetails />}
          {screen === 'pricing' && <Pricing />}
          {screen === 'contact' && <Contact />}
          {(screen === 'privacy-policy' || screen === 'terms-of-service' || screen === 'legal') && <LegalPage />}
          {screen === 'login' && <LoginScreen />}
          {screen === 'signup' && <SignUpScreen />}
          {screen === 'choose-type' && <ChooseAccountType />}
          {screen === 'forgot-password' && <ForgotPasswordScreen />}
          {screen === 'otp-verify' && <OtpVerificationScreen />}
          {screen === 'reset-password' && <ResetPasswordScreen />}
        </div>
        {screen !== 'login' && screen !== 'signup' && screen !== 'choose-type' && screen !== 'forgot-password' && screen !== 'otp-verify' && screen !== 'reset-password' && <Footer />}
      </div>
    );
  }

  const role = currentUser.role;

  // Admin flow
  if (role === 'admin') {
    return (
      <AppLayout>
        {screen === 'admin-dashboard' && <AdminDashboard />}
        {screen === 'admin-spaces' && <SpacesAdmin />}
        {screen === 'admin-users' && <UsersAdmin />}
        {screen === 'admin-bookings' && <BookingsAdmin />}
        {screen === 'admin-hourly-bookings' && <HourlyBookingsAdmin />}
        {screen === 'admin-plans' && <MembershipPlansAdmin />}
        {screen === 'admin-subscriptions' && <SubscriptionsAdmin />}
        {screen === 'admin-payments' && <PaymentsAdmin />}
        {screen === 'admin-payouts' && <PayoutsAdmin />}
        {screen === 'admin-loyalty-proposals' && <LoyaltyProposalsAdmin />}
        {screen === 'admin-support' && <SupportAdmin />}
        {screen === 'admin-reports' && <Reports />}
        {screen === 'admin-settings' && <AdminSettingsPage />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'loyalty' && <LoyaltyPage />}
        {screen === 'legal' && <LegalPage />}
      </AppLayout>
    );
  }

  // Organization flow
  if (role === 'organization') {
    return (
      <AppLayout>
        {screen === 'org-dashboard' && <OrgDashboard />}
        {screen === 'company-workspaces' && <OrgDashboard />}
        {screen === 'company-add-workspace' && <OrgDashboard />}
        {screen === 'company-bookings' && <TeamBookings />}
        {screen === 'company-team' && <CompanyTeam />}
        {screen === 'team-booking' && <TeamBooking />}
        {screen === 'team-bookings' && <TeamBookings />}
        {screen === 'org-profile' && <OrgProfile />}
        {screen === 'org-settings' && <OrgProfile />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'loyalty' && <LoyaltyPage />}
        {screen === 'legal' && <LegalPage />}
      </AppLayout>
    );
  }

  // Provider flow
  if (role === 'provider') {
    return (
      <AppLayout>
        {screen === 'provider-dashboard' && <ProviderDashboard />}
        {screen === 'provider-spaces' && <ProviderMySpaces />}
        {screen === 'provider-bookings' && <ProviderSpaceBookings />}
        {screen === 'provider-loyalty-proposals' && <ProviderLoyaltyProposals />}
        {screen === 'provider-profile' && <ProviderProfileSettings />}
        {screen === 'provider-settings' && <ProviderProfileSettings />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'loyalty' && <LoyaltyPage />}
        {screen === 'legal' && <LegalPage />}
      </AppLayout>
    );
  }

  // Individual Member flow
  return (
    <AppLayout>
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
      {screen === 'notifications' && <Notifications />}
      {screen === 'loyalty' && <LoyaltyPage />}
      {screen === 'legal' && <LegalPage />}
    </AppLayout>
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

export default function App() {
  return (
    <>
      <Router />
      <Toast />
    </>
  );
}
