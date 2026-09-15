import React from 'react';

export interface BadgeProps {
  variant?: 'eucalyptus' | 'soot' | 'mist' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'eucalyptus',
  children,
  className = '',
}) => {
  const styles = {
    eucalyptus: 'bg-emerald-100/90 text-emerald-900 border-emerald-200/90 backdrop-blur-md font-semibold shadow-2xs',
    soot: 'bg-soot/10 text-soot border-soot/20 backdrop-blur-md font-semibold shadow-2xs',
    mist: 'bg-mist-light/90 text-soot border-mist/50 backdrop-blur-md font-medium',
    success: 'bg-emerald-100/90 text-emerald-900 border-emerald-200/90 backdrop-blur-md font-semibold shadow-2xs',
    warning: 'bg-amber-100/90 text-amber-900 border-amber-200/90 backdrop-blur-md font-semibold shadow-2xs',
    danger: 'bg-rose-100/90 text-rose-800 border-rose-200/90 backdrop-blur-md font-semibold shadow-2xs',
    info: 'bg-sky-100/90 text-sky-900 border-sky-200/90 backdrop-blur-md font-semibold shadow-2xs',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
