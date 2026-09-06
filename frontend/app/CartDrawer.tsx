'use client';

import React from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, CreditCard, MapPin } from 'lucide-react';
import { useApp } from '@/app/store';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateCartItemSeats, clearCart, checkoutCart, currentUser, navigate } = useApp();

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  const totalSeats = cart.reduce((sum, item) => sum + item.seats, 0);

  const handleCheckout = () => {
    if (!currentUser) {
      onClose();
      navigate('login');
      return;
    }

    const createdBookings = checkoutCart();
    onClose();

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
      <div className="relative z-10 w-full max-w-md h-full bg-plaster-surface border-l border-soot/12 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-6 bg-plaster-dark/30 border-b border-soot/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-soot text-plaster flex items-center justify-center shadow-2xs">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-xl font-normal text-soot font-serif-display">Shopping Cart</h2>
              <p className="text-xs text-moss">
                {cart.length} space reservation{cart.length !== 1 ? 's' : ''} in cart
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

        {/* Cart Item List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="py-20 text-center text-moss">
              <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-soot">Your cart is empty</p>
              <p className="text-xs text-moss mt-1 mb-4">Explore our catalog and add workspace passes to pay together.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('browse');
                }}
                className="btn-primary text-xs"
              >
                Browse Workspaces
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-soot/10 p-4 shadow-2xs space-y-3 relative group"
              >
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
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-moss hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Plan & Schedule Details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-plaster-dark/20 p-2.5 rounded-xl border border-soot/6">
                  <div>
                    <span className="text-moss block">Pass Plan</span>
                    <span className="font-semibold text-soot capitalize">
                      {item.plan === 'hourly' ? `${item.durationHours || 1}h Hourly` : `${item.plan} pass`}
                    </span>
                  </div>
                  <div>
                    <span className="text-moss block">Booking Dates</span>
                    <span className="font-semibold text-soot truncate block">
                      {item.startDate} {item.endDate && item.endDate !== item.startDate ? `→ ${item.endDate}` : ''}
                    </span>
                  </div>
                </div>

                {/* Quantity / Seats Controls & Subtotal */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-moss font-medium">Seats:</span>
                    <div className="flex items-center gap-1.5 bg-plaster-dark/40 rounded-xl p-1 border border-soot/10">
                      <button
                        type="button"
                        onClick={() => updateCartItemSeats(item.id, item.seats - 1)}
                        disabled={item.seats <= 1}
                        className="w-6 h-6 rounded-lg bg-white text-soot flex items-center justify-center text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-plaster shadow-2xs transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-semibold text-soot px-1.5">{item.seats}</span>
                      <button
                        type="button"
                        onClick={() => updateCartItemSeats(item.id, item.seats + 1)}
                        className="w-6 h-6 rounded-lg bg-white text-soot flex items-center justify-center text-xs font-semibold hover:bg-plaster shadow-2xs transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-semibold text-soot">
                      SAR {item.itemTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-6 bg-plaster-dark/30 border-t border-soot/10 space-y-4 shrink-0">
            <div className="space-y-2 text-xs text-soot">
              <div className="flex justify-between">
                <span className="text-moss">Workspaces Selected</span>
                <span className="font-semibold">{cart.length} Locations</span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss">Total Reserved Seats</span>
                <span className="font-semibold">{totalSeats} Seats</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-soot/10 font-bold">
                <span className="text-soot font-serif-display text-base">Total Amount</span>
                <span className="text-soot font-serif-display text-lg text-emerald-900">
                  SAR {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="px-4 py-3 rounded-xl border border-soot/15 text-soot text-xs font-semibold hover:bg-soot/5 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                className="flex-1 btn-primary justify-center py-3 text-sm shadow-md"
              >
                <CreditCard size={16} />
                <span>Checkout & Pay All (SAR {totalAmount.toLocaleString()})</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
