'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from '@/hooks/useLocation';
import PreferenceModal, { 
  getStoredPreference, 
  setStoredPreference,
  CuisinePreference 
} from './PreferenceModal';
import { trackEvent, AnalyticsEvents } from '@/lib/utils/analytics';

export default function PreferenceSelector() {
  const [showModal, setShowModal] = useState(false);
  const { hasLocation } = useLocation({ autoRequest: false });
  const [isReady, setIsReady] = useState(false);

  const checkAndShowPreference = useCallback(() => {
    if (!hasLocation) {
      return;
    }

    setShowModal(true);
    trackEvent(AnalyticsEvents.MODAL_OPEN, { modal_name: 'preference_selector' });
  }, [hasLocation]);

  useEffect(() => {
    const handleLocationSet = () => {
      setTimeout(() => {
        checkAndShowPreference();
      }, 300);
    };

    window.addEventListener('locationSet', handleLocationSet as EventListener);
    return () => {
      window.removeEventListener('locationSet', handleLocationSet as EventListener);
    };
  }, [checkAndShowPreference]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      checkAndShowPreference();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [checkAndShowPreference]);

  useEffect(() => {
    if (isReady && hasLocation) {
      checkAndShowPreference();
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
