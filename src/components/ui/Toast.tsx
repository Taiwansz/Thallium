'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4s
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 30 }
              }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={cn(
                "flex items-start justify-between p-4 rounded-xl border border-white/[0.08] text-sm pointer-events-auto bg-[#121212]/95 backdrop-blur-md text-warm-white shadow-2xl shadow-black/60"
              )}
            >
              <div className="flex items-start space-x-3">
                {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-gold-champagne shrink-0" />}
                {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />}
                {t.type === 'info' && <Info className="h-5 w-5 text-silver-metallic shrink-0" />}
                <p className="font-medium text-warm-white">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-4 rounded-lg text-silver-metallic hover:text-warm-white cursor-pointer p-0.5 hover:bg-white/[0.05]"
              >
                <X className="h-4 w-4" />
              </button>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>
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
