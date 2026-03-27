'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55';

    const variants = {
      primary:
        'bg-neutral-950 text-white shadow-[0_16px_34px_rgba(17,17,17,0.16)] hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(17,17,17,0.22)]',
      secondary:
        'bg-[#2e5d4b] text-white shadow-[0_16px_34px_rgba(46,93,75,0.18)] hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(46,93,75,0.22)]',
      outline:
        'border border-black/10 bg-white/80 text-neutral-900 shadow-[0_12px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:bg-white',
      ghost:
        'bg-transparent text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-950',
      danger:
        'bg-[#8f2d2d] text-white shadow-[0_16px_34px_rgba(143,45,45,0.2)] hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(143,45,45,0.24)]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-3 text-[15px]',
      lg: 'px-6 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
