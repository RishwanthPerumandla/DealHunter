'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from '@/hooks/useLocation';
import PreferenceModal, { 
  getStoredPreference, 
  setStoredPreference,
  CuisinePreference 
} from './PreferenceModal';
import { trackEvent, AnalyticsEvents } from '@/lib/utils/analytics';
import { hasPreferenceBeenPrompted, markPreferencePrompted } from '@/lib/utils/location';

export default function PreferenceSelector() {
  const [showModal, setShowModal] = useState(false);
  const { hasLocation } = useLocation({ autoRequest: false });
  const [isReady, setIsReady] = useState(false);

  // Function to check and show preference modal
  const checkAndShowPreference = useCallback((force = false) => {
    // Don't show if user already set a preference
    const storedPreference = getStoredPreference();
    if (storedPreference) {
      console.log('[PreferenceSelector] Preference already set:', storedPreference);
      return;
    }
    
    // Don't show if already prompted in this session (unless forced)
    if (!force && hasPreferenceBeenPrompted()) {
      console.log('[PreferenceSelector] Already prompted this session');
      return;
    }
    
    // Check if we have location
    if (!hasLocation) {
      console.log('[PreferenceSelector] No location yet, waiting...');
      return;
    }
    
    console.log('[PreferenceSelector] Showing preference modal');
    markPreferencePrompted();
    setShowModal(true);
    trackEvent(AnalyticsEvents.MODAL_OPEN, { modal_name: 'preference_selector' });
  }, [hasLocation]);

  // Listen for location set event
  useEffect(() => {
    const handleLocationSet = (e: CustomEvent<{ location: unknown; isFresh: boolean }>) => {
      console.log('[PreferenceSelector] Location set event received:', e.detail);
      // Small delay to allow LocationGate to fully close
      setTimeout(() => {
        checkAndShowPreference(true); // Force check when location is freshly set
      }, 500);
    };

    window.addEventListener('locationSet', handleLocationSet as EventListener);
    return () => {
      window.removeEventListener('locationSet', handleLocationSet as EventListener);
    };
  }, [checkAndShowPreference]);

  // Also check on mount (for page refresh case)
  useEffect(() => {
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      setIsReady(true);
      checkAndShowPreference(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [checkAndShowPreference]);

  // Check again when hasLocation changes
  useEffect(() => {
    if (isReady && hasLocation) {
      checkAndShowPreference(false);
    }
  }, [hasLocation, isReady, checkAndShowPreference]);

  const handleSelect = (preference: CuisinePreference) => {
    setShowModal(false);
    
    // The preference is already stored by PreferenceModal
    // Just reload the deals with the new filter
    if (typeof window !== 'undefined') {
      // Trigger a custom event that the DealsList can listen to
      window.dispatchEvent(new CustomEvent('preferenceChanged', { 
        detail: { preference } 
      }));
    }
  };

  const handleClose = () => {
    setShowModal(false);
    // Mark as prompted even if user closes without selecting
    markPreferencePrompted();
    trackEvent(AnalyticsEvents.MODAL_CLOSE, { modal_name: 'preference_selector' });
  };

  return (
    <PreferenceModal 
      isOpen={showModal} 
      onSelect={handleSelect}
      onClose={handleClose}
    />
  );
}

// Export helper function to check preference from other components
export { getStoredPreference, setStoredPreference };
export type { CuisinePreference };
