import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  nom?: string;
  initials?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ className, nom = '', initials, src, size = 'md', ...props }: AvatarProps) {
  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .filter((n) => !n.includes('.'))
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayInitials = initials || getInitials(nom) || '?';

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center font-display font-semibold select-none overflow-hidden border border-slate-700 bg-gradient-to-br from-primary-600 to-accent-600 text-white',
        {
          'h-8 w-8 text-xs': size === 'sm',
          'h-11 w-11 text-sm': size === 'md',
          'h-16 w-16 text-xl': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nom} className="h-full w-full object-cover" />
      ) : (
        <span>{displayInitials}</span>
      )}
    </div>
  );
}

export default Avatar;
