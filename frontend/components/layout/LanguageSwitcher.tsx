'use client';

import { useI18n } from '@/i18n';

/** Two-option language toggle (Arabic / English) for the top navigation bar. */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();

  const options = [
    { code: 'ar' as const, flag: '🇸🇦', label: t('lang.switchToArabic') },
    { code: 'en' as const, flag: '🇬🇧', label: t('lang.switchToEnglish') },
  ];

  return (
    <div
      role="group"
      aria-label={t('lang.switcherLabel')}
      className={`inline-flex items-center rounded-full border border-soot/12 bg-plaster-dark/30 p-0.5 shrink-0 ${className}`}
    >
      {options.map((o) => {
        const active = lang === o.code;
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => setLang(o.code)}
            aria-pressed={active}
            title={o.label}
            className={`flex items-center gap-1 px-2 xl:px-2.5 py-1 rounded-full text-[11px] xl:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              active ? 'bg-soot text-plaster shadow-xs' : 'text-moss hover:text-soot'
            }`}
          >
            <span aria-hidden="true" className="flag-emoji">{o.flag}</span>
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
