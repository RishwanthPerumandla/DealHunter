'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Search, Map } from 'lucide-react';
import { 
  storeLocation, 
  getStoredLocation,
  DEFAULT_LOCATION,
  reverseGeocode
} from '@/lib/utils/location';
import { trackLocationPermission } from '@/lib/utils/analytics';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LocationGate() {
  const [zipcode, setZipcode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGate, setShowGate] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check if we already have a stored location
  useEffect(() => {
    const checkStoredLocation = () => {
      const stored = getStoredLocation();
      if (stored) {
        console.log('[LocationGate] Location already exists, not showing gate');
        setShowGate(false);
      } else {
        console.log('[LocationGate] No location found, showing gate');
        setShowGate(true);
      }
      setIsInitializing(false);
    };
    
    // Small delay to prevent flash
    const timer = setTimeout(checkStoredLocation, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUseLocation = useCallback(async () => {
    setLocationLoading(true);
    setError('');
    setPermissionDenied(false);

    try {
      const position = await navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Get address details using reverse geocoding
          try {
            const addressData = await reverseGeocode(latitude, longitude);
            
            const newLocation = {
              lat: latitude,
              lng: longitude,
              address: addressData?.address,
              zipcode: addressData?.zipcode || '',
              city: addressData?.city || '',
            };

            console.log('[LocationGate] Setting location from GPS:', newLocation);
            storeLocation(newLocation);
            trackLocationPermission(true);
            setShowGate(false);
          } catch {
            // Fallback if geocoding fails
            const newLocation = {
              lat: latitude,
              lng: longitude,
            };
            console.log('[LocationGate] Setting location from GPS (no geocode):', newLocation);
            storeLocation(newLocation);
            trackLocationPermission(true);
            setShowGate(false);
          }
          setLocationLoading(false);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setPermissionDenied(true);
          setError('Location permission denied. Please enter your ZIP code below.');
          trackLocationPermission(false, err.message);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } catch (err) {
      setError('Geolocation is not supported on this browser.');
      trackLocationPermission(false, 'not_supported');
      setLocationLoading(false);
    }
  }, []);

  const handleSearchZipcode = useCallback(async () => {
    if (!zipcode.trim() || zipcode.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setSearchLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipcode)}&country=USA&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
      );
      
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const address = result.address || {};
        const newLocation = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name,
          zipcode: zipcode.trim(),
          city: address.city || address.town || address.village || '',
        };
        
        console.log('[LocationGate] Setting location from ZIP:', newLocation);
        storeLocation(newLocation);
        trackLocationPermission(true, 'zipcode');
        setShowGate(false);
      } else {
        setError('Could not find location. Please try again.');
      }
    } catch (err) {
      setError('Failed to search ZIP code. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, [zipcode]);

  const handleUseDefault = useCallback(() => {
    console.log('[LocationGate] Setting default location:', DEFAULT_LOCATION);
    storeLocation(DEFAULT_LOCATION);
    trackLocationPermission(true, 'default');
    setShowGate(false);
  }, []);

  // Don't render anything while checking (prevents flash)
  if (isInitializing) return null;
  
  // Don't render if we have location
  if (!showGate) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#FF9933] via-[#FFB366] to-[#FF7700] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-green-100 rounded-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-[#FF9933]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DesiDeals</h1>
          <p className="text-gray-500">Find the best restaurant deals near you</p>
        </div>

        {/* Location Options */}
        <div className="space-y-4">
          {/* Use Current Location */}
          <button
            onClick={handleUseLocation}
            disabled={locationLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FF9933] text-white font-medium rounded-xl hover:bg-[#E88820] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locationLoading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <Navigation className="w-5 h-5" />
            )}
            {locationLoading ? 'Getting Location...' : 'Use My Current Location'}
          </button>

          {permissionDenied && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg text-center">
              Location permission denied. Please enter your ZIP code below.
            </div>
          )}

          {error && !permissionDenied && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* ZIP Code Search */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Enter ZIP Code
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g., 10001"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSearchZipcode()}
              />
              <button
                onClick={handleSearchZipcode}
                disabled={searchLoading || zipcode.length !== 5}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchLoading ? '...' : <Search className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Use Default */}
          <button
            onClick={handleUseDefault}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Map className="w-4 h-4" />
            Use New York City (Default)
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400 text-center">
          We use your location to show deals within 5 miles of you.
        </p>
      </div>
    </div>
  );
}
