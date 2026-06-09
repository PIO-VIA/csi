import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center font-display font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
          {
            // Variants
            'bg-primary-600 hover:bg-primary-500 text-white border border-transparent shadow-md hover:shadow-lg btn-primary-shadow': variant === 'primary',
            'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200': variant === 'secondary',
            'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white': variant === 'ghost',
            'bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 hover:border-transparent': variant === 'danger',
            'bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800/40 hover:text-white': variant === 'outline',
            
            // Sizes
            'px-3.5 py-1.5 text-xs': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-6 py-3.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon ? <span className="ml-2">{rightIcon}</span> : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
