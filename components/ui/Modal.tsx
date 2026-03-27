'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[rgba(14,14,14,0.45)] backdrop-blur-md"
          />

          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.985 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`${sizes[size]} pointer-events-auto w-full overflow-hidden rounded-[30px] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,240,0.96))] shadow-[0_28px_90px_rgba(15,23,42,0.22)]`}
            >
              {title && (
                <div className="flex items-center justify-between border-b border-black/6 px-6 py-5 sm:px-8">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                      Curated Experience
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-neutral-950">{title}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full border border-black/8 bg-white/80 p-2.5 text-neutral-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-neutral-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="max-h-[90vh] overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
