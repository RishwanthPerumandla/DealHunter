// Location utility functions

import { Location } from '@/types';
import { trackLocationChange } from './analytics';

const STORAGE_KEY = 'desideals_location';
const PREFERENCE_PROMPTED_KEY = 'desideals_preference_prompted';

export const DEFAULT_LOCATION: Location = {
  lat: 40.7128,
  lng: -74.0060,
  zipcode: '10001',
  city: 'New York',
  address: 'New York, NY, USA',
};

export function getStoredLocation(): Location | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function storeLocation(location: Location) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  
  // Dispatch event to notify components that location has been set
  window.dispatchEvent(new CustomEvent('locationSet', { 
    detail: { location, isFresh: true } 
  }));
  
  console.log('[Location] Stored and dispatched event:', location);
}

export function clearStoredLocation() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PREFERENCE_PROMPTED_KEY);
}

// Check if preference has been prompted for current session
export function hasPreferenceBeenPrompted(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(PREFERENCE_PROMPTED_KEY) === 'true';
}

// Mark preference as prompted for current session
export function markPreferencePrompted() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PREFERENCE_PROMPTED_KEY, 'true');
}

// Get current position using browser geolocation
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('Location permission denied'));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error('Location information unavailable'));
        } else if (error.code === error.TIMEOUT) {
          reject(new Error('Location request timed out'));
        } else {
          reject(new Error('Failed to get location'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

// Reverse geocode coordinates to address
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; zipcode: string; city: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const address = data?.address || {};
    
    return {
      address: data?.display_name || '',
      zipcode: address.postcode || '',
      city: address.city || address.town || address.village || address.suburb || '',
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}

// Geocode ZIP code to coordinates
export async function geocodeZipcode(zipcode: string): Promise<Location | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipcode)}&country=USA&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      const address = result.address || {};
      
      const location: Location = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name,
        zipcode: zipcode.trim(),
        city: address.city || address.town || address.village || '',
      };
      
      // Store and dispatch event
      storeLocation(location);
      
      return location;
    }
    return null;
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
}

// Calculate distance between two coordinates in miles
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(miles: number | null | undefined): string {
  if (miles === null || miles === undefined) return '';
  if (miles < 0.1) return '< 0.1 mi';
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
  return `${miles.toFixed(1)} mi`;
}

// Format days available
export function formatDays(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return '';
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  if (days.length === 7) return 'Daily';
  if (days.length === 5 && !days.includes(1) && !days.includes(7)) return 'Mon-Fri';
  if (days.length === 2 && days.includes(1) && days.includes(7)) return 'Weekends';
  
  return days.map(d => dayNames[d - 1]).join(', ');
}

// Check if deal is currently active
export function isDealActive(deal: { valid_from: string; valid_until: string | null; days_available: number[] }): boolean {
  const now = new Date();
  // Convert JS getDay() (0-6, Sun-Sat) to DB format (1-7, Sun-Sat)
  const currentDay = now.getDay() + 1;
  
  // Check days available
  if (deal.days_available && deal.days_available.length > 0) {
    if (!deal.days_available.includes(currentDay)) {
      return false;
    }
  }
  
  // Check date range
  const startDate = new Date(deal.valid_from);
  if (startDate > now) return false;
  
  if (deal.valid_until) {
    const endDate = new Date(deal.valid_until);
    endDate.setHours(23, 59, 59, 999);
    if (endDate < now) return false;
  }
  
  return true;
}

// Set location and track
export function setAndTrackLocation(location: Location, method: 'geolocation' | 'zipcode' | 'manual' = 'manual') {
  storeLocation(location);
  trackLocationChange(
    location.zipcode || '',
    location.lat,
    location.lng,
    method
  );
}
