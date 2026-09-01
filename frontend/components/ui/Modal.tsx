'use client';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',};


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(45,53,54,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={`bg-plaster rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-soot/10">
            <h3 className="text-lg font-semibold text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-soot/10 transition-colors text-moss hover:text-soot">
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-soot/10 transition-colors text-moss hover:text-soot">
              <X size={18} />
            </button>
          </div>
        )}
        <div className={title ? '' : 'pt-2'}>
          {children}
        </div>
      </div>
    </div>
  );
}
