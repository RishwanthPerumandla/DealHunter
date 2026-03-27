'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-[22px] border bg-white/85 px-4 py-3.5 text-[15px] text-neutral-900 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-300
            placeholder:text-neutral-400
            focus:border-black/20 focus:bg-white focus:outline-none focus:ring-4
            ${error ? 'border-red-300 focus:ring-red-100' : 'border-black/8 focus:ring-black/5'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-2 text-sm text-neutral-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
