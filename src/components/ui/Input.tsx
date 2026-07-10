import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-silver-metallic select-none font-display"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "flex w-full rounded-xl border border-white/[0.08] bg-[#090909] px-4 py-3 text-sm text-warm-white transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus:outline-none focus:border-gold-champagne focus:ring-1 focus:ring-gold-champagne/30 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-600 focus:border-rose-600 focus:ring-rose-600/30",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-500 font-medium leading-none mt-1 select-none font-display">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

