'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/db/supabase';
import { Deal, VoteType, FingerprintId } from '@/types';
import { getFingerprint } from '@/lib/utils/fingerprint';
import { trackVote, trackDealView } from '@/lib/utils/analytics';
import { CuisinePreference } from '@/components/PreferenceModal';

interface UseDealsOptions {
  zipcode?: string;
  lat?: number;
  lng?: number;
  cuisineFilter?: string[];
  cuisinePreference?: CuisinePreference;
  useZipcodeMode?: boolean;
}

// Map preference to cuisine types
function getCuisineFilterFromPreference(preference: CuisinePreference): string[] {
  switch (preference) {
    case 'desi':
      return ['indian', 'desi'];
    case 'other':
      return ['continental', 'fast_food', 'chinese', 'other'];
    case null:
    default:
      // Show all cuisines
      return ['indian', 'desi', 'continental', 'fast_food', 'chinese', 'other'];
  }
}

// Fetch deals by ZIP code (new default behavior)
async function fetchDealsByZipcode(
  zipcode: string,
  cuisineFilter: string[] = []
): Promise<Deal[]> {
  console.log('Fetching deals by zipcode:', { zipcode, cuisineFilter });
  
  const { data, error } = await supabase.rpc('get_deals_by_zipcode', {
    p_zipcode: zipcode,
    cuisine_filter: cuisineFilter.length > 0 ? cuisineFilter : ['indian', 'desi', 'continental', 'fast_food', 'chinese', 'other'],
  });

  if (error) {
    console.error('Error fetching deals by zipcode:', error);
    throw error;
  }
  
  console.log('Fetched deals:', data?.length || 0);
  return data || [];
}

// Fetch ALL active deals (for recommendation fallback)
async function fetchAllActiveDeals(
  excludeZipcode: string,
  limit: number = 20
): Promise<Deal[]> {
  console.log('Fetching fallback deals, excluding:', excludeZipcode);
  
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      restaurant:restaurants(*)
    `)
    .eq('status', 'active')
    .neq('restaurant.zipcode', excludeZipcode)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching fallback deals:', error);
    return [];
  }
  
  // Transform the data to match the Deal type with joined fields
  const transformedData = (data || []).map((item: any) => ({
    ...item,
    restaurant_name: item.restaurant?.name,
    cuisine_type: item.restaurant?.cuisine_type,
    address: item.restaurant?.address,
    restaurant_zipcode: item.restaurant?.zipcode,
    phone: item.restaurant?.phone,
    website: item.restaurant?.website,
    lat: item.restaurant?.lat,
    lng: item.restaurant?.lng,
    distance_miles: null, // Unknown distance for fallback deals
  }));
  
  return transformedData;
}

// Fetch deals with coordinates (legacy for location-based search)
async function fetchNearbyDeals(
  lat: number,
  lng: number,
  radius: number = 10,
  cuisineFilter: string[] = []
): Promise<Deal[]> {
  console.log('Fetching nearby deals:', { lat, lng, radius, cuisineFilter });
  
  const { data, error } = await supabase.rpc('get_nearby_deals', {
    user_lat: lat,
    user_lng: lng,
    radius_miles: radius,
    cuisine_filter: cuisineFilter.length > 0 ? cuisineFilter : ['indian', 'desi', 'continental', 'fast_food', 'chinese', 'other'],
  });

  if (error) {
    console.error('Error fetching nearby deals:', error);
    throw error;
  }
  
  return data || [];
}

// Fetch user's votes for deals
async function fetchUserVotes(dealIds: string[]): Promise<Record<string, VoteType>> {
  if (dealIds.length === 0) return {};
  
  let fingerprintId: FingerprintId | null = null;
  
  try {
    fingerprintId = await getFingerprint();
  } catch {
    return {};
  }
  
  if (!fingerprintId) return {};
  
  const { data, error } = await supabase
    .from('votes')
    .select('deal_id, vote_type')
    .eq('fingerprint_id', fingerprintId)
    .in('deal_id', dealIds);

  if (error) throw error;
  
  const votes: Record<string, VoteType> = {};
  data?.forEach((vote) => {
    votes[vote.deal_id] = vote.vote_type as VoteType;
  });
  
  return votes;
}

export function useDeals(options: UseDealsOptions = {}) {
  const { 
    zipcode, 
    lat, 
    lng, 
    cuisineFilter = [], 
    cuisinePreference = null,
    useZipcodeMode = true 
  } = options;
  
  // Merge explicit cuisineFilter with preference-based filter
  const effectiveCuisineFilter = cuisineFilter.length > 0 
    ? cuisineFilter 
    : getCuisineFilterFromPreference(cuisinePreference);
  
  const queryClient = useQueryClient();

  const dealsQuery = useQuery({
    queryKey: ['deals', useZipcodeMode ? zipcode : `${lat},${lng}`, effectiveCuisineFilter, cuisinePreference],
    queryFn: async () => {
      let deals: Deal[] = [];
      let fallbackDeals: Deal[] = [];
      
      if (useZipcodeMode && zipcode) {
        // Use ZIP code based search
        deals = await fetchDealsByZipcode(zipcode, effectiveCuisineFilter);
        
        // If no deals found in this zipcode, fetch deals from other zipcodes
        if (deals.length === 0) {
          console.log('No deals in zipcode, fetching fallback deals...');
          fallbackDeals = await fetchAllActiveDeals(zipcode, 20);
        }
      } else if (!useZipcodeMode && lat && lng) {
        // Use coordinate-based search (legacy)
        deals = await fetchNearbyDeals(lat, lng, 10, effectiveCuisineFilter);
      } else if (zipcode) {
        // Fallback to zipcode if available
        deals = await fetchDealsByZipcode(zipcode, effectiveCuisineFilter);
        if (deals.length === 0) {
          fallbackDeals = await fetchAllActiveDeals(zipcode, 20);
        }
      } else {
        return { deals: [], fallbackDeals: [] };
      }
      
      // Combine deals and fetch user votes
      const allDeals = [...deals, ...fallbackDeals];
      const dealIds = allDeals.map(d => d.id);
      const userVotes = await fetchUserVotes(dealIds);
      
      // Merge votes into deals
      const dealsWithVotes = allDeals.map(deal => ({
        ...deal,
        user_vote: userVotes[deal.id] || null,
      }));
      
      return {
        deals: dealsWithVotes.filter(d => 
          deals.some(original => original.id === d.id)
        ),
        fallbackDeals: dealsWithVotes.filter(d => 
          fallbackDeals.some(fallback => fallback.id === d.id)
        ),
      };
    },
    enabled: useZipcodeMode ? !!zipcode : (!!lat && !!lng),
    staleTime: 0,
    refetchInterval: 30000,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ dealId, voteType }: { dealId: string; voteType: VoteType }) => {
      let fingerprintId: FingerprintId | null = null;
      
      try {
        fingerprintId = await getFingerprint();
      } catch {
        throw new Error('Unable to verify identity for voting');
      }
      
      if (!fingerprintId) {
        throw new Error('Unable to verify identity for voting');
      }
      
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('deal_id', dealId)
        .eq('fingerprint_id', fingerprintId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking same type - don't track this
          await supabase.from('votes').delete().eq('id', existingVote.id);
          return { dealId, voteType: null as VoteType | null };
        } else {
          // Change vote - track the change
          await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
          trackVote(dealId, voteType);
          return { dealId, voteType };
        }
      } else {
        // New vote - track it
        await supabase.from('votes').insert({
          deal_id: dealId,
          fingerprint_id: fingerprintId,
          vote_type: voteType,
        });
        trackVote(dealId, voteType);
        return { dealId, voteType };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const incrementView = async (dealId: string, restaurantId: string) => {
    trackDealView(dealId, restaurantId);
  };

  return {
    deals: dealsQuery.data?.deals || [],
    fallbackDeals: dealsQuery.data?.fallbackDeals || [],
    loading: dealsQuery.isLoading,
    error: dealsQuery.error,
    refetch: dealsQuery.refetch,
    vote: voteMutation.mutate,
    voting: voteMutation.isPending,
    incrementView,
  };
}

// Fetch single deal with vote status
export function useDeal(dealId: string) {
  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, restaurant:restaurants(*)')
        .eq('id', dealId)
        .single();

      if (error) throw error;
      
      // Get user's vote for this deal
      let fingerprintId: FingerprintId | null = null;
      try {
        fingerprintId = await getFingerprint();
      } catch {
        // Ignore fingerprint errors
      }
      
      let userVote: VoteType | null = null;
      if (fingerprintId) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('deal_id', dealId)
          .eq('fingerprint_id', fingerprintId)
          .maybeSingle();
        
        if (voteData) {
          userVote = voteData.vote_type as VoteType;
        }
      }
      
      return { ...data, user_vote: userVote } as Deal;
    },
    enabled: !!dealId,
  });
}
