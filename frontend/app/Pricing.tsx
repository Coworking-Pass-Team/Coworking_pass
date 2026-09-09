'use client';

import React, { useState, useEffect } from 'react';
import {
  Check, ArrowRight, Sparkles, HelpCircle, Building2, User, ChevronDown,
  CreditCard, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight, Zap, RefreshCw, X
} from 'lucide-react';
import { useApp } from '@/app/store';
import { createSubscriptionApi, createPaymentApi } from '@/services/authApi';
import Modal from '@/components/ui/Modal';

interface PlanItem {
  id: string;
  name: string;
  price: number | null;
  period: string;
  desc: string;
  features: string[];
  featured: boolean;
  tier?: string;
  badge?: string;
  cta?: string;
  level: number;
}

const individualPlans: PlanItem[] = [
  {
    id: 'day',
    name: 'Day Pass',
    price: 120,
    period: '/day',
    desc: 'Ideal for occasional visits, focused sprints, and business day trips.',
    features: [
      'Access to any hot desk in the network',
      'High-speed business fiber WiFi',
      'Complimentary specialty coffee & tea',
      'Flexible booking & cancel anytime',
    ],
    featured: false,
    cta: 'Select Day Pass',
    level: 1,
  },
  {
    id: 'monthly',
    name: 'Monthly Pass',
    price: 1500,
    period: '/month',
    desc: 'Tailored for remote professionals, creators, and ambitious founders.',
    features: [
      'Unlimited workspace visits across Saudi',
      '2 Guest passes per month',
      '2 Hours monthly meeting room credits',
      'Priority waitlist & booking access',
      'Full community directory networking',
      'Dedicated phone booths access',
    ],
    featured: true,
    badge: 'Recommended',
    cta: 'Start Monthly Pass',
    level: 2,
  },
  {
    id: 'annual',
    name: 'Annual Pass',
    price: 15000,
    period: '/year',
    desc: 'Executive value with permanent locker storage and business branding.',
    features: [
      'All Monthly Pass network privileges',
      '5 Guest passes per month',
      '8 Hours monthly meeting room credits',
      'Dedicated personal storage locker',
      'Registered commercial business address',
      'Two months free vs monthly billing',
    ],
    featured: false,
    cta: 'Commit Annually',
    level: 3,
  },
];

const corporatePlans: PlanItem[] = [
  {
    id: 'team',
    name: 'Team Pass',
    tier: '5–20 Desks',
    price: 7500,
    period: '/month',
    desc: 'For agile startups looking for high-end flexible desk allocation.',
    features: [
      'Shared hot desk pool for team members',
      '10 Hours monthly meeting room access',
      'Centralized HR admin dashboard',
      'Single consolidated monthly VAT invoice',
      'Instant seat addition or downgrade',
    ],
    featured: false,
    cta: 'Register Team',
    level: 1,
  },
  {
    id: 'business',
    name: 'Business Pass',
    tier: '21–50 Desks',
    price: 18000,
    period: '/month',
    desc: 'Complete Kingdom coverage for regional enterprises and branches.',
    features: [
      'Dedicated team bays & private suites',
      'Unlimited meeting room reservations',
      'Dedicated enterprise account manager',
      'Custom corporate billing terms (30-day net)',
      'Multi-city onboarding & badge access',
      'On-site technical support SLA',
    ],
    featured: true,
    badge: 'Best Enterprise Choice',
    cta: 'Get Business Pass',
    level: 2,
  },
  {
    id: 'enterprise',
    name: 'Custom Enterprise',
    tier: '50+ Desks',
    price: null,
    period: 'Custom Quote',
    desc: 'Fully bespoke multi-city setups, custom security, and API integrations.',
    features: [
      'Bespoke headquarters space config',
      'Kingdom-wide multi-city network access',
      'Custom SSO and HRIS integrations',
      'Strict corporate SLA guarantees',
      'Exclusive private floor branding',
    ],
    featured: false,
    cta: 'Contact Advisory',
    level: 3,
  },
];

const faqs = [
  {
    q: 'Can I cancel or upgrade my pass anytime?',
    a: 'Yes. All daily and monthly passes can be cancelled or upgraded directly from your dashboard with zero penalty fees before the next billing cycle.',
  },
  {
    q: 'Which cities across Saudi Arabia are included?',
    a: 'Your pass gives you seamless access to verified locations across Riyadh, Jeddah, Dammam, Khobar, Madinah, and Makkah.',
  },
  {
    q: 'How does team allocation work for organizations?',
    a: 'HR Admins receive a centralized management console to assign passes, invite team members, configure branch permissions, and monitor utilization in real time.',
  },
  {
    q: 'Are all listed prices inclusive of VAT?',
    a: 'Yes, all listed prices are transparent and fully inclusive of 15% Saudi VAT, with official ZATCA-compliant e-invoices issued instantly.',
  },
];

type PaymentMethodType = 'MADA' | 'APPLE_PAY' | 'CREDIT_CARD' | 'CORPORATE_INVOICE';

export default function Pricing() {
  const { currentUser, showToast, navigate, updateCurrentUser, addNotification } = useApp();
  
  const isOrg = currentUser?.role === 'organization' || currentUser?.role === 'HR_ADMIN' || (currentUser?.role as any) === 'B2B';
  const isInd = Boolean(currentUser && !isOrg);

  const [guestBillingType, setGuestBillingType] = useState<'individual' | 'corporate'>('individual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Authenticated users are strictly locked to their account type
  const billingType: 'individual' | 'corporate' = currentUser
    ? (isOrg ? 'corporate' : 'individual')
    : guestBillingType;

  // Subscription state
  const hasActiveSubscription = Boolean(currentUser?.hasActivePass);
  const currentTier = currentUser?.membershipTier;

  // Checkout modal state
  const [checkoutPlan, setCheckoutPlan] = useState<PlanItem | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('MADA');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Manage Subscription modal state
  const [showManageModal, setShowManageModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Strictly enforce active plans based on account type
  const activePlans = billingType === 'individual' ? individualPlans : corporatePlans;

  // Helper to check if a plan is the user's active plan
  const isPlanCurrent = (plan: PlanItem): boolean => {
    if (!hasActiveSubscription) return false;
    if (!currentTier) {
      return isOrg ? plan.id === 'team' : plan.id === 'monthly';
    }
    const cleanTier = currentTier.toLowerCase().replace(/[-_]/g, ' ');
    const cleanName = plan.name.toLowerCase().replace(/[-_]/g, ' ');
    return (
      cleanTier === cleanName ||
      cleanTier.includes(cleanName) ||
      cleanName.includes(cleanTier) ||
      (plan.id === 'monthly' && cleanTier.includes('all-access')) ||
      (plan.id === 'team' && cleanTier.includes('corporate'))
    );
  };

  // Get current user's level
  const getCurrentUserPlanLevel = (): number => {
    if (!hasActiveSubscription) return 0;
    const matched = activePlans.find(p => isPlanCurrent(p));
    return matched ? matched.level : 1;
  };

  const handlePlanCardClick = (plan: PlanItem) => {
    if (!plan.price) {
      navigate('contact');
      return;
    }

    if (!currentUser) {
      showToast('Please sign in or create an account to subscribe.', 'info');
      navigate('signup');
      return;
    }

    // Strict account-type check: prevent subscribing to mismatched plan
    if (isInd && !individualPlans.some(p => p.id === plan.id)) {
      showToast('Organization plans are only available for Organization accounts.', 'error');
      return;
    }
    if (isOrg && !corporatePlans.some(p => p.id === plan.id)) {
      showToast('Individual plans are only available for Individual accounts.', 'error');
      return;
    }

    if (isPlanCurrent(plan)) {
      setShowManageModal(true);
      return;
    }

    // Open checkout flow
    setCheckoutPlan(plan);
    setSelectedPaymentMethod('MADA');
  };

  const handleConfirmSubscription = async () => {
    if (!checkoutPlan || !checkoutPlan.price || !currentUser) return;

    // Strict account-type check before calling API
    if (isInd && !individualPlans.some(p => p.id === checkoutPlan.id)) {
      showToast('Individual accounts cannot subscribe to organization plans.', 'error');
      setCheckoutPlan(null);
      return;
    }
    if (isOrg && !corporatePlans.some(p => p.id === checkoutPlan.id)) {
      showToast('Organization accounts cannot subscribe to individual plans.', 'error');
      setCheckoutPlan(null);
      return;
    }

    setIsProcessingPayment(true);

    const startDate = new Date().toISOString();
    const durationDays = checkoutPlan.id === 'day' ? 1 : checkoutPlan.id === 'annual' ? 365 : 30;
    const endDate = new Date(Date.now() + durationDays * 86400000).toISOString();

    try {
      // 1. Backend Subscription creation
      const res = await createSubscriptionApi({
        userId: currentUser.id,
        planId: checkoutPlan.id,
        startDate,
        endDate,
        status: 'ACTIVE',
      });

      // 2. Backend Payment recording
      await createPaymentApi({
        userId: currentUser.id,
        amount: checkoutPlan.price,
        method: selectedPaymentMethod,
        paymentFor: 'SUBSCRIPTION',
        referenceId: res.data?.id || checkoutPlan.id,
        status: 'SUCCESS',
      }).catch(err => console.warn('[Payment Record]', err));

      // 3. Update current user state in app & localStorage
      updateCurrentUser({
        hasActivePass: true,
        membershipTier: checkoutPlan.name,
      });

      // 4. Add In-App notification
      addNotification({
        userId: currentUser.id,
        title: hasActiveSubscription ? 'Pass Upgraded Successfully' : 'Pass Activated Successfully',
        message: `Your ${checkoutPlan.name} is now active. Enjoy seamless access to premium coworking spaces across Saudi Arabia!`,
        type: 'payment',
      });

      setIsProcessingPayment(false);
      setCheckoutPlan(null);

      showToast(`Subscribed to ${checkoutPlan.name} successfully!`, 'success');

      // Navigate to respective dashboard
      if (currentUser.role === 'organization' || currentUser.role === 'HR_ADMIN') {
        navigate('org-dashboard');
      } else {
        navigate('ind-dashboard');
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      showToast(err.message || 'Payment processing failed. Please try again.', 'error');
    }
  };

  const handleCancelSubscription = () => {
    if (!currentUser) return;
    setIsCancelling(true);

    setTimeout(() => {
      updateCurrentUser({
        hasActivePass: false,
        membershipTier: undefined,
      });

      addNotification({
        userId: currentUser.id,
        title: 'Pass Subscription Cancelled',
        message: 'Your coworking membership pass has been cancelled.',
        type: 'system',
      });

      setIsCancelling(false);
      setShowManageModal(false);
      showToast('Subscription cancelled successfully.', 'info');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-plaster text-soot py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-soot/5 border border-soot/10 text-moss text-xs font-semibold mb-3.5">
            <Sparkles size={13} className="text-eucalyptus shrink-0" />
            <span>Clear, Transparent Memberships</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-normal font-serif-display text-soot tracking-tight mb-3">
            One Pass. Every Destination.
          </h1>

          <p className="text-moss text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            Choose a flexible pass tailored to your workflow. Work across premium spaces throughout Saudi Arabia with zero long-term lease lock-ins.
          </p>

          {/* Segmented Switcher (Only visible to unauthenticated guests) */}
          {!currentUser ? (
            <div className="mt-8 inline-flex p-1 rounded-2xl bg-white border border-soot/12 shadow-xs">
              <button
                type="button"
                onClick={() => setGuestBillingType('individual')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  guestBillingType === 'individual'
                    ? 'bg-soot text-plaster shadow-xs'
                    : 'text-moss hover:text-soot'
                }`}
              >
                <User size={15} />
                <span>Individual Members</span>
              </button>

              <button
                type="button"
                onClick={() => setGuestBillingType('corporate')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  guestBillingType === 'corporate'
                    ? 'bg-soot text-plaster shadow-xs'
                    : 'text-moss hover:text-soot'
                }`}
              >
                <Building2 size={15} />
                <span>Teams & Organizations</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-soot/12 shadow-xs text-xs font-semibold text-soot">
              {isOrg ? (
                <>
                  <Building2 size={15} className="text-emerald-700 shrink-0" />
                  <span>Organization &amp; Enterprise Pass Plans</span>
                </>
              ) : (
                <>
                  <User size={15} className="text-emerald-700 shrink-0" />
                  <span>Individual Membership Plans</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Active Subscription Banner (Visible if user has an active pass) */}
        {hasActiveSubscription && (
          <div className="mb-10 bg-gradient-to-r from-emerald-900/10 via-[#DDE6DF]/60 to-emerald-900/10 border border-emerald-700/20 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    Active Subscription
                  </span>
                  <span className="text-xs text-moss font-medium">ZATCA Compliant</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif-display text-soot mt-1">
                  {currentTier || (isOrg ? 'Team Pass' : 'Monthly Pass')}
                </h2>
                <p className="text-xs text-moss mt-0.5">
                  Full pass privileges active across verified coworking destinations in Saudi Arabia.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowManageModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-soot/15 text-soot hover:bg-plaster-dark/40 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                Manage Plan
              </button>
              <button
                type="button"
                onClick={() => navigate(isOrg ? 'org-dashboard' : 'ind-dashboard')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-soot text-plaster hover:bg-moss shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-20">
          {activePlans.map(plan => {
            const isFeatured = plan.featured;
            const isCurrent = isPlanCurrent(plan);
            const userLevel = getCurrentUserPlanLevel();
            const isUpgrade = hasActiveSubscription && !isCurrent && plan.level > userLevel;
            const isSwitch = hasActiveSubscription && !isCurrent && plan.level <= userLevel;

            return (
              <div
                key={plan.id || plan.name}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative bg-white ${
                  isCurrent
                    ? 'border-2 border-emerald-600 shadow-xl ring-2 ring-emerald-500/20'
                    : isFeatured
                    ? 'border-2 border-soot shadow-xl ring-2 ring-eucalyptus/30'
                    : 'border border-soot/12 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Badges */}
                {isCurrent ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-emerald-700 text-white text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap">
                      <CheckCircle2 size={12} className="text-emerald-200 shrink-0" />
                      <span>Your Current Plan</span>
                    </span>
                  </div>
                ) : isFeatured ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-soot text-plaster text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles size={11} className="text-eucalyptus shrink-0" />
                      <span>{plan.badge || 'Recommended'}</span>
                    </span>
                  </div>
                ) : null}

                <div>
                  <div className="mb-5 pb-5 border-b border-soot/10">
                    {'tier' in plan && plan.tier && (
                      <span className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-moss">
                        {plan.tier}
                      </span>
                    )}
                    <h2 className="text-2xl font-serif-display font-normal text-soot">
                      {plan.name}
                    </h2>
                    <p className="text-xs mt-1.5 leading-relaxed text-moss">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="mb-6">
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-normal font-serif-display tracking-tight text-soot">
                          SAR {plan.price.toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-moss">{plan.period}</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-serif-display font-normal text-soot">
                        Custom Quote
                      </div>
                    )}
                    {plan.price !== null && (
                      <span className="text-[10px] text-moss block mt-1">
                        Includes 15% Saudi VAT (ZATCA compliant)
                      </span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 mb-8">
                    <span className="text-[11px] font-semibold uppercase tracking-wider block mb-2 text-moss">
                      Plan Inclusions
                    </span>
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-soot">
                        <div className="w-4 h-4 rounded-full bg-eucalyptus/25 text-soot flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} className="stroke-[3]" />
                        </div>
                        <span className="leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA Action Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => handlePlanCardClick(plan)}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        : isUpgrade
                        ? 'bg-soot text-plaster hover:bg-moss'
                        : isSwitch
                        ? 'bg-plaster-dark/50 text-soot border border-soot/15 hover:bg-soot hover:text-plaster'
                        : isFeatured
                        ? 'bg-soot text-plaster hover:bg-moss'
                        : 'bg-plaster-dark/40 text-soot hover:bg-soot hover:text-plaster'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <CheckCircle2 size={15} className="text-emerald-700" />
                        <span>Manage Current Plan</span>
                      </>
                    ) : isUpgrade ? (
                      <>
                        <span>Upgrade to {plan.name}</span>
                        <ArrowUpRight size={15} />
                      </>
                    ) : isSwitch ? (
                      <>
                        <span>Switch to {plan.name}</span>
                        <ArrowRight size={14} />
                      </>
                    ) : (
                      <>
                        <span>{plan.cta || 'Select Plan'}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unified Large FAQ Card */}
        <div 
          style={{
            backgroundColor: 'var(--plaster-surface, #FFFFFF)',
            borderColor: 'var(--border, rgba(45, 53, 54, 0.15))',
          }}
          className="w-full rounded-3xl border p-8 sm:p-12 shadow-md"
        >
          <div className="text-center mb-10">
            <HelpCircle size={28} style={{ color: 'var(--moss, #697C70)' }} className="mx-auto mb-3" />
            <h2 
              style={{ color: 'var(--soot, #2D3536)' }}
              className="text-2xl sm:text-3xl font-serif-display font-normal"
            >
              Frequently Asked Questions
            </h2>
            <p 
              style={{ color: 'var(--moss, #697C70)' }}
              className="text-xs sm:text-sm mt-1.5 font-medium"
            >
              Click on any question to view details
            </p>
          </div>

          {/* Styled Question Items */}
          <div className="space-y-3.5">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    backgroundColor: isOpen 
                      ? 'var(--plaster-surface, #FFFFFF)' 
                      : 'var(--plaster-dark, #F7F5F0)',
                    borderColor: isOpen 
                      ? 'var(--soot, #2D3536)' 
                      : 'var(--border, rgba(45, 53, 54, 0.12))',
                  }}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                    isOpen ? 'ring-1 ring-soot/10 shadow-sm' : 'hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span 
                      style={{ color: 'var(--soot, #2D3536)' }}
                      className="font-serif-display text-base sm:text-lg font-normal tracking-wide"
                    >
                      {item.q}
                    </span>
                    <ChevronDown
                      size={20}
                      style={{ color: isOpen ? 'var(--soot, #2D3536)' : 'var(--moss, #697C70)' }}
                      className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {isOpen && (
                    <div 
                      style={{ color: 'var(--moss, #697C70)' }}
                      className="mt-4 pt-3.5 border-t border-soot/10 text-xs sm:text-sm leading-relaxed"
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Subscription Checkout Modal */}
      {checkoutPlan && checkoutPlan.price && (
        <Modal
          open={Boolean(checkoutPlan)}
          onClose={() => setCheckoutPlan(null)}
          title="Complete Your Membership"
          subtitle={`Activating ${checkoutPlan.name} for ${currentUser?.name || 'your account'}`}
          size="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                disabled={isProcessingPayment}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-soot/15 text-soot hover:bg-soot/5 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscription}
                disabled={isProcessingPayment}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-soot text-plaster hover:bg-moss cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay SAR {checkoutPlan.price.toLocaleString()}</span>
                    <ShieldCheck size={16} />
                  </>
                )}
              </button>
            </>
          }
        >
          <div className="space-y-6">
            {/* Selected Plan Summary Card */}
            <div className="bg-plaster-dark/30 border border-soot/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-moss tracking-wider block">
                    Selected Plan
                  </span>
                  <h4 className="text-xl font-serif-display text-soot mt-0.5">
                    {checkoutPlan.name}
                  </h4>
                  <p className="text-xs text-moss mt-0.5">{checkoutPlan.desc}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-serif-display font-semibold text-soot">
                    SAR {checkoutPlan.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-moss block">{checkoutPlan.period}</span>
                </div>
              </div>

              {/* Inclusions summary */}
              <div className="mt-4 pt-4 border-t border-soot/8 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-moss block">
                  Included Privileges
                </span>
                {checkoutPlan.features.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-soot">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price & Saudi VAT Breakdown */}
            <div className="bg-white border border-soot/10 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-moss">
                <span>Subtotal (Excl. VAT)</span>
                <span className="font-semibold text-soot">
                  SAR {(checkoutPlan.price / 1.15).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-moss">
                <span>Saudi VAT (15% ZATCA Compliant)</span>
                <span className="font-semibold text-soot">
                  SAR {(checkoutPlan.price - (checkoutPlan.price / 1.15)).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-soot/10 flex justify-between text-sm font-bold text-soot">
                <span className="font-serif-display text-base">Total Due Today</span>
                <span className="font-serif-display text-lg text-emerald-800">
                  SAR {checkoutPlan.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-soot uppercase tracking-wider block">
                Select Payment Method
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mada */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('MADA')}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedPaymentMethod === 'MADA'
                      ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-soot/15 bg-white hover:bg-plaster-dark/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-soot/10 flex items-center justify-center font-bold text-xs text-emerald-800 shadow-2xs">
                      mada
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-soot">mada Debit Card</div>
                      <div className="text-[10px] text-moss">Saudi local card (0% fee)</div>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'MADA' && (
                    <CheckCircle2 size={16} className="text-emerald-700" />
                  )}
                </button>

                {/* Apple Pay */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('APPLE_PAY')}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedPaymentMethod === 'APPLE_PAY'
                      ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-soot/15 bg-white hover:bg-plaster-dark/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-xs font-semibold shadow-2xs">
                      Pay
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-soot">Apple Pay</div>
                      <div className="text-[10px] text-moss">Fast &amp; encrypted checkout</div>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'APPLE_PAY' && (
                    <CheckCircle2 size={16} className="text-emerald-700" />
                  )}
                </button>

                {/* Credit Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('CREDIT_CARD')}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedPaymentMethod === 'CREDIT_CARD'
                      ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-soot/15 bg-white hover:bg-plaster-dark/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-soot/10 flex items-center justify-center text-soot shadow-2xs">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-soot">Credit Card</div>
                      <div className="text-[10px] text-moss">Visa / Mastercard</div>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'CREDIT_CARD' && (
                    <CheckCircle2 size={16} className="text-emerald-700" />
                  )}
                </button>

                {/* Corporate Invoicing (Only for corporate) */}
                {isOrg && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('CORPORATE_INVOICE')}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedPaymentMethod === 'CORPORATE_INVOICE'
                        ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'border-soot/15 bg-white hover:bg-plaster-dark/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-soot text-plaster flex items-center justify-center text-xs font-semibold shadow-2xs">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-soot">Corporate Invoice</div>
                        <div className="text-[10px] text-moss">30-day net payment terms</div>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'CORPORATE_INVOICE' && (
                      <CheckCircle2 size={16} className="text-emerald-700" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="flex items-center gap-2 text-[11px] text-moss bg-soot/5 p-3 rounded-xl border border-soot/8">
              <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
              <span>Payments are encrypted with 256-bit SSL and comply with Saudi Central Bank (SAMA) standards.</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Manage Subscription Modal */}
      {showManageModal && (
        <Modal
          open={showManageModal}
          onClose={() => setShowManageModal(false)}
          title="Manage Active Subscription"
          subtitle="View details, change plan tier, or cancel renewal"
          size="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-soot/15 text-soot hover:bg-soot/5 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Current Status: Active
                  </span>
                  <div className="text-base font-serif-display text-soot">
                    {currentTier || (isOrg ? 'Team Pass' : 'Monthly Pass')}
                  </div>
                </div>
              </div>
              <span className="text-xs text-emerald-900 font-semibold bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                Auto-Renewing
              </span>
            </div>

            <div className="bg-white border border-soot/10 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-moss">Member Name</span>
                <span className="font-semibold text-soot">{currentUser?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss">Account Type</span>
                <span className="font-semibold text-soot">
                  {isOrg ? 'HR Admin (Organization)' : 'Individual Member (B2C)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss">Next Billing Date</span>
                <span className="font-semibold text-soot">
                  {new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss">Payment Method</span>
                <span className="font-semibold text-soot flex items-center gap-1">
                  <CreditCard size={13} /> mada (Ending in 4112)
                </span>
              </div>
            </div>

            {/* Upgrade/Change Plan Options for User's Account Type */}
            <div className="p-4 bg-plaster-dark/30 border border-soot/10 rounded-2xl text-xs space-y-3">
              <span className="font-semibold text-soot block">
                {isOrg ? 'Organization Plans Available to Switch' : 'Individual Plans Available to Switch'}
              </span>
              <p className="text-moss text-[11px]">
                You can switch between plans for your {isOrg ? 'organization' : 'individual'} account anytime without losing your active days:
              </p>
              <div className="space-y-2 pt-1">
                {activePlans.filter(p => !isPlanCurrent(p)).map(p => {
                  const isUpgrade = p.level > getCurrentUserPlanLevel();
                  return (
                    <div key={p.id || p.name} className="p-3 bg-white rounded-xl border border-soot/10 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-semibold text-soot text-xs flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.tier && <span className="text-[10px] text-moss">({p.tier})</span>}
                        </div>
                        <div className="text-[11px] text-moss mt-0.5">
                          {p.price ? `SAR ${p.price.toLocaleString()} ${p.period}` : p.period}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowManageModal(false);
                          handlePlanCardClick(p);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-soot text-plaster hover:bg-moss text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
                      >
                        {isUpgrade ? 'Upgrade Plan' : 'Switch Plan'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

