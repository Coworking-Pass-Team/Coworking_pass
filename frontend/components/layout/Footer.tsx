'use client';

import { useI18n } from '@/i18n';
import LogoImage from './logo';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';

export default function Footer() {

  const { t } = useI18n();
  const st = useSpaceText();
  const { navigate, currentUser } = useApp();

  const role = currentUser?.role;

  return (
    <footer className="bg-soot text-plaster mt-auto border-t border-soot-light/20 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-soot-light/30">
          
          {/* Brand & Role Column */}
          <div className="lg:col-span-2 space-y-4">
            <button
              type="button"
              onClick={() => navigate('landing')}
              className="flex items-center gap-3 group text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus rounded-xl p-0.5 cursor-pointer"
              title={t('nav.goHome')}
              aria-label={t('nav.homeAria')}
            >
              <LogoImage className="h-8 w-auto" />
              <span className="font-serif-display font-normal text-plaster text-xl sm:text-2xl tracking-tight group-hover:text-eucalyptus transition-colors duration-200">
                {t('common.appName')}
              </span>
            </button>

            <p className="text-plaster/80 text-sm leading-relaxed max-w-sm">
              {!currentUser && t('footer.tagGuest')}
              {role === 'organization' && t('footer.tagOrg')}
              {role === 'individual' && t('footer.tagIndividual')}
              {role === 'provider' && t('footer.tagProvider')}
              {role === 'admin' && t('footer.tagAdmin')}
            </p>

            <div className="flex items-center gap-3 text-xs font-medium pt-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-soot-light/30 border border-soot-light/40 text-eucalyptus">
                <span className="flag-emoji">🇸🇦</span> {t('footer.madeInSaudi')}
              </span>
              {role && (
                <span className="px-3 py-1 rounded-full bg-eucalyptus/20 border border-eucalyptus/30 text-plaster font-semibold uppercase text-[10px] tracking-wider">
                  {role === 'organization' ? t('nav.roleOrg') : role === 'provider' ? t('nav.roleProvider') : role === 'admin' ? t('footer.superAdmin') : t('nav.roleIndividual')}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Column 1 */}
          <div>
            <h3 className="text-plaster font-serif-display text-base font-semibold tracking-wide mb-4">
              {!currentUser && t('footer.navigation')}
              {role === 'organization' && t('footer.workspacesTeam')}
              {role === 'individual' && t('footer.memberPortal')}
              {role === 'provider' && t('footer.providerHub')}
              {role === 'admin' && t('footer.administration')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {!currentUser && (
                <>
                  <li><button onClick={() => navigate('landing')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('nav.home')}</button></li>
                  <li><button onClick={() => navigate('browse')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('nav.browseSpaces')}</button></li>
                  <li><button onClick={() => navigate('pricing')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.plansPricing')}</button></li>
                  <li><button onClick={() => navigate('contact')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('nav.contactUs')}</button></li>
                </>
              )}
              {role === 'organization' && (
                <>
                  <li><button onClick={() => navigate('org-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.companyDashboard')}</button></li>
                  <li><button onClick={() => navigate('browse')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('nav.browseSpaces')}</button></li>
                  <li><button onClick={() => navigate('team-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.teamBookings')}</button></li>
                  <li><button onClick={() => navigate('waitlist')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.workspaceWaitlist')}</button></li>
                  <li><button onClick={() => navigate('company-team')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.teamMembers')}</button></li>
                </>
              )}
              {role === 'individual' && (
                <>
                  <li><button onClick={() => navigate('ind-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.memberDashboard')}</button></li>
                  <li><button onClick={() => navigate('browse')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.browseWorkspaces')}</button></li>
                  <li><button onClick={() => navigate('my-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.myActiveBookings')}</button></li>
                  <li><button onClick={() => navigate('waitlist')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('nav.priorityWaitlist')}</button></li>
                  <li><button onClick={() => navigate('ind-profile')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.myProfile')}</button></li>
                </>
              )}
              {role === 'provider' && (
                <>
                  <li><button onClick={() => navigate('provider-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.providerDashboard')}</button></li>
                  <li><button onClick={() => navigate('provider-spaces')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.myListedSpaces')}</button></li>
                  <li><button onClick={() => navigate('provider-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.reservations')}</button></li>
                </>
              )}
              {role === 'admin' && (
                <>
                  <li><button onClick={() => navigate('admin-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.controlPanel')}</button></li>
                  <li><button onClick={() => navigate('admin-spaces')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.manageVenues')}</button></li>
                  <li><button onClick={() => navigate('admin-users')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.manageUsers')}</button></li>
                  <li><button onClick={() => navigate('admin-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.globalBookings')}</button></li>
                </>
              )}
            </ul>
          </div>

          {/* Dynamic Column 2 */}
          <div>
            <h3 className="text-plaster font-serif-display text-base font-semibold tracking-wide mb-4">
              {!currentUser || role === 'individual' ? t('footer.topLocations') : role === 'organization' ? t('footer.enterpriseHub') : role === 'provider' ? t('footer.venueCare') : t('footer.systemInsights')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {(!currentUser || role === 'individual') ? (
                ['Riyadh', 'Jeddah', 'Makkah', 'Khobar', 'Madinah'].map(city => (
                  <li key={city}>
                    <button
                      onClick={() => navigate('browse', { city })}
                      className="text-plaster/75 hover:text-eucalyptus transition-colors text-start"
                    >
                      {st.cityName(city)}
                    </button>
                  </li>
                ))
              ) : role === 'organization' ? (
                <>
                  <li><button onClick={() => navigate('team-bookings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.teamBookings')}</button></li>
                  <li><button onClick={() => navigate('org-profile')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.companyProfile')}</button></li>
                  <li><button onClick={() => navigate('org-settings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.enterpriseSettings')}</button></li>
                  <li><button onClick={() => navigate('org-settings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.billing')}</button></li>
                </>
              ) : role === 'provider' ? (
                <>
                  <li><button onClick={() => navigate('provider-profile')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.partnerProfile')}</button></li>
                  <li><button onClick={() => navigate('provider-settings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.partnerSettings')}</button></li>
                  <li><button onClick={() => navigate('provider-dashboard')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.occupancyAnalytics')}</button></li>
                </>
              ) : (
                <>
                  <li><button onClick={() => navigate('admin-reports')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.globalReports')}</button></li>
                  <li><button onClick={() => navigate('admin-settings')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.platformControls')}</button></li>
                </>
              )}
            </ul>
          </div>

          {/* Dynamic Column 3 */}
          <div>
            <h3 className="text-plaster font-serif-display text-base font-semibold tracking-wide mb-4">
              {!currentUser ? t('footer.getStarted') : t('footer.helpPolicies')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {!currentUser ? (
                <>
                  <li><button onClick={() => navigate('login')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.memberLogin')}</button></li>
                  <li><button onClick={() => navigate('signup')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.createAccount')}</button></li>
                  <li><button onClick={() => navigate('choose-type')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.listYourSpace')}</button></li>
                </>
              ) : (
                <>
                  <li><button onClick={() => navigate('contact')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.supportDesk')}</button></li>
                  <li><button onClick={() => navigate('terms-of-service')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.termsCancellation')}</button></li>
                  <li><button onClick={() => navigate('privacy-policy')} className="text-plaster/75 hover:text-eucalyptus transition-colors text-start">{t('footer.privacyCompliance')}</button></li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-plaster/65">
          <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('privacy-policy')} className="hover:text-eucalyptus transition-colors duration-200 cursor-pointer font-medium">
              {t('footer.privacy')}
            </button>
            <button onClick={() => navigate('terms-of-service')} className="hover:text-eucalyptus transition-colors duration-200 cursor-pointer font-medium">
              {t('footer.terms')}
            </button>
            <button onClick={() => navigate('contact')} className="hover:text-eucalyptus transition-colors duration-200 cursor-pointer font-medium">
              {t('footer.support')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

