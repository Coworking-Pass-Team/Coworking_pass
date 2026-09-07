'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  RefreshCw,
  CreditCard,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  ArrowRight,
  Zap,
  Wallet
} from 'lucide-react';
import { useApp } from '@/app/store';

export default function LegalPage() {
  const { nav, navigate } = useApp();
  const initialTab = nav.screen === 'privacy-policy' ? 'privacy' : 'terms';
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    if (nav.screen === 'privacy-policy') {
      setActiveTab('privacy');
    } else if (nav.screen === 'terms-of-service') {
      setActiveTab('terms');
    }
  }, [nav.screen]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-soot/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-moss block">
              Legal & Compliance Framework
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={12} /> Saudi Arabia PDPL Compliant
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            Terms of Service & Privacy Policy
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1.5 max-w-2xl">
            Review our official terms of service, cancellation & refund policies, loyalty program rules, and privacy data protections.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center bg-plaster-dark/40 p-1.5 rounded-2xl border border-soot/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-soot text-plaster shadow-xs'
                : 'text-moss hover:text-soot hover:bg-white/50'
            }`}
          >
            <FileText size={15} />
            <span>Terms of Service</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-soot text-plaster shadow-xs'
                : 'text-moss hover:text-soot hover:bg-white/50'
            }`}
          >
            <Lock size={15} />
            <span>Privacy Policy</span>
          </button>
        </div>
      </div>

      {/* TERMS OF SERVICE TAB CONTENT */}
      {activeTab === 'terms' && (
        <div className="space-y-6 text-soot text-sm leading-relaxed animate-in fade-in duration-150">
          {/* Section 1: Agreement & Cookies */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
              <Scale size={18} className="text-moss" />
              <span>1. Agreement & Acceptance of Terms</span>
            </h3>
            <p className="text-moss text-xs sm:text-sm">
              By registering, accessing, or creating an account on the Coworking Pass platform, you explicitly agree to comply with and be bound by these Terms of Service, Privacy Policy, and Cookie Policy. If you do not agree to any part of these terms, please refrain from using the platform.
            </p>
          </div>

          {/* Section 2: Universal Pass & Fair Usage */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
              <Building2 size={18} className="text-moss" />
              <span>2. Universal Pass & Fair Usage Policy</span>
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-moss text-xs sm:text-sm pl-2">
              <li>Universal Pass memberships allow access to all partner workspaces across Saudi Arabia with a single subscription.</li>
              <li>To prevent double-booking and ensure fair access, pass holders may reserve <strong>only one active workspace seat at a time</strong>.</li>
              <li>System automatically blocks simultaneous overlap reservations. Members can cancel and switch to another location for free.</li>
            </ul>
          </div>

          {/* Section 3: Payment, Cancellation & Refunds */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-soot/8 pb-3">
              <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
                <CreditCard size={18} className="text-moss" />
                <span>3. Payment, Cancellation & Refund Policy (Section 5)</span>
              </h3>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Official Refund Terms
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-plaster-dark/25 p-4 rounded-xl border border-soot/8 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-soot text-xs">
                  <Clock size={15} className="text-emerald-700" />
                  <span>Individual Members (B2C)</span>
                </div>
                <p className="text-moss text-xs">
                  Free cancellation with 100% refund is guaranteed when cancelling at least <strong>6 hours before</strong> booking start time. Cancellations within 6 hours are non-refundable to maintain partner operations.
                </p>
              </div>

              <div className="bg-plaster-dark/25 p-4 rounded-xl border border-soot/8 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-soot text-xs">
                  <Building2 size={15} className="text-emerald-700" />
                  <span>Corporate & Organizations (B2B)</span>
                </div>
                <p className="text-moss text-xs">
                  Free cancellation with 100% refund for team desk and hall bookings is guaranteed when cancelling at least <strong>24 hours before</strong> start time.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs text-emerald-950">
              <h4 className="font-semibold flex items-center gap-1.5">
                <RefreshCw size={14} className="text-emerald-700" />
                <span>Refund Destination Options</span>
              </h4>
              <ul className="space-y-1.5 text-emerald-900 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <Zap size={12} className="text-amber-600 shrink-0" />
                  <span><strong>Instant Wallet Refund:</strong> Funds deposited immediately to your account wallet for instant rebooking.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CreditCard size={12} className="text-emerald-800 shrink-0" />
                  <span><strong>Original Bank Card Refund:</strong> Processed to Mada / Visa / Mastercard within <strong>5 to 14 business days</strong>.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4: Loyalty Points Program Terms */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
              <Award size={18} className="text-moss" />
              <span>4. Loyalty Points Program Economics</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-amber-950 space-y-1">
                <span className="font-bold block">Earning Rate</span>
                <p className="text-amber-900 text-[11px]">Earn 10 base points for every 100 SAR spent on pass reservations.</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-amber-950 space-y-1">
                <span className="font-bold block">Redemption Value</span>
                <p className="text-amber-900 text-[11px]">Every 100 points equals a 25 SAR cash discount at checkout.</p>
              </div>
            </div>
          </div>

          {/* Section 5: Code of Conduct & Guest Policy */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
              <Users size={18} className="text-moss" />
              <span>5. Code of Conduct & Guest Policy</span>
            </h3>
            <p className="text-moss text-xs sm:text-sm">
              Hot desk reservations are strictly individual and non-transferable. Visitors to meeting rooms and private offices must adhere to max capacity limits and register at partner receptions upon arrival.
            </p>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY TAB CONTENT */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 text-soot text-sm leading-relaxed animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-4">
            <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
              <Lock size={18} className="text-moss" />
              <span>Saudi Arabia PDPL Data Protection Compliance</span>
            </h3>
            <p className="text-moss text-xs sm:text-sm">
              Coworking Pass is committed to safeguarding user personal data in strict compliance with the Saudi Personal Data Protection Law (PDPL) and National Data Governance policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
              <h4 className="font-semibold text-soot text-sm flex items-center gap-2">
                <FileText size={16} className="text-moss" />
                <span>1. Data We Collect</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-moss text-xs">
                <li>Account details: Full name, email address, phone number, company CR.</li>
                <li>Usage history: Booking dates, QR check-in timestamps, location logs.</li>
                <li>Technical metadata: IP address, device type, browser session tokens.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
              <h4 className="font-semibold text-soot text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-moss" />
                <span>2. How We Use Data</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-moss text-xs">
                <li>Issuing encrypted QR access passes for partner receptions.</li>
                <li>Processing payments and managing loyalty rewards points.</li>
                <li>Sending critical booking updates and security OTP verifications.</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h4 className="font-semibold text-soot text-sm flex items-center gap-2">
              <Building2 size={16} className="text-moss" />
              <span>3. Data Localization & Encryption</span>
            </h4>
            <p className="text-moss text-xs sm:text-sm">
              All user data and database records are securely hosted and processed on local cloud infrastructure located <strong>within the Kingdom of Saudi Arabia</strong>, ensuring national data sovereignty and high cybersecurity standards.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h4 className="font-semibold text-soot text-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="text-moss" />
              <span>4. Your Rights Under PDPL</span>
            </h4>
            <p className="text-moss text-xs sm:text-sm">
              You have the right to request access to your personal data, request correction of inaccurate records, or request complete account deletion (Right to be Forgotten) at any time.
            </p>
          </div>
        </div>
      )}

      {/* Footer Contact Banner */}
      <div className="bg-plaster-dark/30 rounded-2xl p-6 border border-soot/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-soot text-sm">Have Legal Questions or Need Support?</h4>
          <p className="text-moss text-xs mt-0.5">Reach out to our legal and support team for inquiries.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('contact')}
          className="btn-primary text-xs flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <span>Contact Support Desk</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
