'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Compass, RefreshCw, Zap } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useLocation } from '@/hooks/useLocation';
import DealCard from './DealCard';
import LocationSelector from './LocationSelector';
import DealDetailModal from './DealDetailModal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Deal, VoteType } from '@/types';
import { getStoredPreference, CuisinePreference } from '@/components/PreferenceModal';

const cuisineOptions = [
  { value: 'all', label: 'All cuisines' },
  { value: 'indian', label: 'Indian' },
  { value: 'desi', label: 'Desi' },
  { value: 'continental', label: 'Continental' },
  { value: 'fast_food', label: 'American / Fast food' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'other', label: 'Other' },
];

const sortOptions = [
  { value: 'distance', label: 'Nearest first' },
  { value: 'score', label: 'Most loved' },
  { value: 'discount', label: 'Best value' },
  { value: 'newest', label: 'Newest arrivals' },
];

function isHappyHourDeal(deal: Deal): boolean {
  const haystack = [
    deal.title,
    deal.description || '',
    deal.terms_conditions || '',
    deal.coupon_code || '',
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes('happy hour') || haystack.includes('hh ') || haystack.includes('after work');
}

export default function DealList() {
  const { location } = useLocation();
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [cuisinePreference, setCuisinePreference] = useState<CuisinePreference>(null);
  const [featureFilter, setFeatureFilter] = useState<'all' | 'happy_hour'>('all');

  useEffect(() => {
    const stored = getStoredPreference();
    if (stored) {
      setCuisinePreference(stored);
    }
  }, []);

  useEffect(() => {
    const handlePreferenceChange = (e: CustomEvent<{ preference: CuisinePreference }>) => {
      setCuisinePreference(e.detail.preference);
      if (e.detail.preference === 'desi') {
        setSelectedCuisine('all');
      }
    };

    const handleCuisineSelect = (e: CustomEvent<{ cuisine: string }>) => {
      setSelectedCuisine(e.detail.cuisine);
      const exploreSection = document.getElementById('explore');
      exploreSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    window.addEventListener('preferenceChanged', handlePreferenceChange as EventListener);
    window.addEventListener('headerCuisineSelect', handleCuisineSelect as EventListener);

    return () => {
      window.removeEventListener('preferenceChanged', handlePreferenceChange as EventListener);
      window.removeEventListener('headerCuisineSelect', handleCuisineSelect as EventListener);
    };
  }, []);

  const effectiveCuisineFilter = selectedCuisine !== 'all' ? [selectedCuisine] : [];

  const { deals, fallbackDeals, loading, error, refetch, vote, voting } = useDeals({
    zipcode: location.zipcode,
    cuisineFilter: effectiveCuisineFilter,
    cuisinePreference,
    useZipcodeMode: true,
  });

  const sortDeals = (dealsToSort: Deal[]) => {
    return [...dealsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'discount':
          return (b.discount_percentage || 0) - (a.discount_percentage || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'distance':
        default: {
          const aSameZip = a.restaurant_zipcode === location.zipcode ? 0 : 1;
          const bSameZip = b.restaurant_zipcode === location.zipcode ? 0 : 1;
          if (aSameZip !== bSameZip) return aSameZip - bSameZip;
          return (a.distance_miles || 999) - (b.distance_miles || 999);
        }
      }
    });
  };

  const featureFilteredDeals = (items: Deal[]) =>
    featureFilter === 'happy_hour' ? items.filter(isHappyHourDeal) : items;

  const sortedDeals = sortDeals(featureFilteredDeals(deals));
  const sortedFallbackDeals = sortDeals(featureFilteredDeals(fallbackDeals));
  const sameZipDeals = sortedDeals.filter((d) => d.restaurant_zipcode === location.zipcode);
  const nearbyDeals = sortedDeals.filter((d) => d.restaurant_zipcode !== location.zipcode);
  const allVisibleDeals = [...sameZipDeals, ...nearbyDeals, ...sortedFallbackDeals];
  const happyHourDeals = allVisibleDeals.filter(isHappyHourDeal);

  const hasNoDealsInArea = sortedDeals.length === 0 && sortedFallbackDeals.length === 0;
  const hasOnlyFallbackDeals = sortedDeals.length === 0 && sortedFallbackDeals.length > 0;

  const handleVote = (dealId: string, voteType: VoteType) => {
    vote({ dealId, voteType });
  };

  return (
    <section className="editorial-section space-y-8 pt-0 sm:space-y-10" id="explore">
      <LocationSelector onLocationChange={refetch} />

      <div className="shell-container space-y-6">
        <div className="premium-card overflow-hidden">
          <div className="border-b border-black/6 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Explore the feed
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950 sm:text-3xl">
                  Filter by cuisine, type, and timing
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} options={sortOptions} className="min-w-[190px]" />
                <Button variant="ghost" onClick={() => refetch()} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {cuisineOptions.map((cuisine) => (
                <button
                  key={cuisine.value}
                  onClick={() => setSelectedCuisine(cuisine.value)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    selectedCuisine === cuisine.value
                      ? 'bg-neutral-950 text-white shadow-[0_16px_30px_rgba(17,17,17,0.14)]'
                      : 'border border-black/8 bg-white/80 text-neutral-600 hover:bg-white hover:text-neutral-950'
                  }`}
                >
                  {cuisine.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { value: 'all' as const, label: 'All deals' },
                { value: 'happy_hour' as const, label: 'Happy hour' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFeatureFilter(option.value)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    featureFilter === option.value
                      ? 'bg-[#2e5d4b] text-white shadow-[0_14px_28px_rgba(46,93,75,0.16)]'
                      : 'border border-black/8 bg-white/75 text-neutral-600 hover:bg-white hover:text-neutral-950'
                  }`}
                >
                  {option.value === 'happy_hour' && <Clock3 className="h-4 w-4" />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-6 sm:px-6 sm:py-8">
            {loading ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-[28px] border border-black/6 bg-white/75 shadow-[0_16px_34px_rgba(15,23,42,0.05)]"
                  >
                    <div className="h-56 animate-pulse bg-neutral-200/80" />
                    <div className="space-y-3 p-6">
                      <div className="h-7 w-2/3 animate-pulse rounded-full bg-neutral-200/80" />
                      <div className="h-4 w-1/2 animate-pulse rounded-full bg-neutral-200/70" />
                      <div className="h-4 w-full animate-pulse rounded-full bg-neutral-200/70" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50/80 px-6 py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-red-500 shadow-[0_16px_34px_rgba(239,68,68,0.08)]">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-neutral-950">The feed needs a refresh</h3>
                <p className="mx-auto mt-3 max-w-lg text-neutral-500">
                  We hit a snag while loading the latest offers. Try again and we will pull a fresh
                  set of nearby deals.
                </p>
                <Button onClick={() => refetch()} variant="outline" className="mt-6">
                  Try again
                </Button>
              </div>
            ) : hasNoDealsInArea ? (
              <div className="rounded-[30px] border border-black/6 bg-white/70 px-6 py-12 text-center shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-950 text-white shadow-[0_22px_44px_rgba(17,17,17,0.16)]">
                  <Compass className="h-9 w-9" />
                </div>
                <h3 className="mt-6 text-3xl font-semibold text-neutral-950">Nothing nearby yet</h3>
                <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-neutral-500">
                  We could not find live offers around {location.zipcode || 'your area'} right now.
                  Try another ZIP code or check back soon.
                </p>
                <Button onClick={() => refetch()} variant="outline" className="mt-6">
                  Refresh offers
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {featureFilter === 'all' && happyHourDeals.length > 0 && (
                  <section className="space-y-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                          Happy hour nearby
                        </p>
                        <h3 className="mt-2 text-3xl font-semibold text-neutral-950">
                          Best after-work picks
                        </h3>
                      </div>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {happyHourDeals.slice(0, 4).map((deal, index) => (
                        <motion.div
                          key={`happy-${deal.id}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.22 }}
                        >
                          <DealCard deal={deal} onVote={handleVote} onClick={setSelectedDeal} voting={voting} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {sameZipDeals.length > 0 && (
                  <section className="space-y-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                          Closest to you
                        </p>
                        <h3 className="mt-2 text-3xl font-semibold text-neutral-950">
                          In {location.city || location.zipcode}
                        </h3>
                      </div>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {sameZipDeals.map((deal, index) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.22 }}
                        >
                          <DealCard
                            deal={deal}
                            onVote={handleVote}
                            onClick={setSelectedDeal}
                            voting={voting}
                            featured
                          />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {hasOnlyFallbackDeals && (
                  <div className="rounded-[26px] border border-blue-200 bg-blue-50/80 px-5 py-5 shadow-[0_16px_34px_rgba(59,130,246,0.06)]">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-white p-2 text-blue-600">
                        <Compass className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">No live picks in {location.zipcode}</p>
                        <p className="mt-1 text-sm leading-7 text-blue-700">
                          Showing strong alternatives from nearby areas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {nearbyDeals.length > 0 && (
                  <section className="space-y-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                        Nearby neighborhoods
                      </p>
                      <h3 className="mt-2 text-3xl font-semibold text-neutral-950">
                        Worth a short drive
                      </h3>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {nearbyDeals.map((deal, index) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.22 }}
                        >
                          <DealCard deal={deal} onVote={handleVote} onClick={setSelectedDeal} voting={voting} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {sortedFallbackDeals.length > 0 && (
                  <section className="space-y-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                        Recommended next
                      </p>
                      <h3 className="mt-2 text-3xl font-semibold text-neutral-950">
                        More city highlights
                      </h3>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {sortedFallbackDeals.map((deal, index) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.22 }}
                        >
                          <DealCard deal={deal} onVote={handleVote} onClick={setSelectedDeal} voting={voting} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <DealDetailModal
        deal={selectedDeal}
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        onVote={handleVote}
        voting={voting}
      />
    </section>
  );
}
