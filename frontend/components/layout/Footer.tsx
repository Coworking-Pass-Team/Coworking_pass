'use client';

import LogoImage from './logo';
import { useApp } from '@/app/store';

export default function Footer() {
  const { navigate, currentUser } = useApp();

  const role = currentUser?.role;

  return (
    <footer className="bg-soot text-plaster mt-auto border-t border-soot-light/20 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-soot-light/30">
          
          {/* Brand & Role Column */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => navigate(currentUser ? (role === 'admin' ? 'admin-dashboard' : role === 'organization' ? 'org-dashboard' : role === 'provider' ? 'provider-dashboard' : 'ind-dashboard') : 'landing')}
              className="flex items-center gap-3 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus rounded-xl p-0.5"
            >
              <LogoImage className="h-8 w-auto" />
              <span className="font-serif-display font-normal text-plaster text-xl sm:text-2xl tracking-tight group-hover:text-eucalyptus transition-colors duration-200">
                Coworking Pass
              </span>
            </button>

            <p className="text-plaster/80 text-sm leading-relaxed max-w-sm">
              {!currentUser && 'Connecting professionals, freelancers, and enterprise teams with premium coworking spaces across Saudi Arabia.'}
              {role === 'organization' && 'Enterprise workspace management platform for company teams, team bookings, and corporate pass administration.'}
              {role === 'individual' && 'Your all-access pass to flex desks, private offices, and meeting rooms across major Saudi cities.'}
              {role === 'provider' && 'Partner dashboard for managing venue listings, real-time availability, guest bookings, and space performance.'}
              {role === 'admin' && 'Central system administration, venue moderation, user access controls, and platform metrics.'}
            </p>

            <div className="flex items-center gap-3 text-xs font-medium pt-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-soot-light/30 border border-soot-light/40 text-eucalyptus">
                🇸🇦 Made in Saudi Arabia
              </span>
              {role && (
                <span className="px-3 py-1 rounded-full bg-eucalyptus/20 border border-eucalyptus/30 text-plaster font-semibold uppercase text-[10px] tracking-wider">
                  {role === 'organization' ? 'HR Admin (B2B)' : role === 'provider' ? 'Space Partner' : role === 'admin' ? 'Super Admin' : 'Individual Member'}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Column 1 */}
          <div>
            <h3 className="text-plaster font-serif-display text-base font-semibold tracking-wide mb-4">
              {!currentUser && 'Navigation'}
              {role === 'organization' && 'Workspaces & Team'}
              {role === 'individual' && 'Member Portal'}
              {role === 'provider' && 'Provider Hub'}
              {role === 'admin' && 'Administration'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {!currentUser && (
                <>
                  <li><button onClick={() => navigate('landing')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Home</button></li>
                  <li><button onClick={() => navigate('browse')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Browse Spaces</button></li>
                  <li><button onClick={() => navigate('pricing')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Plans & Pricing</button></li>
                  <li><button onClick={() => navigate('contact')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Contact Us</button></li>
                </>
              )}
              {role === 'organization' && (
                <>
                  <li><button onClick={() => navigate('org-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Company Dashboard</button></li>
                  <li><button onClick={() => navigate('company-workspaces')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Workspaces Inventory</button></li>
                  <li><button onClick={() => navigate('team-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Team Bookings</button></li>
                  <li><button onClick={() => navigate('company-team')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Team Members</button></li>
                </>
              )}
              {role === 'individual' && (
                <>
                  <li><button onClick={() => navigate('ind-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Member Dashboard</button></li>
                  <li><button onClick={() => navigate('browse')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Browse Workspaces</button></li>
                  <li><button onClick={() => navigate('my-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">My Active Bookings</button></li>
                  <li><button onClick={() => navigate('ind-profile')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">My Profile</button></li>
                </>
              )}
              {role === 'provider' && (
                <>
                  <li><button onClick={() => navigate('provider-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Provider Dashboard</button></li>
                  <li><button onClick={() => navigate('provider-spaces')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">My Listed Spaces</button></li>
                  <li><button onClick={() => navigate('provider-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Reservations</button></li>
                </>
              )}
              {role === 'admin' && (
                <>
                  <li><button onClick={() => navigate('admin-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Control Panel</button></li>
                  <li><button onClick={() => navigate('admin-spaces')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Manage Venues</button></li>
                  <li><button onClick={() => navigate('admin-users')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Manage Users</button></li>
                  <li><button onClick={() => navigate('admin-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Global Bookings</button></li>
                </>
              )}
            </ul>
          </div>

          {/* Dynamic Column 2 */}
          <div>
            <h3 className="text-plaster font-serif-display text-base font-semibold tracking-wide mb-4">
              {!currentUser || role === 'individual' ? 'Top Locations' : role === 'organization' ? 'Enterprise Hub' : role === 'provider' ? 'Venue Care' : 'System Insights'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {(!currentUser || role === 'individual') ? (
                ['Riyadh', 'Jeddah', 'Makkah', 'Khobar', 'Madinah'].map(city => (
                  <li key={city}>
                    <button
                      onClick={() => navigate('browse', { city })}
                      className="text-plaster/75 hover:text-eucalyptus transition-colors text-left"
                    >
                      {city}
                    </button>
                  </li>
                ))
              ) : role === 'organization' ? (
                <>
                  <li><button onClick={() => navigate('company-reports')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Reports & Analytics</button></li>
                  <li><button onClick={() => navigate('org-profile')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Company Profile</button></li>
                  <li><button onClick={() => navigate('org-settings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Enterprise Settings</button></li>
                  <li><button onClick={() => navigate('org-settings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Billing & Invoices</button></li>
                </>
              ) : role === 'provider' ? (
                <>
                  <li><button onClick={() => navigate('provider-profile')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Space Partner Profile</button></li>
                  <li><button onClick={() => navigate('provider-settings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Partner Settings</button></li>
                  <li><button onClick={() => navigate('provider-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Occupancy Analytics</button></li>
                </>
              ) : (
                <>
                  <li><button onClick={() => navigate('admin-reports')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Global Reports</button></li>
                  <li><button onClick={() => navigate('admin-settings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Platform Controls</button></li>
                </>
              )}
            </ul>
          </div>

          {/* Dynamic Column 3 */}
          <div>
            <h3 className="text-plaster font-serif-display text-base font-semibold tracking-wide mb-4">
              {!currentUser ? 'Get Started' : 'Help & Policies'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {!currentUser ? (
                <>
                  <li><button onClick={() => navigate('login')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Member Login</button></li>
                  <li><button onClick={() => navigate('signup')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Create Account</button></li>
                  <li><button onClick={() => navigate('choose-type')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">List Your Space</button></li>
                </>
              ) : (
                <>
                  <li><button onClick={() => navigate('contact')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Support & Help Desk</button></li>
                  <li><button onClick={() => navigate('contact')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Booking Guidelines</button></li>
                  <li><button onClick={() => navigate('contact')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-left">Community Standards</button></li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-plaster/65">
          <p>© {new Date().getFullYear()} Coworking Pass Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('contact')} className="hover:text-eucalyptus transition-colors duration-200">
              Privacy Policy
            </button>
            <button onClick={() => navigate('contact')} className="hover:text-eucalyptus transition-colors duration-200">
              Terms of Service
            </button>
            <button onClick={() => navigate('contact')} className="hover:text-eucalyptus transition-colors duration-200">
              Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

