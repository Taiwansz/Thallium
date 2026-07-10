import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center rounded-xl text-sm font-medium tracking-wide transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gold-champagne/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer selection:bg-transparent font-display",
          {
            "bg-gold-champagne text-black-pure hover:bg-gold-deep hover:shadow-[0_0_20px_rgba(212,175,106,0.25)] font-bold": variant === 'primary',
            "border border-white/[0.08] bg-transparent text-silver-metallic hover:bg-[#1A1A1A] hover:text-warm-white": variant === 'secondary',
            "bg-rose-600 text-zinc-50 hover:bg-rose-700 hover:shadow-[0_0_20px_rgba(225,29,72,0.25)] font-semibold": variant === 'destructive',
            "bg-transparent text-silver-metallic hover:text-warm-white hover:bg-white/[0.04]": variant === 'ghost',
            "py-2.5 px-4.5": true
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Aguarde...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

