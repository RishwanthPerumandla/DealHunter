// Database Types

export type CuisineType = 'indian' | 'desi' | 'continental' | 'fast_food' | 'chinese' | 'other';
export type DealType = 'percentage_off' | 'fixed_price' | 'bogo' | 'free_item' | 'combo' | 'buffet_special';
export type DealStatus = 'active' | 'expired' | 'flagged' | 'pending';
export type VoteType = 'up' | 'down';
export type EventType = 
  | 'page_view' 
  | 'deal_view' 
  | 'vote' 
  | 'vote_up'
  | 'vote_down'
  | 'location_change' 
  | 'location_permission'
  | 'deal_click' 
  | 'deal_submit' 
  | 'restaurant_create' 
  | 'deal_create'
  | 'preference_set'
  | 'modal_open'
  | 'modal_close'
  | 'share'
  | 'search'
  | 'filter_change'
  | 'error';

// Using TEXT for fingerprint ID (SHA256 hash)
export type FingerprintId = string;

export interface UserFingerprint {
  id: FingerprintId;
  fingerprint_hash: string;
  canvas_hash: string | null;
  webgl_renderer: string | null;
  screen_resolution: string | null;
  timezone: string | null;
  language: string | null;
  first_seen: string;
  last_seen: string;
  vote_count: number;
  session_count: number;
  country: string | null;
  city: string | null;
  ip_hash: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine_type: CuisineType;
  address: string;
  zipcode: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  verified: boolean;
  submitted_by_fingerprint: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  deal_type: DealType;
  original_price: number | null;
  discounted_price: number | null;
  discount_percentage: number | null;
  valid_from: string;
  valid_until: string | null;
  days_available: number[];
  terms_conditions: string | null;
  coupon_code: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  status: DealStatus;
  view_count: number;
  image_url: string | null;
  created_by_fingerprint: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from restaurant (flat from RPC)
  restaurant_name?: string;
  cuisine_type?: string;
  address?: string;
  restaurant_zipcode?: string;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
  distance?: number;
  distance_miles?: number;
  user_vote?: VoteType | null;
  // For queries that join with restaurant table
  restaurant?: Restaurant;
}

export interface Vote {
  id: string;
  deal_id: string;
  fingerprint_id: FingerprintId;
  vote_type: VoteType;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  fingerprint_id: FingerprintId | null;
  event_type: EventType;
  metadata: Record<string, unknown>;
  session_id: string | null;
  timestamp: string;
}

export interface ZipcodeCache {
  zipcode: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  zipcode?: string;
  city?: string;
}

export interface FingerprintComponents {
  canvas: string;
  webgl: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  touch: boolean;
}
