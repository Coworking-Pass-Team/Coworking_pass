'use client';
import { Check, ArrowRight } from 'lucide-react';
import { useApp } from './store';

const plans = [
  {
    name: 'Day Pass',
    price: 120,
    period: 'per day',
    desc: 'Perfect for occasional visits and short trips.',
    features: ['Any hot desk space', 'Full amenity access', 'Weekday booking', 'Cancel anytime'],
    cta: 'Get started',
    featured: false,
  },
  {
    name: 'Monthly',
    price: 1500,
    period: 'per month',
    desc: 'Great for freelancers and remote professionals.',
    features: ['Any hot desk space', 'Full amenity access', 'Priority booking', 'Cancel anytime', 'Guest passes (2/mo)', 'Meeting room credits (2h)'],
    cta: 'Most popular',
    featured: true,
  },
  {
    name: 'Annual',
    price: 15000,
    period: 'per year',
    desc: 'Best value for dedicated professionals.',
    features: ['Any hot desk space', 'Full amenity access', 'Priority booking', 'Cancel anytime', 'Guest passes (5/mo)', 'Meeting room credits (8h)', 'Dedicated locker', 'Printed business address'],
    cta: 'Best value',
    featured: false,
  },
];

const orgPlans = [
  {
    name: 'Team',
    seats: '5–20 seats',
    price: 7500,
    period: 'per month',
    desc: 'For growing teams needing flexible workspace.',
    features: ['Hot desks for team', 'Meeting rooms (10h/mo)', 'Team dashboard', 'Flexible seat count'],
    featured: false,
  },
  {
    name: 'Business',
    seats: '21–50 seats',
    price: 18000,
    period: 'per month',
    desc: 'For established companies requiring full coverage.',
    features: ['Private offices', 'Unlimited meeting rooms', 'Team dashboard', 'Dedicated account manager', 'Custom billing', 'On-site support'],
    featured: true,
  },
  {
    name: 'Enterprise',
    seats: '50+ seats',
    price: null,
    period: 'custom pricing',
    desc: 'For large organizations with complex requirements.',
    features: ['Everything in Business', 'Multi-city access', 'SLA guarantees', 'Custom integrations', 'On-site branding'],
    featured: false,
  },
];

export default function Pricing() {
  const { navigate } = useApp();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <p className="text-moss text-sm font-medium mb-2 uppercase tracking-wider">Simple pricing</p>
        <h1 className="text-4xl text-soot mb-3" style={{ fontFamily: 'DM Serif Display, serif' }}>Plans for every professional</h1>
        <p className="text-moss max-w-md mx-auto text-sm leading-relaxed">
          Whether you work solo or lead a team, we have a plan that fits your needs. All plans include access to premium amenities.
        </p>
      </div>

      {/* Individual Plans */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-soot mb-6">Individual plans</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border relative ${plan.featured ? 'bg-soot border-soot text-plaster' : 'bg-white border-soot/8'}`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-eucalyptus text-soot text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <h3 className={`font-semibold text-lg mb-1 ${plan.featured ? 'text-plaster' : 'text-soot'}`}>{plan.name}</h3>
                <p className={`text-xs leading-relaxed ${plan.featured ? 'text-plaster/70' : 'text-moss'}`}>{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className={`text-3xl font-semibold ${plan.featured ? 'text-white' : 'text-soot'}`}>SAR {plan.price.toLocaleString()}</span>
                <span className={`text-sm ml-1 ${plan.featured ? 'text-plaster/60' : 'text-moss'}`}>{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.featured ? 'text-plaster/90' : 'text-moss'}`}>
                    <Check size={13} className={plan.featured ? 'text-eucalyptus shrink-0' : 'text-eucalyptus shrink-0'} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('signup')}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  plan.featured
                    ? 'bg-eucalyptus text-soot hover:bg-eucalyptus-dark'
                    : 'bg-soot/8 text-soot hover:bg-soot/15'
                }`}
              >
                Get started
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Organization Plans */}
      <div className="mt-16">
        <h2 className="text-lg font-semibold text-soot mb-6">Organization plans</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {orgPlans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border ${plan.featured ? 'bg-eucalyptus/20 border-eucalyptus/40' : 'bg-white border-soot/8'}`}
            >
              <div className="mb-1">
                <span className="text-xs font-medium text-moss bg-soot/8 px-2 py-0.5 rounded-full">{plan.seats}</span>
              </div>
              <div className="mb-4 mt-3">
                <h3 className="font-semibold text-lg text-soot mb-1">{plan.name}</h3>
                <p className="text-xs text-moss leading-relaxed">{plan.desc}</p>
              </div>
              <div className="mb-6">
                {plan.price ? (
                  <>
                    <span className="text-3xl font-semibold text-soot">SAR {plan.price.toLocaleString()}</span>
                    <span className="text-sm ml-1 text-moss">{plan.period}</span>
                  </>
                ) : (
                  <span className="text-xl font-semibold text-soot">Contact us</span>
                )}
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-moss">
                    <Check size={13} className="text-eucalyptus shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('signup')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-soot text-plaster hover:bg-soot-light transition-colors"
              >
                {plan.price ? 'Get started' : 'Contact sales'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 bg-mist/15 rounded-2xl border border-mist/40 p-8">
        <h2 className="text-xl font-semibold text-soot mb-6 text-center" style={{ fontFamily: 'DM Serif Display, serif' }}>Common questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. All monthly and daily plans can be cancelled anytime. Annual plans can be cancelled with 30 days notice.' },
            { q: 'Which cities are available?', a: 'We currently operate in Riyadh, Jeddah, Dammam, Khobar, and Madinah, with more cities coming soon.' },
            { q: 'Can my team share a plan?', a: 'Organization plans are built for teams. You can add/remove employees and assign seats per booking.' },
            { q: 'Are there hidden fees?', a: 'No. What you see is what you pay. VAT is included in all displayed prices.' },
          ].map(item => (
            <div key={item.q}>
              <div className="font-medium text-soot text-sm mb-1.5">{item.q}</div>
              <div className="text-moss text-sm leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
