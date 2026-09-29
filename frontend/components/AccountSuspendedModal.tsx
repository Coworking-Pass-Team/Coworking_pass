'use client';

import { useI18n } from '@/i18n';
import React, { useEffect, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';

interface AccountSuspendedModalProps {
  onSignOut: () => void;
}

/**
 * Blocking modal shown as soon as the API reports that the account is suspended.
 * It cannot be dismissed with Escape or by clicking outside: the only way out is signing out.
 */
export default function AccountSuspendedModal({ onSignOut }: AccountSuspendedModalProps) {
  const { t } = useI18n();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();

    // Swallow Escape and keep keyboard focus inside the modal
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-soot/80 backdrop-blur-sm px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="account-suspended-title"
      aria-describedby="account-suspended-body"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-soot/10 p-8 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200/80 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} className="text-rose-600" />
        </div>
        <h2 id="account-suspended-title" className="text-xl sm:text-2xl font-semibold text-soot">
          {t('suspended.title')}
        </h2>
        <p id="account-suspended-body" className="text-sm text-moss leading-relaxed">
          {t('suspended.body')}{' '}
          <a href="mailto:support@coworkingpass.sa" className="font-semibold text-soot underline">
            support@coworkingpass.sa
          </a>{' '}
          {t('suspended.bodyEnd')}
        </p>
        <button
          ref={buttonRef}
          type="button"
          onClick={onSignOut}
          className="w-full py-3.5 rounded-xl bg-soot text-plaster font-semibold text-sm hover:bg-moss active:scale-[0.99] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-eucalyptus"
        >
          {t('suspended.signOut')}
        </button>
      </div>
    </div>
  );
}
