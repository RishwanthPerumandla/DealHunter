export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_fingerprints: {
        Row: {
          id: string; // TEXT - SHA256 hash
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
        };
        Insert: {
          id: string;
          fingerprint_hash: string;
          canvas_hash?: string | null;
          webgl_renderer?: string | null;
          screen_resolution?: string | null;
          timezone?: string | null;
          language?: string | null;
          first_seen?: string;
          last_seen?: string;
          vote_count?: number;
          session_count?: number;
          country?: string | null;
          city?: string | null;
          ip_hash?: string | null;
        };
        Update: {
          id?: string;
          fingerprint_hash?: string;
          canvas_hash?: string | null;
          webgl_renderer?: string | null;
          screen_resolution?: string | null;
          timezone?: string | null;
          language?: string | null;
          first_seen?: string;
          last_seen?: string;
          vote_count?: number;
          session_count?: number;
          country?: string | null;
          city?: string | null;
          ip_hash?: string | null;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          cuisine_type: string;
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
        };
        Insert: {
          id?: string;
          name: string;
          cuisine_type: string;
          address: string;
          zipcode: string;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          website?: string | null;
          verified?: boolean;
          submitted_by_fingerprint?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cuisine_type?: string;
          address?: string;
          zipcode?: string;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          website?: string | null;
          verified?: boolean;
          submitted_by_fingerprint?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          restaurant_id: string;
          title: string;
          description: string | null;
          deal_type: string;
          original_price: number | null;
          discounted_price: number | null;
          discount_percentage: number | null;
          valid_from: string;
          valid_until: string | null;
          start_time: string | null;
          end_time: string | null;
          days_available: number[];
          terms_conditions: string | null;
          coupon_code: string | null;
          upvotes: number;
          downvotes: number;
          score: number;
          status: string;
          view_count: number;
          image_url: string | null;
          created_by_fingerprint: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          title: string;
          description?: string | null;
          deal_type: string;
          original_price?: number | null;
          discounted_price?: number | null;
          discount_percentage?: number | null;
          valid_from?: string;
          valid_until?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          days_available?: number[];
          terms_conditions?: string | null;
          coupon_code?: string | null;
          upvotes?: number;
          downvotes?: number;
          score?: number;
          status?: string;
          view_count?: number;
          image_url?: string | null;
          created_by_fingerprint?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          title?: string;
          description?: string | null;
          deal_type?: string;
          original_price?: number | null;
          discounted_price?: number | null;
          discount_percentage?: number | null;
          valid_from?: string;
          valid_until?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          days_available?: number[];
          terms_conditions?: string | null;
          coupon_code?: string | null;
          upvotes?: number;
          downvotes?: number;
          score?: number;
          status?: string;
          view_count?: number;
          image_url?: string | null;
          created_by_fingerprint?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          deal_id: string;
          fingerprint_id: string;
          vote_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          fingerprint_id: string;
          vote_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          fingerprint_id?: string;
          vote_type?: string;
          created_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          fingerprint_id: string | null;
          event_type: string;
          metadata: Json;
          session_id: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          fingerprint_id?: string | null;
          event_type: string;
          metadata?: Json;
          session_id?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          fingerprint_id?: string | null;
          event_type?: string;
          metadata?: Json;
          session_id?: string | null;
          timestamp?: string;
        };
      };
      zipcode_cache: {
        Row: {
          zipcode: string;
          lat: number;
          lng: number;
          city: string;
          state: string;
          country: string;
        };
        Insert: {
          zipcode: string;
          lat: number;
          lng: number;
          city: string;
          state: string;
          country?: string;
        };
        Update: {
          zipcode?: string;
          lat?: number;
          lng?: number;
          city?: string;
          state?: string;
          country?: string;
        };
      };
    };
    Views: {
      daily_analytics: {
        Row: {
          date: string | null;
          event_type: string | null;
          unique_users: number | null;
          event_count: number | null;
          zipcode: string | null;
          cuisine_type: string | null;
        };
      };
    };
    Functions: {
      // New zipcode-based function
      get_deals_by_zipcode: {
        Args: {
          p_zipcode: string;
          cuisine_filter: string[];
        };
        Returns: {
          id: string;
          restaurant_id: string;
          title: string;
          description: string;
          deal_type: string;
          original_price: number;
          discounted_price: number;
          discount_percentage: number;
          valid_from: string;
          valid_until: string;
          days_available: number[];
          terms_conditions: string;
          coupon_code: string;
          upvotes: number;
          downvotes: number;
          score: number;
          status: string;
          view_count: number;
          image_url: string;
          created_by_fingerprint: string;
          created_at: string;
          updated_at: string;
          restaurant_name: string;
          cuisine_type: string;
          address: string;
          restaurant_zipcode: string;
          phone: string;
          website: string;
          lat: number;
          lng: number;
          distance_miles: number;
        }[];
      };
      // Legacy location-based function
      get_nearby_deals: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_miles: number;
          cuisine_filter: string[];
        };
        Returns: {
          id: string;
          restaurant_id: string;
          title: string;
          description: string;
          deal_type: string;
          original_price: number;
          discounted_price: number;
          discount_percentage: number;
          valid_from: string;
          valid_until: string;
          days_available: number[];
          terms_conditions: string;
          coupon_code: string;
          upvotes: number;
          downvotes: number;
          score: number;
          status: string;
          view_count: number;
          image_url: string;
          created_by_fingerprint: string;
          created_at: string;
          updated_at: string;
          restaurant_name: string;
          cuisine_type: string;
          address: string;
          zipcode: string;
          phone: string;
          website: string;
          lat: number;
          lng: number;
          distance: number;
        }[];
      };
    };
  };
}
