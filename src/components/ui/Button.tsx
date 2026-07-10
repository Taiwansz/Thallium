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
          "relative inline-flex items-center justify-center rounded-[0.375rem] text-sm font-medium tracking-normal transition-all duration-75 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none active:translate-y-[-1px] cursor-pointer selection:bg-transparent",
          {
            "bg-primary text-[#09090b] hover:bg-[#10b981]/90 font-semibold": variant === 'primary',
            "border border-zinc-800 bg-transparent text-zinc-50 hover:bg-zinc-900/60": variant === 'secondary',
            "bg-destructive text-zinc-50 hover:bg-destructive/90": variant === 'destructive',
            "bg-transparent text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/40": variant === 'ghost',
            "py-2.5 px-4": true
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
