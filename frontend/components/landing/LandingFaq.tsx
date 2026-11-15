'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n';
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';

export default function LandingFaq() {
  const { t, lang } = useI18n();
  const faqs = (lang === 'ar' ? ar : en).landing.faq.items;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section aria-labelledby="landing-faq-title" className="pt-20 max-w-6xl mx-auto px-4 sm:px-6 w-full">
      <div className="rounded-3xl border border-soot/12 bg-plaster-surface p-6 sm:p-12 shadow-sm">
        <div className="text-center mb-10">
          <h2 id="landing-faq-title" className="text-2xl sm:text-3xl font-serif-display text-soot">{t('landing.faq.title')}</h2>
          <p className="text-sm text-moss mt-3">{t('landing.faq.subtitle')}</p>
        </div>
        <div className="space-y-3.5">
          {faqs.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`rounded-2xl border ${isOpen ? 'border-soot bg-plaster-surface' : 'border-soot/12 bg-plaster-dark/30'}`}>
                <h3>
                  <button
                    id={`faq-question-${index}`}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-start text-soot font-medium rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
                  >
                    <span>{item.q}</span>
                    <ChevronDown aria-hidden="true" size={20} className={`shrink-0 text-moss transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={!isOpen} className="mx-5 sm:mx-6 pb-6 pt-4 border-t border-soot/12 text-sm text-moss leading-relaxed">
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
