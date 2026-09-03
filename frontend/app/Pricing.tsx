'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles, HelpCircle, Building2, User, ChevronDown } from 'lucide-react';
import { useApp } from './store';

const individualPlans = [
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
  },
];

const corporatePlans = [
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

export default function Pricing() {
  const { navigate } = useApp();
  const [billingType, setBillingType] = useState<'individual' | 'corporate'>('individual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const activePlans = billingType === 'individual' ? individualPlans : corporatePlans;

  return (
    <div className="min-h-screen bg-plaster text-soot py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
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

          {/* Segmented Switcher */}
          <div className="mt-8 inline-flex p-1 rounded-2xl bg-white border border-soot/12 shadow-xs">
            <button
              type="button"
              onClick={() => setBillingType('individual')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                billingType === 'individual'
                  ? 'bg-soot text-plaster shadow-xs'
                  : 'text-moss hover:text-soot'
              }`}
            >
              <User size={15} />
              <span>Individual Members</span>
            </button>

            <button
              type="button"
              onClick={() => setBillingType('corporate')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                billingType === 'corporate'
                  ? 'bg-soot text-plaster shadow-xs'
                  : 'text-moss hover:text-soot'
              }`}
            >
              <Building2 size={15} />
              <span>Teams & Organizations</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-20">
          {activePlans.map(plan => {
            const isFeatured = plan.featured;
            return (
              <div
                key={plan.id || plan.name}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative bg-white ${
                  isFeatured
                    ? 'border-2 border-soot shadow-xl ring-2 ring-eucalyptus/30'
                    : 'border border-soot/12 shadow-xs hover:shadow-md'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-soot text-plaster text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles size={11} className="text-eucalyptus shrink-0" />
                      <span>{plan.badge || 'Recommended'}</span>
                    </span>
                  </div>
                )}

                <div>
                  <div className="mb-5 pb-5 border-b border-soot/10">
                    {'tier' in plan && (
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

                <button
                  type="button"
                  onClick={() => navigate(plan.price ? 'signup' : 'contact')}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] ${
                    isFeatured
                      ? 'bg-soot text-plaster hover:bg-moss'
                      : 'bg-plaster-dark/40 text-soot hover:bg-soot hover:text-plaster'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight size={14} />
                </button>
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
    </div>
  );
}
