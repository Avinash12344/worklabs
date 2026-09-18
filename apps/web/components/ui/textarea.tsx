'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, id, className = '', ...props }, ref) {
    const textareaId = id ?? props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-bodySm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-3 py-2 rounded-input border
            bg-white dark:bg-slate-900
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            transition-colors resize-y
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
            disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-800
            ${
              error
                ? 'border-danger-500 focus:ring-danger-500'
                : 'border-slate-300 dark:border-slate-700'
            }
            ${className}
          `}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="mt-1 text-caption text-danger-600 dark:text-danger-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-caption text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);