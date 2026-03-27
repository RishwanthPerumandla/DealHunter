'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock3, LocateFixed, MapPin, Navigation, Search, Sparkles, X } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface LocationSelectorProps {
  onLocationChange?: () => void;
}

const quickAreas = ['10001', '60601', '77001', '94105'];

export default function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const { location, rawLocation, loading, permissionDenied, requestLocation, setLocationByZipcode, hasLocation } =
    useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [zipcode, setZipcode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasLocation && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasLocation, isOpen]);

  const handleUseLocation = async () => {
    await requestLocation();
    if (!permissionDenied) {
      setIsOpen(false);
      onLocationChange?.();
    }
  };

  const handleSearchZipcode = async (value?: string) => {
    const finalZipcode = (value ?? zipcode).trim();

    if (finalZipcode.length !== 5) {
      setError('Enter a valid 5-digit ZIP code.');
      return;
    }

    setSearchLoading(true);
    setError('');

    try {
      const result = await setLocationByZipcode(finalZipcode);
      if (result) {
        setZipcode('');
        setIsOpen(false);
        onLocationChange?.();
      } else {
        setError('ZIP code not found. Try another area.');
      }
    } catch {
      setError('Location lookup failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const displayLocation = hasLocation && rawLocation
    ? rawLocation.city || rawLocation.zipcode || 'Location set'
    : location.city || location.zipcode || 'Set location';

  return (
    <>
      <div className="shell-container">
        <div className="premium-card flex flex-col gap-4 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <button onClick={() => setIsOpen(true)} className="flex items-center gap-4 text-left">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                  hasLocation
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {hasLocation ? <LocateFixed className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Your area
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-950">{displayLocation}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  The feed prioritizes nearby restaurant deals and happy hour moments here.
                </p>
              </div>
            </button>

            <Button variant="outline" onClick={() => setIsOpen(true)} className="whitespace-nowrap">
              Change
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-neutral-600">
              <Sparkles className="h-4 w-4" />
              Curated nearby picks
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-neutral-600">
              <Clock3 className="h-4 w-4" />
              Happy hour and food deals
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => hasLocation && setIsOpen(false)} title="Choose your area" size="md">
        <div className="space-y-4 p-5 sm:p-6">
          {hasLocation && (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white p-2 text-emerald-700">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Current location</p>
                  <p className="text-sm text-emerald-700">
                    {rawLocation?.city && `${rawLocation.city}, `}
                    {rawLocation?.zipcode || location.zipcode}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleUseLocation}
              className="rounded-[24px] border border-black/8 bg-white/80 p-5 text-left transition-all duration-200 hover:bg-white"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Navigation className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold text-neutral-950">Use current location</p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Fastest option for nearby deals and happy hours.
              </p>
            </button>

            <div className="rounded-[24px] border border-black/8 bg-white/80 p-5">
              <p className="text-lg font-semibold text-neutral-950">Search ZIP code</p>
              <div className="mt-4 flex gap-3">
                <Input
                  type="text"
                  placeholder="10001"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  maxLength={5}
                  className="text-center text-lg tracking-[0.2em]"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchZipcode()}
                />
                <Button onClick={() => handleSearchZipcode()} loading={searchLoading} disabled={zipcode.length !== 5}>
                  <Search className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickAreas.map((zip) => (
                  <button
                    key={zip}
                    onClick={() => handleSearchZipcode(zip)}
                    className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-all duration-200 hover:bg-neutral-950 hover:text-white"
                  >
                    {zip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {permissionDenied && (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Location permission denied. Use ZIP code instead.
            </p>
          )}

          {error && (
            <AnimatePresence>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <X className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.p>
            </AnimatePresence>
          )}
        </div>
      </Modal>
    </>
  );
}
