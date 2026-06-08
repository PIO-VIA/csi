import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export function Loader({ className, size = 'md', fullPage = false }: LoaderProps) {
  const loader = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'relative rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin',
          {
            'h-6 w-6': size === 'sm',
            'h-12 w-12 border-[3px]': size === 'md',
            'h-16 w-16 border-4': size === 'lg',
          }
        )}
      />
      <span className="text-xs font-display font-medium text-slate-400 tracking-wider uppercase animate-pulse">
        Chargement...
      </span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
        {loader}
      </div>
    );
  }

  return loader;
}

export default Loader;
