'use client';

import { useState } from 'react';
import { ArrowRight, ChevronDown, HelpCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';
import Modal from '@/components/ui/Modal';

export default function LandingFaq() {
  const { t, lang } = useI18n();
  const faqs = (lang === 'ar' ? ar : en).landing.faq.items;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const closeModal = () => {
    setOpen(false);
    setOpenFaq(null);
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-16 px-4 sm:px-6">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby="faq-card-title"
        aria-describedby="faq-card-description"
        onClick={() => setOpen(true)}
        className="group w-full flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8 rounded-3xl border border-moss/25 bg-plaster-surface p-7 sm:p-10 text-start shadow-sm hover:border-moss/50 hover:shadow-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus focus-visible:ring-offset-4"
      >
        <span className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-soot text-plaster shadow-sm">
          <HelpCircle aria-hidden="true" className="w-8 h-8 sm:w-10 sm:h-10" />
        </span>
        <span className="flex-1 min-w-0">
          <span id="faq-card-title" className="block text-2xl sm:text-3xl font-serif-display text-soot leading-snug">{t('landing.faq.triggerTitle')}</span>
          <span id="faq-card-description" className="block mt-3 text-sm sm:text-base text-moss leading-relaxed max-w-xl">{t('landing.faq.triggerSubtitle')}</span>
        </span>
        <span className="inline-flex items-center justify-center gap-3 w-full md:w-auto shrink-0 rounded-full bg-soot px-6 py-3.5 text-sm font-semibold text-plaster group-hover:bg-moss transition-colors">
          {t('landing.faq.triggerAction')}
          <ArrowRight aria-hidden="true" size={18} className="shrink-0" />
        </span>
      </button>
      <Modal open={open} onClose={closeModal} title={t('landing.faq.title')} subtitle={t('landing.faq.subtitle')} size="3xl">
        <div className="space-y-3.5 text-start">
          {faqs.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`rounded-2xl border transition-all duration-200 ${isOpen ? 'border-soot bg-plaster-surface shadow-sm' : 'border-soot/10 bg-plaster-dark/30 hover:bg-plaster-dark/60'}`}>
                <h3>
                  <button
                    id={`faq-question-${index}`}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-start text-soot font-medium rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
                  >
                    <span className="font-serif-display text-base sm:text-lg">{item.q}</span>
                    <ChevronDown aria-hidden="true" size={20} className={`shrink-0 text-moss transition-transform duration-200 ${isOpen ? 'rotate-180 text-soot' : ''}`} />
                  </button>
                </h3>
                {isOpen && (
                  <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} className="mx-5 sm:mx-6 pb-6 pt-2 border-t border-soot/10 text-xs sm:text-sm text-moss leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
