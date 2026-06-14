'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => toast(message, 'success', duration), [toast]);
  const error = useCallback((message: string, duration?: number) => toast(message, 'error', duration), [toast]);
  const warning = useCallback((message: string, duration?: number) => toast(message, 'warning', duration), [toast]);
  const info = useCallback((message: string, duration?: number) => toast(message, 'info', duration), [toast]);

  const value = useMemo(() => ({
    toast,
    success,
    error,
    warning,
    info,
    removeToast
  }), [toast, success, error, warning, info, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all",
              {
                "bg-white/95 border-success/20 text-slate-800 shadow-success/5": t.type === 'success',
                "bg-white/95 border-danger/20 text-slate-800 shadow-danger/5": t.type === 'error',
                "bg-white/95 border-warning/20 text-slate-800 shadow-warning/5": t.type === 'warning',
                "bg-white/95 border-primary-200/50 text-slate-800 shadow-primary-500/5": t.type === 'info',
              }
            )}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-danger" />}
              {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-primary-500" />}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium leading-relaxed text-slate-700">
                {t.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-lg p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
