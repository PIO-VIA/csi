import React from 'react';
import Link from 'next/link';
import { Card, CardBody } from './Card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  variation?: string;
  variationUp?: boolean;
  href?: string;
}

export function StatCard({ label, value, icon, color = 'primary', variation, variationUp = true, href }: StatCardProps) {
  const inner = (
    <Card variant="solid" className="hover:shadow-lg hover:border-primary-100 duration-300 cursor-pointer">
      <CardBody className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-display font-medium text-slate-500 tracking-wide uppercase">
            {label}
          </span>
          <span className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            {value}
          </span>
          {variation && (
            <div className="flex items-center gap-1 mt-1">
              {variationUp ? (
                <ArrowUpRight className="h-4.5 w-4.5 text-success" />
              ) : (
                <ArrowDownRight className="h-4.5 w-4.5 text-danger" />
              )}
              <span
                className={cn('text-xs font-body font-semibold', {
                  'text-success': variationUp,
                  'text-danger': !variationUp,
                })}
              >
                {variation}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn('p-3 rounded-xl flex items-center justify-center', {
            'bg-primary-50 text-primary-600 border border-primary-100': color === 'primary',
            'bg-accent-50 text-accent-600 border border-accent-100': color === 'accent',
            'bg-success/10 text-success border border-success/20': color === 'success',
            'bg-warning/10 text-warning border border-warning/20': color === 'warning',
            'bg-danger/10 text-danger border border-danger/20': color === 'danger',
            'bg-info/10 text-info border border-info/20': color === 'info',
          })}
        >
          {icon}
        </div>
      </CardBody>
    </Card>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export default StatCard;
