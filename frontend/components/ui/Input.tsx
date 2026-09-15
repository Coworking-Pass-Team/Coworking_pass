import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-soot/85 tracking-tight">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-4 py-2.5 sm:py-3 rounded-xl border ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/40'
            : 'border-soot/15 bg-plaster-dark/30 hover:bg-plaster-dark/50 focus:bg-white focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/25'
        } text-soot text-sm outline-none transition-all duration-200 placeholder:text-soot/50 shadow-xs ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      {!error && helperText && <span className="text-xs text-moss">{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
