import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-display font-medium tracking-wide uppercase',
        {
          'bg-success/10 text-success border border-success/20': variant === 'success',
          'bg-danger/10 text-danger border border-danger/20': variant === 'danger',
          'bg-warning/10 text-warning border border-warning/20': variant === 'warning',
          'bg-info/10 text-info border border-info/20': variant === 'info',
          'bg-slate-100 text-slate-600 border border-slate-200': variant === 'neutral',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
