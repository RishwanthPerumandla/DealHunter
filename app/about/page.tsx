'use client';

import { useEffect } from 'react';
import { Building2, Mail, MapPin, Sparkles, Store, UtensilsCrossed } from 'lucide-react';
import { trackPageView } from '@/lib/utils/analytics';

const pillars = [
  {
    icon: UtensilsCrossed,
    title: 'Curated local discovery',
    description:
      'We surface standout food deals, restaurant offers, and happy hour moments with a cleaner local experience.',
  },
  {
    icon: MapPin,
    title: 'Built around where people are',
    description:
      'Location and cuisine cues shape the feed so the best nearby finds show up faster.',
  },
  {
    icon: Sparkles,
    title: 'Starting with Indian & Desi',
    description:
      'Indian and Desi restaurants are our strongest starting point, while the product expands into broader categories.',
  },
];

const businessBenefits = [
  'Showcase lunch specials, buffet offers, and happy hour moments',
  'Reach nearby diners in a premium mobile-first discovery flow',
  'Build visibility around your cuisine, neighborhood, and signature deals',
];

export default function AboutPage() {
  useEffect(() => {
    trackPageView('/about', 'About');
  }, []);

  return (
    <div className="editorial-section pt-8">
      <div className="shell-container space-y-8">
        <section className="premium-card overflow-hidden">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                <Sparkles className="h-3.5 w-3.5" />
                About DesiDeals
              </div>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-neutral-950 sm:text-5xl">
                A premium local layer for food offers and restaurant discovery.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-neutral-600 sm:text-lg">
                We are building a cleaner way to discover restaurant deals, food offers, and happy
                hour moments nearby. The experience starts with strong Indian and Desi coverage and
                grows toward a wider set of cuisines and neighborhoods.
              </p>
            </div>

            <div className="rounded-[28px] bg-neutral-950 p-6 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                For restaurants
              </p>
              <h2 className="mt-3 text-3xl font-semibold">Want your restaurant featured?</h2>
              <p className="mt-3 text-sm leading-7 text-white/72">
                We are actively shaping restaurant discovery around better presentation, stronger
                deal visibility, and clearer local intent.
              </p>
              <a
                href="mailto:partnerships@desideals.app?subject=Feature%20My%20Restaurant"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950 transition-all duration-200 hover:-translate-y-0.5"
              >
                <Mail className="h-4 w-4" />
                Contact for restaurant partnerships
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="premium-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <pillar.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-neutral-950">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-500">{pillar.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="premium-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Why partner
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-neutral-950">Designed to elevate your offers</h2>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {businessBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-[22px] border border-black/8 bg-white/80 px-4 py-4 text-sm leading-7 text-neutral-600"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Business inquiry
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-neutral-950">Bring your restaurant onto the platform</h2>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-black/8 bg-white/80 p-5">
              <p className="text-sm leading-7 text-neutral-600">
                If you run a restaurant and want your deals, happy hours, or special promotions
                featured, reach out and tell us about your location, cuisine, and the kinds of
                offers you want diners to discover.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:partnerships@desideals.app?subject=Restaurant%20Partnership%20Inquiry"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Mail className="h-4 w-4" />
                  Email partnerships
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Explore live deals
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
