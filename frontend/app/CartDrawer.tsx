'use client';

import { useI18n } from '@/i18n';
import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  X,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  MapPin,
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Edit3,
  AlertCircle,
  Users,
  Award,
  Sparkles,
  Wallet
} from 'lucide-react';
import { useApp } from '@/app/store';
import { formatHourlyTimeRange } from '@/types/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDateNice(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { t, translateMessage, localizeTime, formatDate } = useI18n();
  const { cart, removeFromCart, updateCartItemSeats, clearCart, checkoutCart, currentUser, spaces, navigate, withdrawFromWallet } = useApp();
  const [step, setStep] = useState<'cart' | 'review'>('cart');
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  // Synchronous re-entry guard so a double click cannot run checkout (and the wallet debit) twice
  const checkoutInFlightRef = useRef(false);
  const hasActiveSubscription = Boolean(currentUser?.hasActivePass);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  const totalSeats = cart.reduce((sum, item) => sum + item.seats, 0);

  // Loyalty points calculation
  const earnedLoyaltyPoints = cart.reduce((sum, item) => {
    const space = spaces.find((s) => s.id === item.spaceId);
    const mult = space?.loyaltyPointsMultiplier || 1;
    return sum + Math.floor(item.itemTotal / 100) * 10 * mult;
  }, 0);

  const availablePoints = currentUser?.loyaltyPoints || 0;
  const usableUserPoints = Math.floor(availablePoints / 100) * 100;
  const pointsNeededToCover = Math.max(100, Math.ceil(totalAmount / 25) * 100);
  const maxRedeemablePoints = Math.min(usableUserPoints, pointsNeededToCover);
  const rawPointsDiscount = useLoyaltyPoints && maxRedeemablePoints > 0 ? (maxRedeemablePoints / 100) * 25 : 0;
  const pointsDiscount = Math.min(totalAmount, rawPointsDiscount);
  const amountAfterPoints = Math.max(0, totalAmount - pointsDiscount);

  // Wallet calculation
  const userWalletBalance = currentUser?.walletBalance || 0;
  const walletDeduction = useWalletBalance ? Math.min(userWalletBalance, amountAfterPoints) : 0;
  const finalTotalAmount = Math.max(0, amountAfterPoints - walletDeduction);

  const handleStartReview = () => {
    if (!currentUser) {
      onClose();
      navigate('login');
      return;
    }
    setStep('review');
  };

  const handleFinalCheckout = async () => {
    if (checkoutInFlightRef.current) return;
    checkoutInFlightRef.current = true;
    if (!currentUser) {
      onClose();
      navigate('login');
      return;
    }

    // One idempotency key per checkout attempt: a repeated request with the same key never debits twice
    const chargeKey = `cart-${currentUser.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Charge the wallet first; abort checkout if the debit fails
    if (useWalletBalance && walletDeduction > 0 && withdrawFromWallet) {
      const payment = await withdrawFromWallet(walletDeduction, 'Cart Checkout Payment', chargeKey);
      if (!payment.success) {
        checkoutInFlightRef.current = false;
        return;
      }
    }

    const pointsToRedeem = useLoyaltyPoints ? maxRedeemablePoints : 0;
    // Bookings that the server later rejects get their share of the wallet debit back automatically
    const createdBookings = checkoutCart(
      pointsToRedeem,
      useWalletBalance && walletDeduction > 0 ? { amount: walletDeduction, key: chargeKey } : undefined
    );
    checkoutInFlightRef.current = false;
    onClose();
    setStep('cart');
    setUseLoyaltyPoints(false);
    setUseWalletBalance(false);

    if (createdBookings.length > 0) {
      if (currentUser.role === 'organization') {
        navigate('team-bookings');
      } else {
        navigate('my-bookings');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-soot/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative z-10 w-full max-w-md h-full bg-plaster-surface border-s border-soot/12 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right rtl:slide-in-from-left duration-200">

        {/* Header */}
        <div className="p-6 bg-plaster-dark/30 border-b border-soot/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step === 'review' ? (
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="w-10 h-10 rounded-2xl bg-white border border-soot/12 text-soot flex items-center justify-center shadow-2xs hover:bg-plaster transition-colors cursor-pointer"
                title={t('cart.backToItems')}
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-soot text-plaster flex items-center justify-center shadow-2xs">
                <ShoppingBag size={20} />
              </div>
            )}

            <div>
              <h2 className="text-xl font-normal text-soot font-serif-display">
                {step === 'cart' ? t('cart.title') : t('cart.reviewTitle')}
              </h2>
              <p className="text-xs text-moss">
                {step === 'cart'
                  ? t(cart.length !== 1 ? 'cart.reservationsMany' : 'cart.reservationsOne', { count: cart.length })
                  : t('cart.verify')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: CART LIST WITH EDITABLE DATE & TIME PICKERS */}
        {step === 'cart' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center text-moss">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-soot">{t('cart.empty')}</p>
                <p className="text-xs text-moss mt-1 mb-4">
                  {t('cart.emptyBody')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('browse');
                  }}
                  className="btn-primary text-xs cursor-pointer"
                >
                  {t('footer.browseWorkspaces')}
                </button>
              </div>
            ) : (
              <>
                {/* Loyalty Points Earning Preview Banner */}
                {earnedLoyaltyPoints > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-950">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-700 shrink-0 animate-pulse" />
                      <div>
                        <span className="font-semibold block">{t('cart.earnPoints')}</span>
                        <span className="text-[11px] text-amber-800">{t('cart.earnPointsBody')}</span>
                      </div>
                    </div>
                    <span className="font-bold text-amber-950 bg-amber-200/60 px-2.5 py-1 rounded-xl text-xs">
                      +{earnedLoyaltyPoints} Points
                    </span>
                  </div>
                )}

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-soot/10 p-4 shadow-2xs space-y-3 relative group"
                  >
                    {/* Space Info Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.spaceImage}
                          alt={item.spaceName}
                          className="w-12 h-12 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-soot text-sm truncate">{item.spaceName}</h4>
                          <div className="flex items-center gap-1 text-xs text-moss mt-0.5">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{item.spaceCity}</span>
                            <span className="mx-1">•</span>
                            <span className="font-semibold uppercase text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {item.plan}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-moss hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title={t('cart.removeItem')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                {/* Plan & Schedule Details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-plaster-dark/20 p-2.5 rounded-xl border border-soot/6">
                  <div>
                    <span className="text-moss block">{t('cart.passPlan')}</span>
                    <span className="font-semibold text-soot capitalize">
                      {item.plan === 'hourly'
                        ? t('cart.hourlyHrs', { count: item.durationHours || 1 })
                        : item.plan === 'daily'
                        ? t((item.durationDays || 1) === 1 ? 'cart.dailyDays' : 'cart.dailyDaysMany', { count: item.durationDays || 1 })
                        : t(('booking.planPass.' + item.plan) as never)}
                    </span>
                  </div>
                  <div>
                    <span className="text-moss block">{item.plan === 'hourly' ? t('cart.dateTime') : t('cart.bookingDates')}</span>
                    <span className="font-semibold text-soot truncate block">
                      {item.startDate}
                    </span>
                    {item.plan === 'hourly' && (
                      <span className="text-[10px] text-moss block font-medium">
                        {translateMessage(formatHourlyTimeRange(item.startTime, item.endTime, item.durationHours))}
                      </span>
                    )}
                    {item.plan !== 'hourly' && item.endDate && item.endDate !== item.startDate && (
                      <span className="text-[10px] text-moss block">
                        → {item.endDate}
                      </span>
                    )}
                    {item.plan !== 'hourly' && item.startTime && item.endTime && (
                      <span className="text-[10px] text-emerald-800 font-medium block">
                        {t('cart.allowed', { start: localizeTime(item.startTime), end: localizeTime(item.endTime) })}
                      </span>
                    )}
                  </div>
                </div>

                    {/* Quantity / Seats Controls & Subtotal */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-moss font-medium flex items-center gap-1">
                          <Users size={12} />
                          {t('cart.seatsLabel')}
                        </span>
                        <div className="flex items-center gap-1.5 bg-plaster-dark/40 rounded-xl p-1 border border-soot/10">
                          <button
                            type="button"
                            onClick={() => updateCartItemSeats(item.id, item.seats - 1)}
                            disabled={item.seats <= 1}
                            className="w-6 h-6 rounded-lg bg-white text-soot flex items-center justify-center text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-plaster shadow-2xs transition-colors cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-semibold text-soot px-1.5">{item.seats}</span>
                          <button
                            type="button"
                            onClick={() => updateCartItemSeats(item.id, item.seats + 1)}
                            className="w-6 h-6 rounded-lg bg-white text-soot flex items-center justify-center text-xs font-semibold hover:bg-plaster shadow-2xs transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="text-xs text-moss block">
                          {item.itemTotal === 0 ? t('cart.passCoverage') : t('cart.subtotal')}
                        </span>
                        {item.itemTotal === 0 ? (
                          <span className="text-xs font-bold text-moss bg-eucalyptus/30 px-2 py-0.5 rounded-full border border-eucalyptus/40">
                            {t('myBookings.coveredByPass')}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-soot">
                            {t('common.sar')} {item.itemTotal.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* STEP 2: PRE-CHECKOUT DATES & SCHEDULE REVIEW */}
        {step === 'review' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
              <AlertCircle size={18} className="shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">{t('cart.reviewDates')}</p>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  {t('cart.reviewNote')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-soot/12 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-soot/8 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-soot text-plaster text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-soot text-sm truncate max-w-[200px]">
                        {item.spaceName}
                      </h4>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-moss/10 text-moss">
                      {item.plan === 'daily' ? t((item.durationDays || 1) === 1 ? 'cart.dailyDaysCap' : 'cart.dailyDaysCapMany', { count: item.durationDays || 1 }) : t(('booking.planPass.' + item.plan) as never)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-plaster-dark/20 p-2.5 rounded-xl border border-soot/6">
                      <span className="text-[10px] text-moss block font-medium flex items-center gap-1">
                        <Calendar size={11} /> {t('spaceDetails.startDate')}
                      </span>
                      <span className="font-semibold text-soot block mt-0.5">
                        {formatDate(item.startDate)}
                      </span>
                    </div>

                    <div className="bg-plaster-dark/20 p-2.5 rounded-xl border border-soot/6">
                      <span className="text-[10px] text-moss block font-medium flex items-center gap-1">
                        <Calendar size={11} /> {t('spaceDetails.endDate')}
                      </span>
                      <span className="font-semibold text-soot block mt-0.5">
                        {formatDate(item.endDate || item.startDate)}
                      </span>
                    </div>
                  </div>

                  {item.plan === 'daily' && (
                    <div className="bg-plaster-dark/20 p-2.5 rounded-xl border border-soot/6 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-moss font-medium flex items-center gap-1">
                        <Clock size={11} /> {t('qr.duration')}
                      </span>
                      <span className="font-semibold text-soot">
                        {item.durationDays || 1} {(item.durationDays || 1) === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                  )}

                  {item.startTime && (
                    <div className="bg-plaster-dark/20 p-2.5 rounded-xl border border-soot/6 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-moss font-medium flex items-center gap-1">
                        <Clock size={11} /> {item.plan === 'hourly' ? t('cart.timeWindow') : t('cart.dailyHours')}
                      </span>
                      <span className="font-semibold text-soot">
                        {t('cart.hoursSummary', { start: localizeTime(item.startTime), end: item.endTime ? localizeTime(item.endTime) : t('cart.endFallback'), count: item.durationHours || 1, perDay: item.plan === 'hourly' ? '' : t('cart.perDaySuffix') })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-soot/6">
                    <span className="text-moss font-medium flex items-center gap-1">
                      <Users size={12} /> {t(item.seats > 1 ? 'cart.seatsReserved' : 'cart.seatReserved', { count: item.seats })}
                    </span>
                    {item.itemTotal === 0 ? (
                      <span className="text-xs font-bold text-moss bg-eucalyptus/30 px-2 py-0.5 rounded-full border border-eucalyptus/40">
                        {t('myBookings.coveredByPass')}
                      </span>
                    ) : (
                      <span className="font-semibold text-soot">
                        {t('common.sar')} {item.itemTotal.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Loyalty Points Redemption Widget */}
            {totalAmount > 0 && currentUser && availablePoints >= 100 && maxRedeemablePoints >= 100 && (
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-amber-700" />
                    <div>
                      <span className="font-semibold text-soot text-xs block">{t('cart.redeemPoints')}</span>
                      <span className="text-[11px] text-moss">
                        {t('cart.youHave')} <strong>{availablePoints}</strong> {t('cart.availablePointsWord')}
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLoyaltyPoints}
                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-soot/20 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {useLoyaltyPoints && (
                  <div className="pt-2 border-t border-amber-500/20 text-xs text-amber-950 flex items-center justify-between font-medium">
                    <span>{t('cart.usePoints', { count: maxRedeemablePoints })}</span>
                    <span className="text-emerald-700 font-semibold">- {t('common.sar')} {pointsDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Digital Wallet Redemption Widget */}
            {totalAmount > 0 && currentUser && userWalletBalance > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-700" />
                    <div>
                      <span className="font-semibold text-soot text-xs block">{t('bf.walletBalance')}</span>
                      <span className="text-[11px] text-moss">
                        {t('cart.availableBalance')} <strong>{t('common.sar')} {userWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useWalletBalance}
                      onChange={(e) => setUseWalletBalance(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-soot/20 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {useWalletBalance && walletDeduction > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20 text-xs text-emerald-950 flex items-center justify-between font-medium">
                    <span>{t('cart.walletApplied')}</span>
                    <span className="text-emerald-700 font-semibold">- {t('common.sar')} {walletDeduction.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>{t('cart.ready')}</span>
            </div>
          </div>
        )}

        {/* Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-6 bg-plaster-dark/30 border-t border-soot/10 space-y-4 shrink-0">
            <div className="space-y-2 text-xs text-soot">
              <div className="flex justify-between">
                <span className="text-moss">{t('cart.workspacesSelected')}</span>
                <span className="font-semibold">{cart.length} Locations</span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss">{t('cart.totalSeats')}</span>
                <span className="font-semibold">{totalSeats} Seats</span>
              </div>
              {earnedLoyaltyPoints > 0 && (
                <div className="flex justify-between text-amber-900 bg-amber-50 px-2 py-1 rounded-lg">
                  <span className="font-medium flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-700" />
                    {t('tb.pointsEarned')}
                  </span>
                  <span className="font-bold">+{earnedLoyaltyPoints} Pts</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-900 bg-emerald-50 px-2 py-1 rounded-lg">
                  <span className="font-medium">{t('cart.loyaltyDiscount')}</span>
                  <span className="font-bold">- {t('common.sar')} {pointsDiscount.toLocaleString()}</span>
                </div>
              )}
              {walletDeduction > 0 && (
                <div className="flex justify-between text-emerald-900 bg-emerald-50 px-2 py-1 rounded-lg">
                  <span className="font-medium">{t('bf.walletApplied')}</span>
                  <span className="font-bold">- {t('common.sar')} {walletDeduction.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-soot/10 font-bold items-center">
                <span className="text-soot font-serif-display text-base">
                  {finalTotalAmount === 0 && hasActiveSubscription ? t('cart.passCoverage') : t('cart.totalAmount')}
                </span>
                {finalTotalAmount === 0 ? (
                  <span className="text-moss font-bold text-xs sm:text-sm bg-eucalyptus/30 px-3 py-1 rounded-full border border-eucalyptus/40">
                    {hasActiveSubscription ? t('cart.coveredActive') : t('cart.zeroToPayPlan')}
                  </span>
                ) : (
                  <span className="text-soot font-serif-display text-lg text-emerald-900">
                    {t('common.sar')} {finalTotalAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {step === 'cart' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-4 py-3 rounded-xl border border-soot/15 text-soot text-xs font-semibold hover:bg-soot/5 transition-colors cursor-pointer"
                >
                  {t('cart.clear')}
                </button>
                <button
                  type="button"
                  onClick={handleStartReview}
                  className="flex-1 btn-primary justify-center py-3 text-sm shadow-md cursor-pointer"
                >
                  <Calendar size={16} />
                  <span>{t('cart.reviewCheckout')}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 rounded-xl border border-soot/15 text-soot text-xs font-semibold hover:bg-soot/5 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>{t('cart.backToCart')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalCheckout}
                  className="flex-1 btn-primary justify-center py-3 text-sm shadow-md cursor-pointer bg-emerald-900 hover:bg-emerald-950 text-white"
                >
                  <CreditCard size={16} />
                  <span>
                    {finalTotalAmount === 0
                      ? (hasActiveSubscription ? t('cart.confirmCovered') : t('cart.confirmIncluded'))
                      : t('cart.confirmPay', { currency: t('common.sar'), amount: finalTotalAmount.toLocaleString() })}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
