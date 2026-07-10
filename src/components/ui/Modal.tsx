'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  // Lock scroll on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              transition: { type: 'spring', stiffness: 380, damping: 30 } 
            }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className={cn(
              "relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#121212]/95 backdrop-blur-xl p-6 text-warm-white shadow-2xl shadow-black/85 overflow-hidden",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              {title ? (
                <h3 className="text-lg font-bold font-display text-warm-white tracking-wide">{title}</h3>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="rounded-lg opacity-75 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-gold-champagne cursor-pointer p-1.5 hover:bg-white/[0.05]"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            {/* Content */}
            <div className="text-sm text-silver-metallic">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

