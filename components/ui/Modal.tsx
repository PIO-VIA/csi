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
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        {/* Content */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className={cn(
              'relative z-50 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]',
              className
            )}
          >
            <div className="flex flex-col gap-1 pr-6 mb-4">
              <Dialog.Title className="text-lg font-display font-semibold text-white tracking-tight">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs font-body text-slate-400">
                  {description}
                </Dialog.Description>
              )}
            </div>

            <div className="w-full text-slate-200">{children}</div>

            {/* Close Button */}
            <Dialog.Close
              asChild
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all active:scale-95 cursor-pointer"
            >
              <button onClick={onClose} aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Modal;
