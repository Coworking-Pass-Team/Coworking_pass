'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { useI18n } from '@/i18n';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'| '3xl';
}

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-soot/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
          if (event.key === 'Tab') {
            const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
              'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )).filter(element => !element.matches(':disabled') && element.tabIndex >= 0 && element.getClientRects().length > 0);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (!first) {
              event.preventDefault();
              event.currentTarget.focus();
            } else if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
        className={`bg-plaster-surface rounded-3xl border border-soot/15 shadow-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        {title ? (
          <div className="px-6 sm:px-8 py-5 border-b border-soot/10 flex items-center justify-between bg-plaster-dark/30 shrink-0 rounded-t-3xl">
            <div>
              <h3 id={titleId} className="text-xl font-serif-display font-normal text-soot tracking-tight">{title}</h3>
              {subtitle && <p id={subtitleId} className="text-xs text-moss mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer focus:outline-none"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="absolute top-4 end-4 z-20">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer focus:outline-none"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Scrollable Body Section */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
          {children}
        </div>

        {/* Footer Section */}
        {footer && (
          <div className="px-6 sm:px-8 py-4 border-t border-soot/10 bg-plaster-dark/30 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
