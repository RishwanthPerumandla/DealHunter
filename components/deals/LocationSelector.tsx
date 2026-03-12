'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, Loader2, Check, X, LocateFixed, ChevronRight } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface LocationSelectorProps {
  onLocationChange?: () => void;
}

export default function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const { location, rawLocation, loading, permissionDenied, requestLocation, setLocationByZipcode, hasLocation } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [zipcode, setZipcode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);

  // Show location modal if no location is set
  useEffect(() => {
    if (!hasLocation && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasLocation, isOpen]);

  const handleUseLocation = async () => {
    await requestLocation();
    if (!permissionDenied) {
      setIsOpen(false);
      triggerUpdateAnimation();
      onLocationChange?.();
    }
  };

  const handleSearchZipcode = async () => {
    if (!zipcode.trim() || zipcode.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setSearchLoading(true);
    setError('');

    try {
      const result = await setLocationByZipcode(zipcode.trim());
      if (result) {
        setIsOpen(false);
        setZipcode('');
        triggerUpdateAnimation();
        onLocationChange?.();
      } else {
        setError('Could not find location. Please try a different ZIP code.');
      }
    } catch {
      setError('Could not find location. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const triggerUpdateAnimation = () => {
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 2000);
  };

  const displayLocation = hasLocation && rawLocation 
    ? (rawLocation.city || rawLocation.zipcode || 'Location Set')
    : (location.city || location.zipcode || 'Set Location');

  return (
    <>
      {/* Location Bar */}
      <motion.div 
        initial={false}
        animate={justUpdated ? { scale: [1, 1.02, 1] } : {}}
        className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-3 flex-1 group"
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  p-2.5 rounded-full transition-colors
                  ${hasLocation 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-orange-100 text-[#FF9933] animate-pulse'
                  }
                `}
              >
                {hasLocation ? (
                  <LocateFixed className="w-5 h-5" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </motion.div>
              <div className="text-left flex-1">
                <p className="text-xs text-gray-500 font-medium">
                  {hasLocation ? 'Your Location' : 'Set Your Location'}
                </p>
                <div className="flex items-center gap-2">
                  <p className={`
                    text-sm font-semibold truncate max-w-[200px] sm:max-w-xs
                    ${hasLocation ? 'text-gray-900' : 'text-[#FF9933]'}
                  `}>
                    {displayLocation}
                  </p>
                  {justUpdated && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-green-600 flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" />
                      Updated
                    </motion.span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
            
            {loading && (
              <Loader2 className="w-5 h-5 animate-spin text-[#FF9933] ml-3" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Location Modal */}
      <Modal isOpen={isOpen} onClose={() => hasLocation && setIsOpen(false)} title="Select Location" size="sm">
        <div className="p-6 space-y-6">
          {/* Current Location Display */}
          {hasLocation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Location Set</p>
                  <p className="text-sm text-green-600">
                    {rawLocation?.city && `${rawLocation.city}, `}
                    {rawLocation?.zipcode || location.zipcode}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Use Current Location */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Use GPS Location</h3>
            <Button
              onClick={handleUseLocation}
              loading={loading}
              fullWidth
              className="flex items-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Use My Current Location
            </Button>
            
            {permissionDenied && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg"
              >
                Location permission denied. Please enter your ZIP code below.
              </motion.p>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or enter ZIP code</span>
            </div>
          </div>

          {/* ZIP Code Search */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Enter ZIP Code</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g., 10001"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                className="flex-1 text-center text-lg tracking-widest"
                onKeyDown={(e) => e.key === 'Enter' && handleSearchZipcode()}
              />
              <Button
                onClick={handleSearchZipcode}
                loading={searchLoading}
                disabled={zipcode.length !== 5}
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Popular ZIP Codes */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Popular Areas</p>
            <div className="flex flex-wrap gap-2">
              {['10001', '90210', '60601', '77001'].map((zip) => (
                <button
                  key={zip}
                  onClick={() => {
                    setZipcode(zip);
                    handleSearchZipcode();
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                >
                  {zip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
