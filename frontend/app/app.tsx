'use client';

import { useEffect } from 'react';
import { useI18n } from '@/i18n';
import UserAvatar from '@/components/ui/UserAvatar';
import { AppProvider, useApp } from './store';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ChromeContext } from '@/components/layout/Chrome';
import CartDrawer from './CartDrawer';

// Guest screens
import Landing from './Landing';
import Browse from './spaces/page';
import SpaceDetails from './spaces/[id]/page';
import Pricing from './Pricing';
import Contact from './contact';
import { LoginScreen, SignUpScreen, ChooseAccountType, ForgotPasswordScreen, OtpVerificationScreen, ResetPasswordScreen } from '@/app/Auth/page';
import AccountSuspendedScreen from './Auth/AccountSuspendedScreen';
import Notifications from '@/Notifications';

// Individual screens
import IndividualDashboard from './individual/Dashboard';
import BookingFlow from './individual/BookingFlow';
import MyBookings from './individual/MyBookings';
import LoyaltyPage from '@/app/loyalty/page';
import LegalPage from '@/app/legal/page';
import ProfileSettings from './individual/ProfileSettings';
import WaitlistPage from '@/app/WaitlistPage';
import MyTickets from './support/MyTickets';

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
import AdminSettings from './admin/AdminSettings';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChromeContext.Provider value={true}>
      <div className="min-h-screen flex flex-col bg-plaster">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ChromeContext.Provider>
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

/** Company employees do not buy passes: send them home and explain why. */
function EmployeePassesRedirect() {
  const { navigate, showToast } = useApp();
  const { t } = useI18n();
  useEffect(() => {
    navigate('ind-dashboard');
    showToast(t('companyMember.passesByCompany'), 'info');
    // Runs once when the screen is requested
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function Router() {
  const { nav, currentUser, logout } = useApp();
  const screen = nav.screen;

  // Account suspended screen: show when screen is 'account-suspended' or if currentUser is blocked
  if (screen === 'account-suspended' || currentUser?.isBlocked) {
    if (currentUser?.isBlocked && typeof window !== 'undefined') {
      localStorage.removeItem('cp_token');
      localStorage.removeItem('cp_currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('jwt');
      if (logout) {
        setTimeout(() => logout(), 0);
      }
    }
    return <AccountSuspendedScreen />;
  }

  // Home / Landing page (accessible to both guests and authenticated users)
  if (screen === 'landing') return <Landing />;

  // Unauthenticated / Guest flow
  if (!currentUser) {

    return (
      <ChromeContext.Provider value={true}>
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
      </ChromeContext.Provider>
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
        {screen === 'admin-settings' && <AdminSettings />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'waitlist' && <WaitlistPage />}
        {screen === 'loyalty' && <LoyaltyPage />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
        {(screen === 'privacy-policy' || screen === 'terms-of-service' || screen === 'legal') && <LegalPage />}
      </AppLayout>
    );
  }

  // Organization flow
  if (role === 'organization') {
    return (
      <AppLayout>
        {screen === 'org-dashboard' && <OrgDashboard />}
        {screen === 'company-bookings' && <TeamBookings />}
        {screen === 'company-team' && <CompanyTeam />}
        {screen === 'team-booking' && <TeamBooking />}
        {screen === 'team-bookings' && <TeamBookings />}
        {screen === 'waitlist' && <WaitlistPage />}
        {screen === 'org-profile' && <OrgProfile />}
        {screen === 'org-settings' && <OrgProfile />}
        {screen === 'my-tickets' && <MyTickets />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'loyalty' && <LoyaltyPage />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
        {(screen === 'privacy-policy' || screen === 'terms-of-service' || screen === 'legal') && <LegalPage />}
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
        {screen === 'my-tickets' && <MyTickets />}
        {screen === 'notifications' && <Notifications />}
        {screen === 'waitlist' && <WaitlistPage />}
        {screen === 'loyalty' && <LoyaltyPage />}
        {screen === 'browse' && <Browse />}
        {screen === 'space-details' && <SpaceDetails />}
        {screen === 'pricing' && <Pricing />}
        {screen === 'contact' && <Contact />}
        {(screen === 'privacy-policy' || screen === 'terms-of-service' || screen === 'legal') && <LegalPage />}
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
      {screen === 'waitlist' && <WaitlistPage />}
      {screen === 'ind-profile' && <ProfileSettings mode="profile" />}
      {screen === 'ind-settings' && <ProfileSettings mode="settings" />}
      {screen === 'my-tickets' && <MyTickets />}
      {screen === 'notifications' && <Notifications />}
      {screen === 'loyalty' && <LoyaltyPage />}
      {screen === 'pricing' && (currentUser.companyId ? <EmployeePassesRedirect /> : <Pricing />)}
      {screen === 'contact' && <Contact />}
      {(screen === 'privacy-policy' || screen === 'terms-of-service' || screen === 'legal') && <LegalPage />}
    </AppLayout>
  );
}

export default function App() {
  const { isCartOpen, closeCart, openCart, nav, currentUser, navigate } = useApp();

  useEffect(() => {
    if (nav?.screen === 'cart') {
      if (currentUser) {
        openCart();
      } else {
        navigate('login');
      }
    }
  }, [nav?.screen, openCart, currentUser, navigate]);

  return (
    <>
      <Router />
      <Toast />
      {currentUser && (
        <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      )}
    </>
  );
}
