'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-soot/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-plaster-surface rounded-3xl border border-soot/15 shadow-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        {title ? (
          <div className="px-6 sm:px-8 py-5 border-b border-soot/10 flex items-center justify-between bg-plaster-dark/30 shrink-0 rounded-t-3xl">
            <div>
              <h3 className="text-xl font-serif-display font-normal text-soot tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs text-moss mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer focus:outline-none"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer focus:outline-none"
              aria-label="Close modal"
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
