'use client';

import { useEffect } from 'react';
import { Clock3, Sparkles } from 'lucide-react';
import DealList from '@/components/deals/DealList';
import { trackPageView } from '@/lib/utils/analytics';

export default function Home() {
  useEffect(() => {
    trackPageView('/', 'Home');
  }, []);

  return (
    <div className="pb-10">
      <section className="shell-container pb-2 pt-7 sm:pb-3 sm:pt-9">
        <div className="premium-card flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              <Sparkles className="h-3.5 w-3.5" />
              Curated local dining
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-neutral-950 sm:text-3xl">
              Food deals, restaurant offers, and happy hours around you
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-500 sm:text-base">
              Starting with Indian and Desi favorites, and expanding into a broader world of nearby
              food and drink offers.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-4 py-2.5 text-sm text-neutral-700 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <Clock3 className="h-4 w-4" />
            Live offers refreshed frequently
          </div>
        </div>
      </section>

      <DealList />
    </div>
  );
}
