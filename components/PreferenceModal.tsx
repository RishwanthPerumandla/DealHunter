'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Globe, ChevronRight } from 'lucide-react';
import { trackEvent, AnalyticsEvents } from '@/lib/utils/analytics';

export type CuisinePreference = 'desi' | 'other' | null;

interface PreferenceModalProps {
  isOpen: boolean;
  onSelect: (preference: CuisinePreference) => void;
  onClose?: () => void;
}

const PREFERENCE_STORAGE_KEY = 'desideals_preference';

export function getStoredPreference(): CuisinePreference {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
  return (stored as CuisinePreference) || null;
}

export function setStoredPreference(preference: CuisinePreference) {
  if (typeof window === 'undefined') return;
  if (preference) {
    localStorage.setItem(PREFERENCE_STORAGE_KEY, preference);
  } else {
    localStorage.removeItem(PREFERENCE_STORAGE_KEY);
  }
}

export default function PreferenceModal({ isOpen, onSelect, onClose }: PreferenceModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = (preference: CuisinePreference) => {
    setIsAnimating(true);
    
    // Track preference selection
    trackEvent(AnalyticsEvents.PREFERENCE_SET, {
      preference,
      preference_label: preference === 'desi' ? 'Desi Deals' : 'Other Deals',
    });
    
    // Store preference
    setStoredPreference(preference);
    
    // Small delay for animation
    setTimeout(() => {
      onSelect(preference);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary p-6 text-white">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold mb-2">What are you craving?</h2>
                <p className="text-white/90 text-sm">
                  Select your preference to see the best deals near you
                </p>
              </motion.div>
            </div>

            {/* Options */}
            <div className="p-6 space-y-4">
              {/* Desi Deals Option */}
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('desi')}
                disabled={isAnimating}
                className="w-full group relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-orange-50 to-amber-50 p-5 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-amber-500 shadow-lg shadow-primary/20">
                    <Utensils className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900 text-lg">Desi Deals</h3>
                    <p className="text-sm text-gray-600">
                      Indian, Pakistani, Bangladeshi & more
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
                </div>
                {/* Decorative element */}
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5" />
                <div className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-secondary/5" />
              </motion.button>

              {/* Other Deals Option */}
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('other')}
                disabled={isAnimating}
                className="w-full group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 p-5 transition-all hover:border-secondary hover:shadow-lg hover:shadow-secondary/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue/20">
                    <Globe className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900 text-lg">Other Deals</h3>
                    <p className="text-sm text-gray-600">
                      All other cuisines near you
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                </div>
                {/* Decorative element */}
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-500/5" />
                <div className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-indigo-500/5" />
              </motion.button>

              {/* Skip option */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => handleSelect(null)}
                disabled={isAnimating}
                className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Show me everything
              </motion.button>
            </div>

            {/* Footer info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 px-6 py-4 border-t border-gray-100"
            >
              <p className="text-xs text-gray-500 text-center">
                You can change this anytime in your settings
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
