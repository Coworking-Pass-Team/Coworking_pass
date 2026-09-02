import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 ease-in-out active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-soot/20 disabled:opacity-50 disabled:pointer-events-none shadow-xs';

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  const variants = {
    primary: 'bg-[#374142] text-[#FAF8F5] hover:bg-[#2D3536] border border-white/15 shadow-sm',
    secondary: 'bg-transparent border border-soot/20 text-soot hover:bg-soot/8',
    outline: 'border border-soot/20 bg-transparent text-soot hover:bg-soot/8',
    ghost: 'text-soot hover:bg-soot/8 shadow-none border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-500/20 shadow-xs',
  };

  let variantClass = variants[variant] || variants.primary;

  // If custom text- or bg- classes are provided in className, remove default text- and bg- from variant to prevent CSS conflicts
  const hasCustomTextColor = /\btext-(?:plaster|soot|white|black|moss|eucalyptus|mist|[a-z0-9_-]+)/.test(className);
  const hasCustomBgColor = /\bbg-(?:soot|plaster|moss|eucalyptus|mist|white|black|[a-z0-9_-]+)/.test(className);

  if (hasCustomTextColor) {
    variantClass = variantClass.replace(/\btext-[^\s]+/, '');
  }
  if (hasCustomBgColor) {
    variantClass = variantClass.replace(/\bbg-[^\s]+/, '');
  }

  const combinedClass = [
    baseStyles,
    sizeStyles[size],
    variantClass,
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

  return (
    <button
      className={combinedClass}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
