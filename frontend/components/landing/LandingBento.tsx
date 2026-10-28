'use client';

import { useI18n } from '@/i18n';
import Link from 'next/link';
import { Ticket, Wallet, QrCode, Building2, Zap, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/store';
import { useSpaceText } from '@/i18n/space-text';

const NETWORK_CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar'];

/** Asymmetric feature grid: Universal Pass, pooled team wallet, QR check-in and the partner network. */
export default function LandingBento() {
  const { t } = useI18n();
  const st = useSpaceText();
  const { navigate } = useApp();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 lg:auto-rows-[minmax(240px,auto)] gap-4">
      {/* Universal Pass */}
      <article className="lg:col-span-2 group relative overflow-hidden rounded-[28px] bg-soot text-white p-8 sm:p-9 flex flex-col sm:flex-row gap-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-float">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -end-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex-1 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3.5">
            <span className="inline-flex w-fit items-center gap-1.5 h-7 px-3 rounded-full bg-white/10 border border-white/15 text-xs text-zinc-300">
              <Ticket size={13} />
              {t('landing.bento.passBadge')}
            </span>
            <h3 className="text-2xl sm:text-[30px] leading-tight font-semibold">{t('landing.bento.passTitle')}</h3>
            <p className="text-[15px] leading-relaxed text-zinc-400">{t('landing.bento.passBody')}</p>
          </div>
          <Link href="/pass" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white hover:text-emerald-300">
            {t('landing.bento.passCta')}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div aria-hidden="true" className="relative flex-1 flex items-center justify-center min-h-48">
          <div className="w-72 max-w-full h-44 rounded-[20px] bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] p-5 flex flex-col justify-between -rotate-[4deg] transition-transform duration-500 group-hover:rotate-0">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">{t('common.appName')}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400">{t('landing.bento.passCardPlan')}</span>
              <QrCode size={38} strokeWidth={1.5} className="text-zinc-200" />
            </div>
          </div>
        </div>
      </article>

      {/* Pooled wallet */}
      <article className="lg:row-span-2 rounded-[28px] bg-white border border-zinc-200/70 shadow-ambient p-8 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-float">
        <span className="w-11 h-11 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
          <Wallet size={21} strokeWidth={1.8} />
        </span>
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-moss">{t('landing.bento.walletBadge')}</span>
          <h3 className="text-2xl font-semibold leading-snug">{t('landing.bento.walletTitle')}</h3>
          <p className="text-[15px] leading-relaxed text-soot-light">{t('landing.bento.walletBody')}</p>
        </div>
        <div aria-hidden="true" className="mt-auto rounded-[20px] bg-plaster-surface border border-zinc-200/70 p-5 flex flex-col gap-4">
          <span className="text-[13px] text-soot-light">{t('landing.bento.walletBalance')}</span>
          <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
            <div className="h-full w-[62%] rounded-full bg-accent" />
          </div>
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {['bg-zinc-300', 'bg-zinc-400', 'bg-eucalyptus', 'bg-zinc-200'].map(c => (
              <span key={c} className={`w-8 h-8 rounded-full border-2 border-white ${c}`} />
            ))}
          </div>
        </div>
        <Link
          href="/Auth"
          onClick={() => {
            if (typeof navigate === 'function') navigate('signup');
          }}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-soot hover:text-accent"
        >
          {t('landing.bento.walletCta')}
          <ArrowRight size={16} />
        </Link>
      </article>

      {/* QR check-in */}
      <article className="rounded-[28px] bg-white border border-zinc-200/70 shadow-ambient p-8 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-float">
        <div className="flex items-center justify-between">
          <span className="w-11 h-11 rounded-2xl bg-zinc-100 text-soot flex items-center justify-center">
            <QrCode size={21} strokeWidth={1.8} />
          </span>
          <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-accent-soft text-accent text-xs font-semibold">
            <Zap size={12} fill="currentColor" />
            {t('landing.bento.qrBadge')}
          </span>
        </div>
        <h3 className="text-xl font-semibold leading-snug">{t('landing.bento.qrTitle')}</h3>
        <p className="text-[15px] leading-relaxed text-soot-light">{t('landing.bento.qrBody')}</p>
      </article>

      {/* Partner network */}
      <article className="rounded-[28px] bg-plaster-dark p-8 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-float">
        <span className="w-11 h-11 rounded-2xl bg-white text-soot flex items-center justify-center">
          <Building2 size={21} strokeWidth={1.8} />
        </span>
        <h3 className="text-xl font-semibold leading-snug">{t('landing.bento.networkTitle')}</h3>
        <p className="text-[15px] leading-relaxed text-soot-light">{t('landing.bento.networkBody')}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {NETWORK_CITIES.map(c => (
            <span key={c} className="h-7 px-3 rounded-full bg-white text-xs text-soot-light inline-flex items-center">
              {st.cityName(c)}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
