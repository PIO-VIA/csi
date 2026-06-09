'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Modal({ isOpen, onClose, title, description, children, className, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all duration-200" />

        {/* Content */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <Dialog.Content
            className={cn(
              'relative z-50 w-full rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]',
              'transition-all duration-200',
              SIZE_MAP[size],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-slate-100">
              <div className="min-w-0">
                <Dialog.Title className="text-xl font-display font-bold text-slate-900 tracking-tight">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-1 text-sm font-body text-slate-500 leading-relaxed">
                    {description}
                  </Dialog.Description>
                )}
              </div>

              {/* Close Button */}
              <Dialog.Close asChild>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="shrink-0 flex items-center justify-center h-8 w-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="px-6 py-6 text-slate-800 overflow-y-auto max-h-[calc(90vh-10rem)]">
              {children}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Modal;
