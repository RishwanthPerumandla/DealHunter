'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import { trackEvent, AnalyticsEvents } from '@/lib/utils/analytics';
import { cuisineImages } from '@/lib/utils/cuisineImages';

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

const cuisineChoices: Array<{
  title: string;
  description: string;
  image: string;
  preference: CuisinePreference;
  featured?: boolean;
}> = [
  {
    title: 'Indian & Desi',
    description: 'Our strongest category right now',
    image: cuisineImages.indian,
    preference: 'desi',
    featured: true,
  },
  {
    title: 'American',
    description: 'Burgers, bars, grills',
    image: cuisineImages.american,
    preference: 'other',
  },
  {
    title: 'Italian',
    description: 'Pizza, pasta, dinner spots',
    image: cuisineImages.italian,
    preference: 'other',
  },
  {
    title: 'Chinese',
    description: 'Combos, noodles, quick bites',
    image: cuisineImages.chinese,
    preference: 'other',
  },
  {
    title: 'Mexican',
    description: 'Tacos, margaritas, late deals',
    image: cuisineImages.mexican,
    preference: 'other',
  },
  {
    title: 'Cafe',
    description: 'Coffee, brunch, pastries',
    image: cuisineImages.cafe,
    preference: 'other',
  },
];

export default function PreferenceModal({ isOpen, onSelect, onClose }: PreferenceModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = (preference: CuisinePreference, title: string) => {
    setIsAnimating(true);

    trackEvent(AnalyticsEvents.PREFERENCE_SET, {
      preference,
      preference_label: title,
    });

    setStoredPreference(preference);

    setTimeout(() => {
      onSelect(preference);
      setIsAnimating(false);
    }, 120);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-[rgba(10,10,10,0.48)] backdrop-blur-md"
        >
          <div className="shell-container flex min-h-screen items-center justify-center py-5 sm:py-8">
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,rgba(254,252,247,0.98),rgba(246,241,233,0.98))] shadow-[0_34px_100px_rgba(15,23,42,0.24)]"
            >
              <div className="p-5 sm:p-6 lg:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      <Sparkles className="h-3.5 w-3.5" />
                      Quick preference
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-neutral-950 sm:text-3xl">
                      What are you in the mood for?
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-500 sm:text-base">
                      Pick a cuisine lane to shape the feed. We support all food deals and happy
                      hours, with Indian and Desi offers featured most heavily right now.
                    </p>
                  </div>

                  {onClose && (
                    <button
                      onClick={onClose}
                      className="rounded-full border border-black/8 bg-white/80 p-2.5 text-neutral-500 transition-all duration-200 hover:bg-white hover:text-neutral-950"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cuisineChoices.map((choice, index) => (
                    <motion.button
                      key={choice.title}
                      type="button"
                      disabled={isAnimating}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.18 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelect(choice.preference, choice.title)}
                      className={`group overflow-hidden rounded-[24px] border text-left shadow-[0_16px_34px_rgba(15,23,42,0.06)] transition-all duration-200 ${
                        choice.featured
                          ? 'border-[#d2a568]/55 bg-neutral-950 text-white'
                          : 'border-black/8 bg-white/85 text-neutral-950'
                      }`}
                    >
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src={choice.image}
                          alt={choice.title}
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            choice.featured ? 'opacity-90' : ''
                          }`}
                        />
                        <div className={`absolute inset-0 ${choice.featured ? 'bg-gradient-to-t from-black/65 to-transparent' : 'bg-gradient-to-t from-black/35 to-transparent'}`} />
                        {choice.featured && (
                          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-950">
                            Highlighted
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2">
                          {choice.featured ? (
                            <UtensilsCrossed className="h-4 w-4 text-white/80" />
                          ) : (
                            <Globe className="h-4 w-4 text-neutral-400" />
                          )}
                          <p className={`text-base font-semibold ${choice.featured ? 'text-white' : 'text-neutral-950'}`}>
                            {choice.title}
                          </p>
                        </div>
                        <p className={`mt-2 text-sm ${choice.featured ? 'text-white/72' : 'text-neutral-500'}`}>
                          {choice.description}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isAnimating}
                  onClick={() => handleSelect(null, 'All Cuisines')}
                  className="mt-4 flex w-full items-center justify-between rounded-[22px] border border-dashed border-black/12 bg-white/60 px-4 py-3.5 text-left transition-all duration-200 hover:bg-white/85"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">Show all cuisines</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Start broad and refine once you explore the feed.
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-neutral-400" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
