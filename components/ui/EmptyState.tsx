import React from 'react';
import { ShieldAlert } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 max-w-md mx-auto my-6">
      <div className="p-4 rounded-full bg-slate-100 text-slate-500 mb-4 flex items-center justify-center">
        {icon || <ShieldAlert className="h-8 w-8 text-primary-600" />}
      </div>
      <h3 className="font-display font-semibold text-base text-slate-800 tracking-tight mb-1">
        {title}
      </h3>
      <p className="font-body text-xs text-slate-500 leading-relaxed mb-5">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
