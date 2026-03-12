import { supabase } from '@/lib/db/supabase';
import { EventType, FingerprintId } from '@/types';
import { getFingerprint } from './fingerprint';
import { trackGAEvent, setGAUserProperties, pageview } from '@/components/GoogleAnalytics';
import { getStoredPreference } from '@/components/PreferenceModal';

// Generate session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('desideals_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('desideals_session_id', sessionId);
  }
  return sessionId;
}

// Analytics event names for consistency
export const AnalyticsEvents = {
  PAGE_VIEW: 'page_view',
  DEAL_VIEW: 'deal_view',
  DEAL_CLICK: 'deal_click',
  VOTE: 'vote',
  VOTE_UP: 'vote_up',
  VOTE_DOWN: 'vote_down',
  LOCATION_CHANGE: 'location_change',
  LOCATION_PERMISSION: 'location_permission',
  DEAL_SUBMIT: 'deal_submit',
  RESTAURANT_CREATE: 'restaurant_create',
  PREFERENCE_SET: 'preference_set',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  SHARE: 'share',
  FILTER_CHANGE: 'filter_change',
  SEARCH: 'search',
  ERROR: 'error',
  // Ecommerce events
  BEGIN_CHECKOUT: 'begin_checkout',
  ADD_TO_CART: 'add_to_cart',
} as const;

// Get user properties for GA
async function getUserProperties(): Promise<Record<string, string | number>> {
  const props: Record<string, string | number> = {};
  
  // Add cuisine preference
  const preference = getStoredPreference();
  if (preference) {
    props.cuisine_preference = preference;
  }
  
  // Add fingerprint (hashed for privacy)
  try {
    const fingerprint = await getFingerprint();
    if (fingerprint) {
      props.user_fingerprint = fingerprint.substring(0, 16);
    }
  } catch (e) {
    // Ignore fingerprint errors
  }
  
  // Add location from localStorage
  if (typeof window !== 'undefined') {
    const location = localStorage.getItem('desideals_location');
    if (location) {
      try {
        const loc = JSON.parse(location);
        if (loc.zipcode) {
          props.location_zipcode = loc.zipcode;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  
  return props;
}

// Track an event (dual tracking: Supabase + GA)
export async function trackEvent(
  eventType: EventType,
  metadata: Record<string, unknown> = {},
  trackInGA: boolean = true
) {
  if (typeof window === 'undefined') return;
  
  console.log(`[Analytics] Tracking: ${eventType}`, metadata);
  
  // Track in Google Analytics
  if (trackInGA) {
    try {
      // Convert metadata to GA format (strings/numbers only)
      const gaParams: Record<string, string | number | boolean> = {};
      
      Object.entries(metadata).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          gaParams[key] = value;
        } else if (value !== null && value !== undefined) {
          gaParams[key] = String(value);
        }
      });
      
      // Add user properties for key events
      if (eventType === AnalyticsEvents.PAGE_VIEW || eventType === AnalyticsEvents.PREFERENCE_SET) {
        const userProps = await getUserProperties();
        setGAUserProperties(userProps);
      }
      
      // Map event names to GA event names
      const gaEventName = eventType.replace(/_/g, '_');
      trackGAEvent(gaEventName, gaParams);
    } catch (e) {
      console.warn('[Analytics] GA tracking error:', e);
    }
  }
  
  // Track in Supabase
  try {
    let fingerprintId: FingerprintId | null = null;
    try {
      fingerprintId = await getFingerprint();
      console.log(`[Analytics] Fingerprint: ${fingerprintId?.substring(0, 16)}...`);
    } catch (e) {
      console.warn('[Analytics] Could not get fingerprint:', e);
    }
    
    const sessionId = getSessionId();
    
    // Insert analytics event
    const { error } = await supabase.from('analytics_events').insert({
      fingerprint_id: fingerprintId,
      event_type: eventType,
      metadata,
      session_id: sessionId,
    });

    if (error) {
      console.error('[Analytics] Insert error:', error);
    } else {
      console.log(`[Analytics] Tracked: ${eventType}`);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}

// Track page view
export function trackPageView(path: string, title?: string) {
  console.log('[Analytics] Page view:', path);
  
  // Track in GA
  pageview(path);
  
  // Track in Supabase
  trackEvent(AnalyticsEvents.PAGE_VIEW, { path, title });
}

// Track deal view
export function trackDealView(dealId: string, restaurantId: string, dealTitle?: string) {
  console.log('[Analytics] Deal view:', { dealId, restaurantId, dealTitle });
  
  trackEvent(AnalyticsEvents.DEAL_VIEW, { 
    deal_id: dealId, 
    restaurant_id: restaurantId,
    deal_title: dealTitle,
  });
  
  // Also track as GA ecommerce view_item
  trackGAEvent('view_item', {
    currency: 'USD',
    value: 0,
    items: JSON.stringify([{
      item_id: dealId,
      item_name: dealTitle || 'Deal',
      item_category: 'restaurant_deal',
    }]),
  });
}

// Track vote
export function trackVote(dealId: string, voteType: 'up' | 'down') {
  console.log('[Analytics] Vote:', { dealId, voteType });
  
  trackEvent(
    voteType === 'up' ? AnalyticsEvents.VOTE_UP : AnalyticsEvents.VOTE_DOWN,
    { deal_id: dealId, vote_type: voteType }
  );
  
  // Track general vote event too
  trackEvent(AnalyticsEvents.VOTE, { deal_id: dealId, vote_type: voteType }, false);
}

// Track location change
export function trackLocationChange(zipcode: string, lat: number, lng: number, method?: 'geolocation' | 'zipcode' | 'manual') {
  console.log('[Analytics] Location change:', { zipcode, lat, lng, method });
  
  trackEvent(AnalyticsEvents.LOCATION_CHANGE, { 
    zipcode, 
    lat, 
    lng,
    method: method || 'unknown',
  });
}

// Track location permission response
export function trackLocationPermission(granted: boolean, methodOrError?: string) {
  const isError = methodOrError && ['denied', 'not_supported', 'timeout'].includes(methodOrError);
  
  console.log('[Analytics] Location permission:', { granted, methodOrError });
  
  trackEvent(AnalyticsEvents.LOCATION_PERMISSION, {
    granted,
    method: isError ? undefined : methodOrError,
    error: isError ? methodOrError : undefined,
  });
}

// Track deal click (directions, phone, website)
export function trackDealClick(dealId: string, type: 'website' | 'phone' | 'directions', restaurantName?: string) {
  console.log('[Analytics] Deal click:', { dealId, type, restaurantName });
  
  trackEvent(AnalyticsEvents.DEAL_CLICK, { 
    deal_id: dealId, 
    click_type: type,
    restaurant_name: restaurantName,
  });
  
  // Track as GA outbound click
  trackGAEvent('outbound_click', {
    link_type: type,
    deal_id: dealId,
  });
}

// Track deal submission
export function trackDealSubmit(dealId: string, restaurantId: string, method: 'ocr' | 'manual' = 'manual') {
  console.log('[Analytics] Deal submit:', { dealId, restaurantId, method });
  
  trackEvent(AnalyticsEvents.DEAL_SUBMIT, { 
    deal_id: dealId, 
    restaurant_id: restaurantId,
    method,
  });
  
  // Track as GA conversion
  trackGAEvent('generate_lead', {
    currency: 'USD',
    value: 1,
    deal_id: dealId,
    method,
  });
}

// Track restaurant creation
export function trackRestaurantCreate(restaurantId: string, restaurantName?: string) {
  console.log('[Analytics] Restaurant create:', { restaurantId, restaurantName });
  
  trackEvent(AnalyticsEvents.RESTAURANT_CREATE, { 
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
  });
}

// Track modal interactions
export function trackModalOpen(modalName: string) {
  console.log('[Analytics] Modal open:', { modalName });
  
  trackEvent(AnalyticsEvents.MODAL_OPEN, { modal_name: modalName });
}

export function trackModalClose(modalName: string, durationMs?: number) {
  console.log('[Analytics] Modal close:', { modalName, durationMs });
  
  trackEvent(AnalyticsEvents.MODAL_CLOSE, { 
    modal_name: modalName,
    duration_ms: durationMs,
  });
}

// Track share events
export function trackShare(dealId: string, platform: 'native' | 'clipboard' | string) {
  console.log('[Analytics] Share:', { dealId, platform });
  
  trackEvent(AnalyticsEvents.SHARE, { deal_id: dealId, platform });
  
  // Track as GA share
  trackGAEvent('share', {
    method: platform,
    content_type: 'deal',
    item_id: dealId,
  });
}

// Track search
export function trackSearch(query: string, resultsCount: number, filters?: string[]) {
  console.log('[Analytics] Search:', { query, resultsCount, filters });
  
  trackEvent(AnalyticsEvents.SEARCH, {
    search_term: query,
    results_count: resultsCount,
    filters: filters || [],
  });
  
  // Track as GA search
  trackGAEvent('search', {
    search_term: query,
    results_count: resultsCount,
  });
}

// Track errors
export function trackError(error: Error, context?: Record<string, unknown>) {
  console.error('[Analytics] Error:', error, context);
  
  trackEvent(AnalyticsEvents.ERROR, {
    error_message: error.message,
    error_stack: error.stack,
    error_name: error.name,
    ...context,
  });
}

// Get daily analytics (for admin)
export async function getDailyAnalytics(days: number = 7) {
  const { data, error } = await supabase
    .from('daily_analytics')
    .select('*')
    .order('date', { ascending: false })
    .limit(days * 10); // Multiple event types per day

  if (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }

  return data || [];
}

// Get popular deals
export async function getPopularDeals(limit: number = 10) {
  const { data, error } = await supabase
    .from('deals')
    .select('*, restaurant:restaurants(name)')
    .eq('status', 'active')
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching popular deals:', error);
    return [];
  }

  return data || [];
}

// Get conversion funnel data (for admin analytics)
export async function getConversionFunnel(days: number = 7) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, fingerprint_id, created_at')
    .gte('created_at', fromDate.toISOString())
    .in('event_type', ['deal_view', 'deal_click', 'vote', 'deal_submit']);

  if (error) {
    console.error('Error fetching funnel data:', error);
    return null;
  }

  // Calculate funnel metrics
  const uniqueUsers = new Set(data?.map(e => e.fingerprint_id)).size;
  const dealViews = data?.filter(e => e.event_type === 'deal_view').length || 0;
  const dealClicks = data?.filter(e => e.event_type === 'deal_click').length || 0;
  const votes = data?.filter(e => e.event_type === 'vote').length || 0;
  const submissions = data?.filter(e => e.event_type === 'deal_submit').length || 0;

  return {
    uniqueUsers,
    dealViews,
    dealClicks,
    votes,
    submissions,
    viewToClickRate: dealViews > 0 ? ((dealClicks / dealViews) * 100).toFixed(1) : '0',
    clickToVoteRate: dealClicks > 0 ? ((votes / dealClicks) * 100).toFixed(1) : '0',
    voteToSubmitRate: votes > 0 ? ((submissions / votes) * 100).toFixed(1) : '0',
  };
}

// Get location-based engagement metrics
export async function getLocationMetrics(days: number = 7) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('analytics_events')
    .select('metadata, event_type, created_at')
    .gte('created_at', fromDate.toISOString())
    .in('event_type', ['location_change', 'deal_view', 'deal_click']);

  if (error) {
    console.error('Error fetching location metrics:', error);
    return null;
  }

  // Group by zipcode
  const zipcodeStats: Record<string, { views: number; clicks: number; sessions: number }> = {};
  
  data?.forEach(event => {
    const zipcode = (event.metadata as Record<string, string>)?.zipcode;
    if (!zipcode) return;
    
    if (!zipcodeStats[zipcode]) {
      zipcodeStats[zipcode] = { views: 0, clicks: 0, sessions: 0 };
    }
    
    if (event.event_type === 'location_change') {
      zipcodeStats[zipcode].sessions++;
    } else if (event.event_type === 'deal_view') {
      zipcodeStats[zipcode].views++;
    } else if (event.event_type === 'deal_click') {
      zipcodeStats[zipcode].clicks++;
    }
  });

  return Object.entries(zipcodeStats)
    .map(([zipcode, stats]) => ({
      zipcode,
      ...stats,
      engagementRate: stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
}
