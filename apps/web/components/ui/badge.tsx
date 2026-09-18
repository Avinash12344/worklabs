import { HTMLAttributes } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
type Size = 'sm' | 'md';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
  size?: Size;
};

const variantStyles: Record<Variant, string> = {
  default:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success:
    'bg-success-100 text-success-700 dark:bg-success-700/20 dark:text-success-500',
  warning:
    'bg-warning-100 text-warning-700 dark:bg-warning-700/20 dark:text-warning-500',
  danger:
    'bg-danger-100 text-danger-700 dark:bg-danger-700/20 dark:text-danger-500',
  info:
    'bg-info-100 text-info-700 dark:bg-info-700/20 dark:text-info-500',
  brand:
    'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-caption',
  md: 'px-2.5 py-1 text-bodySm',
};

export function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}