'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getCurrentPosition,
  getStoredLocation,
  storeLocation,
  clearStoredLocation,
  reverseGeocode,
  geocodeZipcode,
  DEFAULT_LOCATION,
} from '@/lib/utils/location';
import { trackLocationChange } from '@/lib/utils/analytics';
import { Location } from '@/types';

interface UseLocationOptions {
  autoRequest?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { autoRequest = false } = options;
  
  const [location, setLocationState] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize from stored location
  useEffect(() => {
    const stored = getStoredLocation();
    if (stored) {
      console.log('[useLocation] Restored from storage:', stored);
      setLocationState(stored);
    } else if (autoRequest) {
      requestLocation();
    }
    setInitialized(true);
  }, [autoRequest]);

  // Listen for location changes from other components
  useEffect(() => {
    const handleLocationSet = (e: CustomEvent<{ location: Location }>) => {
      console.log('[useLocation] Location set event received:', e.detail.location);
      setLocationState(e.detail.location);
    };

    window.addEventListener('locationSet', handleLocationSet as EventListener);
    return () => {
      window.removeEventListener('locationSet', handleLocationSet as EventListener);
    };
  }, []);

  const setLocation = useCallback((newLocation: Location) => {
    console.log('[useLocation] Setting location:', newLocation);
    storeLocation(newLocation);
    setLocationState(newLocation);
    trackLocationChange(
      newLocation.zipcode || '',
      newLocation.lat,
      newLocation.lng
    );
  }, []);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Get address details
      const addressData = await reverseGeocode(latitude, longitude);
      
      const newLocation: Location = {
        lat: latitude,
        lng: longitude,
        address: addressData?.address,
        zipcode: addressData?.zipcode || '',
        city: addressData?.city || '',
      };

      console.log('[useLocation] Got location from browser:', newLocation);
      setLocation(newLocation);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get location');
      
      if (error.message.includes('denied') || error.message.includes('Permission')) {
        setPermissionDenied(true);
        // Don't auto-set default location, let user choose
        setLocationState(null);
      } else {
        setError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  const setLocationByZipcode = useCallback(async (zipcode: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await geocodeZipcode(zipcode);
      if (result) {
        console.log('[useLocation] Got location from zipcode:', result);
        setLocation(result);
        return result;
      } else {
        setError(new Error('Invalid ZIP code or location not found'));
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to geocode ZIP code'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  const clearLocation = useCallback(() => {
    clearStoredLocation();
    setLocationState(null);
  }, []);

  const useDefaultLocation = useCallback(() => {
    console.log('[useLocation] Using default location:', DEFAULT_LOCATION);
    setLocation(DEFAULT_LOCATION);
    storeLocation(DEFAULT_LOCATION);
    trackLocationChange(
      DEFAULT_LOCATION.zipcode || '',
      DEFAULT_LOCATION.lat,
      DEFAULT_LOCATION.lng
    );
  }, []);

  // Determine effective location (prioritize stored/user-selected, fallback to default only for display)
  const effectiveLocation = location || DEFAULT_LOCATION;
  
  return {
    location: effectiveLocation,
    rawLocation: location, // Can be null if not set
    loading,
    error,
    permissionDenied,
    initialized,
    requestLocation,
    setLocationByZipcode,
    clearLocation,
    useDefaultLocation,
    setLocation,
    hasLocation: !!location && !!location.zipcode,
  };
}
