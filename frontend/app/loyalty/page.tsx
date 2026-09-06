'use client';

import React from 'react';
import {
  Sparkles,
  Gift,
  Award,
  ArrowRight,
  TrendingUp,
  Building2,
  CheckCircle2,
  Zap,
  Star,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useApp } from '@/app/store';

export default function LoyaltyPage() {
  const { currentUser, spaces, bookings, navigate } = useApp();

  if (!currentUser) return null;

  const points = currentUser.loyaltyPoints || 0;
  const cashEquivalent = (points / 100) * 5;

  // Determine Tier Level
  const getTierInfo = (pts: number) => {
    if (pts >= 3000) {
      return {
        name: 'Platinum Elite',
        nextTier: 'Max Tier Reached',
        progress: 100,
        remaining: 0,
        perks: ['3× Points Multiplier', 'Free Private Office Upgrade Month', 'Priority VIP Concierge'],
      };
    }
    if (pts >= 1500) {
      return {
        name: 'Gold VIP',
        nextTier: 'Platinum Elite (3,000 pts)',
        progress: Math.min(100, Math.round(((pts - 1500) / 1500) * 100)),
        remaining: 3000 - pts,
        perks: ['2× Points Multiplier', 'Free Meeting Room Hours', 'Dedicated Support'],
      };
    }
    if (pts >= 500) {
      return {
        name: 'Silver Member',
        nextTier: 'Gold VIP (1,500 pts)',
        progress: Math.min(100, Math.round(((pts - 500) / 1000) * 100)),
        remaining: 1500 - pts,
        perks: ['1.5× Points Multiplier', '10% Discount on Add-on Amenities'],
      };
    }
    return {
      name: 'Bronze Member',
      nextTier: 'Silver Member (500 pts)',
      progress: Math.min(100, Math.round((pts / 500) * 100)),
      remaining: 500 - pts,
      perks: ['Earn 10 pts per SAR 100 spent', 'Redeem pts for cash discounts at checkout'],
    };
  };

  const tier = getTierInfo(points);
  const bonusSpaces = spaces.filter(s => s.isVisible && (s.loyaltyPointsMultiplier || 1) > 1);
  const myBookings = bookings.filter(b => b.userId === currentUser.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Theme-Conforming Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-soot/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-xs font-bold tracking-wider uppercase text-moss block">
              Member Rewards Program
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2E8E4] border border-[#2D3536]/15 text-soot text-xs font-semibold shadow-2xs">
              <Sparkles size={13} className="text-moss" />
              <span>{tier.name}</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            Loyalty Rewards Hub
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1">
            Earn points on every pass reservation and redeem them for instant checkout discounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('browse')}
          className="btn-primary flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Building2 size={16} />
          <span>Book Workspaces to Earn Points</span>
        </button>
      </div>

      {/* Main Points Overview & Tier Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Points Balance Card (Theme Dark Gradient) */}
        <div className="bg-gradient-to-br from-soot via-soot/95 to-moss text-plaster rounded-3xl p-6 sm:p-8 shadow-md border border-soot/20 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-eucalyptus/30 text-plaster text-xs font-semibold border border-eucalyptus/40 shadow-2xs">
                <Sparkles size={13} className="text-eucalyptus" />
                <span>Available Balance</span>
              </span>
              <ShieldCheck size={20} className="text-eucalyptus" />
            </div>

            <div>
              <div className="text-4xl sm:text-5xl font-normal font-serif-display text-plaster">
                {points.toLocaleString()} <span className="text-lg font-sans text-plaster/70 font-normal">pts</span>
              </div>
              <div className="text-xs text-eucalyptus font-semibold mt-1">
                = SAR {cashEquivalent.toFixed(2)} Instant Cashback Value
              </div>
            </div>

            <p className="text-xs text-plaster/75 leading-relaxed pt-2 border-t border-plaster/10">
              Use your points at checkout to deduct cash value off workspace desk reservations.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <button
              type="button"
              onClick={() => navigate('browse')}
              className="w-full py-3 rounded-2xl bg-plaster text-soot font-semibold text-xs sm:text-sm hover:bg-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Redeem Points at Checkout</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-eucalyptus/20 blur-3xl pointer-events-none" />
        </div>

        {/* Tier Status & Progress */}
        <div className="lg:col-span-2 bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-moss block mb-1">Current Membership Tier</span>
                <h3 className="text-2xl font-semibold text-soot font-serif-display">{tier.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-moss block">Next Tier Target</span>
                <span className="text-xs font-bold text-soot">{tier.nextTier}</span>
              </div>
            </div>

            {/* Theme Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-moss font-medium">
                <span>Progress to next tier</span>
                <span>{tier.progress}% ({tier.remaining > 0 ? `${tier.remaining} pts needed` : 'Highest tier'})</span>
              </div>
              <div className="w-full h-3 rounded-full bg-soot/10 overflow-hidden p-0.5 border border-soot/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-soot to-moss transition-all duration-500 shadow-2xs"
                  style={{ width: `${tier.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Tier Perks */}
          <div className="space-y-3 pt-4 border-t border-soot/10">
            <span className="text-xs font-bold uppercase tracking-wider text-moss block">Active Tier Benefits</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tier.perks.map((perk, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-plaster-dark/30 border border-soot/8 text-xs font-medium text-soot flex items-center gap-2.5"
                >
                  <CheckCircle2 size={15} className="text-emerald-800 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-normal font-serif-display text-soot">How the Rewards Program Works</h2>
          <p className="text-xs text-moss mt-0.5">Simple rules for earning and using your rewards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-soot text-plaster border border-soot/20 flex items-center justify-center shadow-2xs">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-base font-semibold text-soot font-serif-display">1. Earn Points Automatically</h3>
            <p className="text-xs text-moss leading-relaxed">
              Earn <strong>10 points</strong> for every <strong>SAR 100</strong> spent on desk & workspace bookings across Saudi Arabia.
            </p>
          </div>

          <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-eucalyptus/25 text-soot border border-eucalyptus/30 flex items-center justify-center shadow-2xs">
              <Zap size={20} className="text-moss" />
            </div>
            <h3 className="text-base font-semibold text-soot font-serif-display">2. Multiply with Bonus Partners</h3>
            <p className="text-xs text-moss leading-relaxed">
              Book featured partner locations marked with <strong>2× Points Bonus</strong> to double your earnings on every reservation.
            </p>
          </div>

          <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-soot/10 text-soot border border-soot/15 flex items-center justify-center shadow-2xs">
              <Gift size={20} className="text-moss" />
            </div>
            <h3 className="text-base font-semibold text-soot font-serif-display">3. Instant Checkout Cashback</h3>
            <p className="text-xs text-moss leading-relaxed">
              Toggle your points balance during checkout to receive <strong>SAR 5 discount</strong> for every 100 points redeemed.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Partner Spaces with Multiplier Bonus */}
      {bonusSpaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-normal font-serif-display text-soot">Bonus Multiplier Partner Spaces</h2>
              <p className="text-xs text-moss mt-0.5">Book these locations to earn double loyalty points</p>
            </div>

            <button
              type="button"
              onClick={() => navigate('browse')}
              className="text-xs font-semibold text-moss hover:text-soot flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Explore All Spaces</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bonusSpaces.map(space => (
              <div
                key={space.id}
                onClick={() => navigate('space-details', { spaceId: space.id })}
                className="bg-plaster-surface rounded-3xl border border-soot/12 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={space.images[0]}
                      alt={space.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 left-3.5 bg-soot text-plaster border border-soot/20 text-xs font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1">
                      <Sparkles size={13} className="text-eucalyptus" />
                      <span>{space.loyaltyPointsMultiplier}× Bonus Points</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-soot text-base group-hover:text-emerald-900 transition-colors truncate">
                        {space.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-soot font-semibold shrink-0">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{space.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-moss font-medium">
                      <MapPin size={13} />
                      <span>{space.city}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-soot/6 mt-3">
                  <span className="text-xs font-semibold text-soot">SAR {space.pricing.daily}/day</span>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Book & Earn Extra</span>
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points History & Activity Log (Admin Table Style) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-normal font-serif-display text-soot">Points Earning & Activity History</h2>
          <p className="text-xs text-moss mt-0.5">Recent rewards earned and redeemed from your reservations</p>
        </div>

        {myBookings.length === 0 ? (
          <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-8 text-center shadow-xs">
            <Sparkles size={28} className="text-moss mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-soot mb-1 font-serif-display">No Points Activity Yet</h4>
            <p className="text-xs text-moss max-w-sm mx-auto">
              Your points history will appear here automatically when you complete your first workspace booking.
            </p>
          </div>
        ) : (
          <div className="bg-plaster-surface rounded-3xl border border-soot/12 overflow-hidden shadow-xs">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
              <div className="col-span-5">Reservation Activity</div>
              <div className="col-span-3">Booking Date</div>
              <div className="col-span-2">Pass Amount</div>
              <div className="col-span-2 text-right">Points Earned</div>
            </div>

            <div className="divide-y divide-soot/8">
              {myBookings.slice(0, 5).map(b => {
                const sp = spaces.find(s => s.id === b.spaceId);
                const mult = sp?.loyaltyPointsMultiplier || 1;
                const ptsEarned = Math.floor((b.totalPrice || 0) / 100) * 10 * mult;

                return (
                  <div key={b.id} className="px-6 py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center text-xs">
                    <div className="col-span-5 font-semibold text-soot flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-800 shrink-0" />
                      <span>{b.spaceName} ({b.plan} pass)</span>
                    </div>
                    <div className="col-span-3 text-moss mt-1 md:mt-0 font-medium">{b.startDate}</div>
                    <div className="col-span-2 text-soot font-semibold mt-1 md:mt-0">SAR {(b.totalPrice || 0).toLocaleString()}</div>
                    <div className="col-span-2 text-right font-bold text-emerald-800 mt-1 md:mt-0">
                      +{ptsEarned} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
