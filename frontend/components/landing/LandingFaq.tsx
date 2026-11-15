'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
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
    <div className="pb-10 px-4 sm:px-6 text-center">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-soot/12 bg-plaster-surface px-5 py-3 text-sm font-medium text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
      >
        <HelpCircle aria-hidden="true" size={18} />
        {t('landing.faq.title')}
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
