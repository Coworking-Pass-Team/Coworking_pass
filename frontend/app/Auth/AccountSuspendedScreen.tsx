'use client';

import React from 'react';
import { ShieldAlert, Mail, ArrowLeft, Phone, AlertCircle, Headphones } from 'lucide-react';
import { useApp } from '@/app/store';
import LogoImage from '@/components/layout/logo';

export default function AccountSuspendedScreen() {
  const { navigate, logout } = useApp();

  const handleBackToLogin = () => {
    // Ensure all stored auth state is thoroughly cleared
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cp_token');
      localStorage.removeItem('cp_currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('jwt');
    }
    if (logout) {
      logout();
    } else {
      navigate('login');
    }
  };

  return (
    <div className="min-h-screen bg-plaster flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-soot/10 p-8 sm:p-10 shadow-xl text-center space-y-6 animate-in fade-in duration-300">
        
        {/* Brand Logo */}
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-2.5">
            <LogoImage className="h-9 w-auto" />
            <span className="font-semibold text-soot text-lg tracking-tight">Coworking Pass</span>
          </div>
        </div>

        {/* Warning Icon Badge */}
        <div className="w-18 h-18 rounded-3xl bg-rose-50 border border-rose-200/80 flex items-center justify-center mx-auto text-rose-600 shadow-sm">
          <ShieldAlert size={36} className="text-rose-600" />
        </div>

        {/* Status Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/90 px-3 py-1 rounded-full border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Account Suspended · تم تعليق الحساب
          </span>
          <h2 className="text-2xl font-serif-display font-normal text-soot mt-2">
            Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-moss leading-relaxed">
            Your account has been suspended by the platform administration. Access to workspaces, reservations, and corporate pool benefits has been disabled.
          </p>
          <p className="text-xs text-moss/90 leading-relaxed font-sans pt-1 border-t border-soot/6">
            تم تعليق هذا الحساب من قِبل إدارة المنصة. تم تقييد الوصول لجميع المساحات والحجوزات. يرجى التواصل مع فريق الدعم للمساعدة في إعادة التفعيل.
          </p>
        </div>

        {/* Contact Support Direct Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-plaster-dark/40 border border-soot/8 text-left space-y-3">
          <div className="text-xs font-semibold text-soot flex items-center gap-2">
            <Headphones size={15} className="text-moss" />
            <span>Support & Assistance / الدعم والمساعدة:</span>
          </div>

          <div className="space-y-2 text-xs text-moss">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-moss/80">Support Email:</span>
              <a
                href="mailto:support@coworkingpass.sa?subject=Account%20Suspension%20Review"
                className="font-semibold text-soot hover:text-moss underline decoration-soot/30 transition-colors"
              >
                support@coworkingpass.sa
              </a>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-moss/80">Phone / WhatsApp:</span>
              <span className="font-semibold text-soot">+966 11 234 5678</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-moss/80">Operating Hours:</span>
              <span className="font-semibold text-soot">Sun–Thu 8:00 AM – 8:00 PM</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <a
            href="mailto:support@coworkingpass.sa?subject=Account%20Suspension%20Review"
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-soot text-plaster hover:bg-moss active:scale-[0.99] transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail size={16} />
            <span>Contact Support Team</span>
          </a>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs border border-soot/12 text-soot bg-white hover:bg-plaster-dark/40 active:scale-[0.99] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Sign In / تسجيل الخروج</span>
          </button>
        </div>

      </div>
    </div>
  );
}
