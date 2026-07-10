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
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "flex w-full rounded-[0.375rem] border border-zinc-800 bg-[#09090b] px-3.5 py-2.5 text-sm text-zinc-50 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-600 focus:border-rose-600",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-600 font-medium leading-none mt-1 select-none">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
