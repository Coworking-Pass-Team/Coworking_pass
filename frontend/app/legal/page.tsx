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
import { useI18n } from '@/i18n';

export default function LegalPage() {
  const { t } = useI18n();
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
              {t('legal.eyebrow')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={12} /> {t('legal.pdplBadge')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            {t('legal.title')}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1.5 max-w-2xl">
            {t('legal.subtitle')}
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
            <span>{t('legal.tabTerms')}</span>
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
            <span>{t('legal.tabPrivacy')}</span>
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
              <span>{t('legal.t1Title')}</span>
            </h3>
            <p className="text-moss text-xs sm:text-sm">
              {t('legal.t1Body')}
            </p>
          </div>

          {/* Section 2: Universal Pass & Fair Usage */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
              <Building2 size={18} className="text-moss" />
              <span>{t('legal.t2Title')}</span>
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-moss text-xs sm:text-sm ps-2">
              <li>{t('legal.t2a')}</li>
              <li>{t('legal.t2b1')} <strong>{t('legal.t2b2')}</strong>{t('legal.t2b3')}</li>
              <li>{t('legal.t2c')}</li>
            </ul>
          </div>

          {/* Section 3: Payment, Cancellation & Refunds */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-soot/8 pb-3">
              <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
                <CreditCard size={18} className="text-moss" />
                <span>{t('legal.t3Title')}</span>
              </h3>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {t('legal.t3Badge')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-plaster-dark/25 p-4 rounded-xl border border-soot/8 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-soot text-xs">
                  <Clock size={15} className="text-emerald-700" />
                  <span>{t('legal.t3b2c')}</span>
                </div>
                <p className="text-moss text-xs">
                  {t('legal.t3b2cBody1')} <strong>{t('legal.t3b2cBody2')}</strong> {t('legal.t3b2cBody3')}
                </p>
              </div>

              <div className="bg-plaster-dark/25 p-4 rounded-xl border border-soot/8 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-soot text-xs">
                  <Building2 size={15} className="text-emerald-700" />
                  <span>{t('legal.t3b2b')}</span>
                </div>
                <p className="text-moss text-xs">
                  {t('legal.t3b2bBody1')} <strong>{t('legal.t3b2bBody2')}</strong> {t('legal.t3b2bBody3')}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs text-emerald-950">
              <h4 className="font-semibold flex items-center gap-1.5">
                <RefreshCw size={14} className="text-emerald-700" />
                <span>{t('legal.t3dest')}</span>
              </h4>
              <ul className="space-y-1.5 text-emerald-900 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <Zap size={12} className="text-amber-600 shrink-0" />
                  <span><strong>{t('legal.t3wallet1')}</strong> {t('legal.t3wallet2')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CreditCard size={12} className="text-emerald-800 shrink-0" />
                  <span><strong>{t('legal.t3card1')}</strong> {t('legal.t3card2')} <strong>{t('legal.t3card3')}</strong>{t('legal.t3card4')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4: Loyalty Points Program Terms */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
              <Award size={18} className="text-moss" />
              <span>{t('legal.t4Title')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-amber-950 space-y-1">
                <span className="font-bold block">{t('legal.t4earn')}</span>
                <p className="text-amber-900 text-[11px]">{t('legal.t4earnBody')}</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-amber-950 space-y-1">
                <span className="font-bold block">{t('legal.t4redeem')}</span>
                <p className="text-amber-900 text-[11px]">{t('legal.t4redeemBody')}</p>
              </div>
            </div>
          </div>

          {/* Section 5: Code of Conduct & Guest Policy */}
          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h3 className="text-lg font-normal text-soot font-serif-display flex items-center gap-2">
              <Users size={18} className="text-moss" />
              <span>{t('legal.t5Title')}</span>
            </h3>
            <p className="text-moss text-xs sm:text-sm">
              {t('legal.t5Body')}
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
              <span>{t('legal.p0Title')}</span>
            </h3>
            <p className="text-moss text-xs sm:text-sm">
              {t('legal.p0Body')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
              <h4 className="font-semibold text-soot text-sm flex items-center gap-2">
                <FileText size={16} className="text-moss" />
                <span>{t('legal.p1Title')}</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-moss text-xs">
                <li>{t('legal.p1a')}</li>
                <li>{t('legal.p1b')}</li>
                <li>{t('legal.p1c')}</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
              <h4 className="font-semibold text-soot text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-moss" />
                <span>{t('legal.p2Title')}</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-moss text-xs">
                <li>{t('legal.p2a')}</li>
                <li>{t('legal.p2b')}</li>
                <li>{t('legal.p2c')}</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h4 className="font-semibold text-soot text-sm flex items-center gap-2">
              <Building2 size={16} className="text-moss" />
              <span>{t('legal.p3Title')}</span>
            </h4>
            <p className="text-moss text-xs sm:text-sm">
              {t('legal.p3Body1')} <strong>{t('legal.p3Body2')}</strong>{t('legal.p3Body3')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-soot/10 shadow-2xs space-y-3">
            <h4 className="font-semibold text-soot text-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="text-moss" />
              <span>{t('legal.p4Title')}</span>
            </h4>
            <p className="text-moss text-xs sm:text-sm">
              {t('legal.p4Body')}
            </p>
          </div>
        </div>
      )}

      {/* Footer Contact Banner */}
      <div className="bg-plaster-dark/30 rounded-2xl p-6 border border-soot/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-soot text-sm">{t('legal.helpTitle')}</h4>
          <p className="text-moss text-xs mt-0.5">{t('legal.helpBody')}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('contact')}
          className="btn-primary text-xs flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <span>{t('legal.contact')}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
