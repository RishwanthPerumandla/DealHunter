// Google Analytics 4 Integration for DesiDeals
// Track detailed user behavior, engagement, and conversions

declare global {
  interface Window {
    gtag: (command: string, targetId: string | Date | number, config?: Record<string, unknown>) => void;
    dataLayer: unknown[];
  }
}

// Initialize GA4
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined') return;
  
  if (!GA_TRACKING_ID) {
    console.warn('[GA] Tracking ID not set');
    return;
  }

  // Load GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    send_page_view: false, // We'll handle page views manually
    custom_map: {
      custom_parameter_1: 'user_id',
      custom_parameter_2: 'location_zip',
      custom_parameter_3: 'cuisine_preference',
    },
  });

  console.log('[GA] Initialized with ID:', GA_TRACKING_ID);
};

// Track page views with enhanced data
export const pageview = (url: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const location = JSON.parse(localStorage.getItem('desideals_location') || '{}');
  const preference = localStorage.getItem('desideals_preference');

  window.gtag('event', 'page_view', {
    page_location: url,
    page_title: title || document.title,
    location_zip: location.zipcode || 'unknown',
    location_city: location.city || 'unknown',
    cuisine_preference: preference || 'all',
  });

  console.log('[GA] Page view:', url);
};

// Track user engagement events
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const location = JSON.parse(localStorage.getItem('desideals_location') || '{}');
  const preference = localStorage.getItem('desideals_preference');

  window.gtag('event', eventName, {
    ...params,
    location_zip: location.zipcode,
    location_city: location.city,
    cuisine_preference: preference || 'all',
  });

  console.log('[GA] Event:', eventName, params);
};

// ==================== DEAL INTERACTIONS ====================

// Track when user views a deal
export const trackDealView = (
  dealId: string,
  dealTitle: string,
  restaurantName: string,
  cuisineType: string,
  discountPercentage: number
) => {
  trackEvent('view_item', {
    item_id: dealId,
    item_name: dealTitle,
    item_brand: restaurantName,
    item_category: cuisineType,
    discount: discountPercentage,
  });
};

// Track deal list impressions
export const trackDealImpressions = (
  deals: Array<{
    id: string;
    title: string;
    restaurant_name?: string;
    cuisine_type?: string;
  }>
) => {
  trackEvent('view_item_list', {
    item_list_name: 'deals_feed',
    items: deals.map((deal, index) => ({
      item_id: deal.id,
      item_name: deal.title,
      item_brand: deal.restaurant_name,
      item_category: deal.cuisine_type,
      index: index,
    })),
  });
};

// Track deal click
export const trackDealClick = (
  dealId: string,
  dealTitle: string,
  restaurantName: string,
  clickType: 'card' | 'directions' | 'phone' | 'website' | 'share'
) => {
  trackEvent('select_content', {
    content_type: 'deal',
    item_id: dealId,
    item_name: dealTitle,
    item_brand: restaurantName,
    click_type: clickType,
  });
};

// Track deal upvote/downvote
export const trackVote = (
  dealId: string,
  voteType: 'up' | 'down',
  dealTitle: string
) => {
  trackEvent(voteType === 'up' ? 'like' : 'dislike', {
    item_id: dealId,
    item_name: dealTitle,
    value: voteType === 'up' ? 1 : -1,
  });
};

// ==================== LOCATION & SEARCH ====================

// Track location change
export const trackLocationChange = (
  zipcode: string,
  city: string,
  method: 'gps' | 'manual' | 'default'
) => {
  trackEvent('location_change', {
    zipcode: zipcode,
    city: city,
    method: method,
  });
};

// Track location permission response
export const trackLocationPermission = (granted: boolean) => {
  trackEvent('permission_response', {
    permission_type: 'location',
    granted: granted,
  });
};

// Track cuisine filter usage
export const trackFilterUse = (
  filterType: string,
  filterValue: string
) => {
  trackEvent('filter_use', {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

// Track sort preference
export const trackSortUse = (sortBy: string) => {
  trackEvent('sort_use', {
    sort_by: sortBy,
  });
};

// ==================== USER PREFERENCES ====================

// Track cuisine preference selection
export const trackPreferenceSelect = (preference: 'desi' | 'other' | null) => {
  trackEvent('preference_select', {
    preference_type: preference || 'all',
  });
};

// ==================== ENGAGEMENT ====================

// Track scroll depth
let maxScrollDepth = 0;
export const trackScrollDepth = () => {
  if (typeof window === 'undefined') return;

  const scrollPercent = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  );

  // Track at 25%, 50%, 75%, 90%, 100%
  const milestones = [25, 50, 75, 90, 100];
  
  milestones.forEach((milestone) => {
    if (scrollPercent >= milestone && maxScrollDepth < milestone) {
      maxScrollDepth = milestone;
      trackEvent('scroll_depth', {
        depth_percent: milestone,
      });
    }
  });
};

// Track time on page
let timeOnPageInterval: NodeJS.Timeout;
let timeOnPageSeconds = 0;

export const startTimeOnPageTracking = () => {
  if (typeof window === 'undefined') return;

  timeOnPageSeconds = 0;
  
  timeOnPageInterval = setInterval(() => {
    timeOnPageSeconds += 10;
    
    // Track at 10s, 30s, 60s, 120s, 300s
    const milestones = [10, 30, 60, 120, 300];
    if (milestones.includes(timeOnPageSeconds)) {
      trackEvent('engagement_time', {
        time_seconds: timeOnPageSeconds,
      });
    }
  }, 10000);
};

export const stopTimeOnPageTracking = () => {
  if (timeOnPageInterval) {
    clearInterval(timeOnPageInterval);
  }
};

// ==================== ERRORS & PERFORMANCE ====================

// Track errors
export const trackError = (
  error: Error,
  context?: Record<string, any>
) => {
  trackEvent('exception', {
    description: error.message,
    fatal: false,
    ...context,
  });
};

// Track API errors
export const trackApiError = (
  endpoint: string,
  error: any,
  params?: Record<string, any>
) => {
  trackEvent('api_error', {
    endpoint: endpoint,
    error_message: error?.message || 'Unknown error',
    error_code: error?.code,
    ...params,
  });
};

// Track performance metrics
export const trackPerformance = (metric: string, value: number) => {
  trackEvent('performance_metric', {
    metric_name: metric,
    value: value,
  });
};

// ==================== CONVERSIONS ====================

// Track when user gets directions (high intent)
export const trackGetDirections = (
  dealId: string,
  restaurantName: string,
  distance?: number
) => {
  trackEvent('get_directions', {
    item_id: dealId,
    item_brand: restaurantName,
    distance_miles: distance,
  });
};

// Track phone call click
export const trackPhoneClick = (
  dealId: string,
  restaurantName: string
) => {
  trackEvent('phone_click', {
    item_id: dealId,
    item_brand: restaurantName,
  });
};

// Track website visit
export const trackWebsiteVisit = (
  dealId: string,
  restaurantName: string
) => {
  trackEvent('website_visit', {
    item_id: dealId,
    item_brand: restaurantName,
  });
};

// Track share action
export const trackShare = (
  dealId: string,
  dealTitle: string,
  method: 'native' | 'copy' | 'social'
) => {
  trackEvent('share', {
    item_id: dealId,
    item_name: dealTitle,
    method: method,
  });
};

// ==================== USER SEGMENTATION ====================

// Set user properties for segmentation
export const setUserProperties = (properties?: Record<string, string | number | boolean>) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const location = JSON.parse(localStorage.getItem('desideals_location') || '{}');
  const preference = localStorage.getItem('desideals_preference');

  window.gtag('set', 'user_properties', {
    location_zip: location.zipcode || 'unknown',
    location_city: location.city || 'unknown',
    cuisine_preference: preference || 'all',
    user_type: 'anonymous',
    ...properties,
  });
};

// ==================== SESSION MANAGEMENT ====================

// Track session start
export const trackSessionStart = () => {
  const location = JSON.parse(localStorage.getItem('desideals_location') || '{}');
  
  trackEvent('session_start', {
    location_zip: location.zipcode,
    location_city: location.city,
  });
  
  startTimeOnPageTracking();
};

// Track session end
export const trackSessionEnd = () => {
  trackEvent('session_end', {
    duration_seconds: timeOnPageSeconds,
  });
  
  stopTimeOnPageTracking();
};

// Reset scroll depth tracking on page change
export const resetScrollTracking = () => {
  maxScrollDepth = 0;
};
