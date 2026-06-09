import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  colCount?: number;
}

export function Table({ className, children, isLoading, colCount, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-display font-medium uppercase tracking-wider', className)} {...props}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  isLoading?: boolean;
  colCount?: number;
}

export function TableBody({ className, children, isLoading, colCount, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('divide-y divide-slate-100 font-body', className)} {...props}>
      {isLoading && colCount && colCount > 0
        ? Array.from({ length: 5 }).map((_, i) => (
            <tr key={'skeleton-' + i}>
              {Array.from({ length: colCount }).map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-3/4" />
                </td>
              ))}
            </tr>
          ))
        : children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('hover:bg-primary-50/30 transition-colors duration-150', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('px-6 py-4 font-semibold text-slate-600', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-6 py-4 text-slate-700 align-middle', className)} {...props}>
      {children}
    </td>
  );
}

// Pagination sub-component
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: TablePaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
 
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
      <div className="text-xs font-body text-slate-550">
        Affichage de <span className="font-semibold text-slate-800">{totalItems > 0 ? startItem : 0}</span> à{' '}
        <span className="font-semibold text-slate-800">{endItem}</span> sur{' '}
        <span className="font-semibold text-slate-800">{totalItems}</span> éléments
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 h-8 w-8 bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-body text-slate-600">
          Page {currentPage} sur {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 h-8 w-8 bg-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
