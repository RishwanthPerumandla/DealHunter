'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, SlidersHorizontal, MapPin, Sparkles, Zap, Search, Compass, Utensils, Globe } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useLocation } from '@/hooks/useLocation';
import DealCard from './DealCard';
import LocationSelector from './LocationSelector';
import DealDetailModal from './DealDetailModal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Deal, VoteType } from '@/types';
import { getStoredPreference, CuisinePreference, setStoredPreference } from '@/components/PreferenceModal';

const cuisineOptions = [
  { value: 'all', label: 'All Cuisines' },
  { value: 'indian', label: '🇮🇳 Indian' },
  { value: 'desi', label: '🍛 Desi/Street' },
  { value: 'continental', label: '🍽️ Continental' },
  { value: 'fast_food', label: '🍕 Fast Food' },
  { value: 'chinese', label: '🥡 Chinese' },
];

const sortOptions = [
  { value: 'distance', label: '📍 Nearest' },
  { value: 'score', label: '🔥 Popular' },
  { value: 'discount', label: '💰 Best Deal' },
  { value: 'newest', label: '✨ Newest' },
];

// Get cuisine label from preference
function getPreferenceLabel(preference: CuisinePreference): string {
  switch (preference) {
    case 'desi': return 'Desi Deals';
    case 'other': return 'Other Cuisines';
    default: return 'All Cuisines';
  }
}

// Get cuisine icon from preference
function getPreferenceIcon(preference: CuisinePreference) {
  switch (preference) {
    case 'desi': return <Utensils className="w-4 h-4" />;
    case 'other': return <Globe className="w-4 h-4" />;
    default: return null;
  }
}

export default function DealList() {
  const { location, hasLocation } = useLocation();
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [locationHighlighted, setLocationHighlighted] = useState(false);
  const [cuisinePreference, setCuisinePreference] = useState<CuisinePreference>(null);

  // Load stored preference on mount
  useEffect(() => {
    const stored = getStoredPreference();
    if (stored) {
      setCuisinePreference(stored);
    }
  }, []);

  // Listen for preference changes from the PreferenceSelector
  useEffect(() => {
    const handlePreferenceChange = (e: CustomEvent<{ preference: CuisinePreference }>) => {
      setCuisinePreference(e.detail.preference);
    };

    window.addEventListener('preferenceChanged', handlePreferenceChange as EventListener);
    return () => {
      window.removeEventListener('preferenceChanged', handlePreferenceChange as EventListener);
    };
  }, []);

  // Override cuisine filter if preference is set (unless user explicitly selects a cuisine)
  const effectiveCuisineFilter = selectedCuisine !== 'all' 
    ? [selectedCuisine] 
    : [];
  
  const { deals, fallbackDeals, loading, error, refetch, vote, voting } = useDeals({
    zipcode: location.zipcode,
    cuisineFilter: effectiveCuisineFilter,
    cuisinePreference,
    useZipcodeMode: true,
  });

  // Handle preference toggle
  const handlePreferenceToggle = (preference: CuisinePreference) => {
    setCuisinePreference(preference);
    setStoredPreference(preference);
    // Reset explicit cuisine filter when using preference
    setSelectedCuisine('all');
  };

  // Highlight location when it's first set
  useEffect(() => {
    if (hasLocation && !locationHighlighted) {
      setLocationHighlighted(true);
      const timer = setTimeout(() => setLocationHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasLocation, locationHighlighted]);

  // Sort deals
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
        default:
          const aSameZip = a.restaurant_zipcode === location.zipcode ? 0 : 1;
          const bSameZip = b.restaurant_zipcode === location.zipcode ? 0 : 1;
          if (aSameZip !== bSameZip) return aSameZip - bSameZip;
          return (a.distance_miles || 999) - (b.distance_miles || 999);
      }
    });
  };

  // Separate deals by location relevance
  const sortedDeals = sortDeals(deals);
  const sortedFallbackDeals = sortDeals(fallbackDeals);
  const sameZipDeals = sortedDeals.filter(d => d.restaurant_zipcode === location.zipcode);
  const nearbyDeals = sortedDeals.filter(d => d.restaurant_zipcode !== location.zipcode);

  const hasNoDealsInArea = deals.length === 0 && fallbackDeals.length === 0;
  const hasOnlyFallbackDeals = deals.length === 0 && fallbackDeals.length > 0;

  const handleVote = (dealId: string, voteType: VoteType) => {
    vote({ dealId, voteType });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  return (
    <div className="min-h-screen">
      {/* Location Selector */}
      <LocationSelector onLocationChange={refetch} />

      {/* Location Status Banner */}
      <AnimatePresence>
        {hasLocation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-[#138808] to-[#0F6B06] text-white"
          >
            <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {getPreferenceLabel(cuisinePreference)} near <span className="font-bold">{location.city || location.zipcode}</span>
                </span>
                {cuisinePreference && (
                  <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                    {getPreferenceIcon(cuisinePreference)}
                  </span>
                )}
              </div>
              {sameZipDeals.length > 0 && (
                <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  {sameZipDeals.length} nearby
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                showFilters 
                  ? 'bg-[#FF9933] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={sortOptions}
              className="!py-2 !text-sm flex-1"
            />

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Cuisine Preference Toggle */}
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Quick Filters</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => handlePreferenceToggle('desi')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                        cuisinePreference === 'desi'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                          : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      Desi Deals
                    </button>
                    <button
                      onClick={() => handlePreferenceToggle('other')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                        cuisinePreference === 'other'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Other Cuisines
                    </button>
                    <button
                      onClick={() => handlePreferenceToggle(null)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        cuisinePreference === null
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Show All
                    </button>
                  </div>
                </div>

                {/* Detailed Cuisine Type Filter */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Cuisine Type</p>
                  <div className="flex flex-wrap gap-2">
                    {cuisineOptions.map((cuisine) => (
                      <button
                        key={cuisine.value}
                        onClick={() => setSelectedCuisine(cuisine.value)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          selectedCuisine === cuisine.value
                            ? 'bg-[#FF9933] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cuisine.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Deals List */}
      <div className="max-w-3xl mx-auto px-4 py-4 pb-20">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-4 animate-pulse"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-48 h-48 bg-gray-200 rounded-xl flex-shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="flex gap-2 pt-4">
                      <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Zap className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-gray-600 mb-4">Failed to load deals. Please try again.</p>
            <Button onClick={handleRefresh} variant="outline">
              Retry
            </Button>
          </motion.div>
        ) : hasNoDealsInArea ? (
          // Empty State - No deals at all
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-[#FF9933]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-500 mb-2 max-w-sm mx-auto">
              We couldn&apos;t find any deals near {location.zipcode || 'your location'}.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Try a different ZIP code or check back later!
            </p>
            <Button onClick={handleRefresh} variant="outline">
              Refresh
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Same ZIP Code Deals - Featured */}
            {sameZipDeals.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="w-4 h-4 text-[#FF9933]" />
                  <h2 className="text-sm font-semibold text-gray-700">
                    In {location.city || location.zipcode}
                  </h2>
                  <span className="text-xs text-gray-400">({sameZipDeals.length})</span>
                </div>
                <div className="space-y-3">
                  {sameZipDeals.map((deal, index) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DealCard
                        deal={deal}
                        onVote={handleVote}
                        onClick={handleDealClick}
                        voting={voting}
                        featured
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* No deals in your zipcode message */}
            {hasOnlyFallbackDeals && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
              >
                <Compass className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">
                    No deals in {location.zipcode}
                  </p>
                  <p className="text-sm text-blue-600">
                    Showing popular deals from other areas. Check them out or try a different location!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Nearby Deals (same zipcode but different area or nearby areas) */}
            {nearbyDeals.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`space-y-3 ${sameZipDeals.length > 0 ? 'pt-4 border-t border-gray-200' : ''}`}
              >
                <div className="flex items-center gap-2 px-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-600">
                    Nearby Areas
                  </h2>
                  <span className="text-xs text-gray-400">({nearbyDeals.length})</span>
                </div>
                <div className="space-y-3">
                  {nearbyDeals.map((deal, index) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DealCard
                        deal={deal}
                        onVote={handleVote}
                        onClick={handleDealClick}
                        voting={voting}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Fallback Deals (from other zipcodes when no local deals) */}
            {sortedFallbackDeals.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-3 pt-4 border-t border-gray-200"
              >
                <div className="flex items-center gap-2 px-1">
                  <Compass className="w-4 h-4 text-[#FF9933]" />
                  <h2 className="text-sm font-semibold text-gray-700">
                    Recommended Deals
                  </h2>
                  <span className="text-xs text-gray-400">({sortedFallbackDeals.length})</span>
                </div>
                <div className="space-y-3">
                  {sortedFallbackDeals.map((deal, index) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DealCard
                        deal={deal}
                        onVote={handleVote}
                        onClick={handleDealClick}
                        voting={voting}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Deal Detail Modal */}
      <DealDetailModal
        deal={selectedDeal}
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        onVote={handleVote}
        voting={voting}
      />
    </div>
  );
}
