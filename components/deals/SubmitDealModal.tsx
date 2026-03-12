'use client';

import { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { Camera, Check, Loader2, Upload, Search, MapPin } from 'lucide-react';
import { useSubmitDeal } from '@/hooks/useSubmitDeal';
import { useLocation } from '@/hooks/useLocation';
import { searchRestaurantsByZipcode, searchRestaurantsByName } from '@/hooks/useRestaurants';
import { uploadImage } from '@/lib/utils/image';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Restaurant } from '@/types';

interface SubmitDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = ['Select Restaurant', 'Deal Details', 'Success'];

const cuisineOptions = [
  { value: 'indian', label: 'Indian' },
  { value: 'desi', label: 'Desi/Street Food' },
  { value: 'continental', label: 'Continental' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'other', label: 'Other' },
];

const dealTypeOptions = [
  { value: 'percentage_off', label: 'Percentage Off' },
  { value: 'fixed_price', label: 'Fixed Price Deal' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'free_item', label: 'Free Item' },
  { value: 'combo', label: 'Combo Deal' },
  { value: 'buffet_special', label: 'Buffet Special' },
];

const dayOptions = [
  { value: '1', label: 'Sun' },
  { value: '2', label: 'Mon' },
  { value: '3', label: 'Tue' },
  { value: '4', label: 'Wed' },
  { value: '5', label: 'Thu' },
  { value: '6', label: 'Fri' },
  { value: '7', label: 'Sat' },
];

export default function SubmitDealModal({ isOpen, onClose }: SubmitDealModalProps) {
  const { location } = useLocation();
  const submitDeal = useSubmitDeal();

  const [step, setStep] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  // Restaurant search
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [searchingRestaurants, setSearchingRestaurants] = useState(false);
  const [foundRestaurants, setFoundRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isNewRestaurant, setIsNewRestaurant] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    restaurantName: '',
    cuisineType: 'indian',
    address: '',
    zipcode: location.zipcode || '',
    phone: '',
    website: '',
    title: '',
    description: '',
    dealType: 'percentage_off',
    originalPrice: '',
    discountedPrice: '',
    startTime: '',
    endTime: '',
    daysAvailable: [1, 2, 3, 4, 5, 6, 7] as number[],
    termsConditions: '',
    couponCode: '',
  });

  // Search restaurants when user types
  const handleRestaurantSearch = useCallback(async (query: string) => {
    setRestaurantSearch(query);
    setFormData(prev => ({ ...prev, restaurantName: query }));
    
    if (query.length < 2) {
      setFoundRestaurants([]);
      return;
    }

    setSearchingRestaurants(true);
    try {
      // Search by name with optional ZIP filter
      const results = await searchRestaurantsByName(query, formData.zipcode || undefined);
      setFoundRestaurants(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchingRestaurants(false);
    }
  }, [formData.zipcode]);

  // Search by ZIP code when zipcode changes
  useEffect(() => {
    if (formData.zipcode.length === 5 && !selectedRestaurant) {
      searchRestaurantsByZipcode(formData.zipcode).then(setFoundRestaurants);
    }
  }, [formData.zipcode, selectedRestaurant]);

  const handleSelectExistingRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setFormData(prev => ({
      ...prev,
      restaurantName: restaurant.name,
      cuisineType: restaurant.cuisine_type,
      address: restaurant.address,
      zipcode: restaurant.zipcode,
      phone: restaurant.phone || '',
      website: restaurant.website || '',
    }));
    setRestaurantSearch(restaurant.name);
    setFoundRestaurants([]);
    setIsNewRestaurant(false);
  };

  const handleSelectNewRestaurant = () => {
    setSelectedRestaurant(null);
    setIsNewRestaurant(true);
    setFoundRestaurants([]);
    // Keep the restaurant name from search
    setFormData(prev => ({
      ...prev,
      restaurantName: restaurantSearch,
      // Reset other fields
      address: '',
      phone: '',
      website: '',
    }));
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.restaurantName) return;

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      await submitDeal.mutateAsync({
        ...formData,
        image: selectedImage || undefined,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : undefined,
        lat: location.lat,
        lng: location.lng,
      });
      setStep(2);
    } catch (err) {
      console.error('Failed to submit deal:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setSelectedImage(null);
    setImagePreview('');
    setSelectedRestaurant(null);
    setIsNewRestaurant(false);
    setRestaurantSearch('');
    setFoundRestaurants([]);
    setFormData({
      restaurantName: '',
      cuisineType: 'indian',
      address: '',
      zipcode: location.zipcode || '',
      phone: '',
      website: '',
      title: '',
      description: '',
      dealType: 'percentage_off',
      originalPrice: '',
      discountedPrice: '',
      startTime: '',
      endTime: '',
      daysAvailable: [1, 2, 3, 4, 5, 6, 7],
      termsConditions: '',
      couponCode: '',
    });
    onClose();
  };

  const updateForm = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysAvailable: prev.daysAvailable.includes(day)
        ? prev.daysAvailable.filter(d => d !== day)
        : [...prev.daysAvailable, day].sort(),
    }));
  };

  const nextStep = () => {
    if (step === 0 && formData.restaurantName) {
      setStep(1);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Submit a Deal" size="lg">
      <div className="p-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step ? 'bg-[#FF9933] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-[#FF9933]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Select Restaurant */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Search for an existing restaurant or add a new one. 
                If the restaurant already exists, we&apos;ll use its details.
              </p>
            </div>

            {/* ZIP Code Filter */}
            <Input
              label="ZIP Code (to find nearby restaurants)"
              placeholder="e.g., 10001"
              value={formData.zipcode}
              onChange={(e) => updateForm('zipcode', e.target.value.replace(/\D/g, '').slice(0, 5))}
              maxLength={5}
            />

            {/* Restaurant Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Restaurant Name *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search restaurants or type new name..."
                  value={restaurantSearch}
                  onChange={(e) => handleRestaurantSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF9933] focus:ring-2 focus:ring-orange-100 outline-none"
                />
                {searchingRestaurants && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
                )}
              </div>

              {/* Search Results */}
              {foundRestaurants.length > 0 && !selectedRestaurant && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {foundRestaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => handleSelectExistingRestaurant(restaurant)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#FF9933]" />
                        <span className="font-medium">{restaurant.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 ml-6">{restaurant.address}</p>
                    </button>
                  ))}
                  <button
                    onClick={handleSelectNewRestaurant}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 text-blue-600 font-medium"
                  >
                    + Add &quot;{restaurantSearch}&quot; as new restaurant
                  </button>
                </div>
              )}

              {/* No results - option to add new */}
              {restaurantSearch.length >= 2 && !searchingRestaurants && foundRestaurants.length === 0 && !selectedRestaurant && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
                  <button
                    onClick={handleSelectNewRestaurant}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 text-blue-600 font-medium"
                  >
                    + Add &quot;{restaurantSearch}&quot; as new restaurant
                  </button>
                </div>
              )}
            </div>

            {/* Selected Restaurant Info */}
            {selectedRestaurant && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Using existing restaurant</p>
                    <p className="text-sm text-green-700">{selectedRestaurant.name}</p>
                    <p className="text-sm text-green-600">{selectedRestaurant.address}</p>
                    <button
                      onClick={handleSelectNewRestaurant}
                      className="text-sm text-green-700 underline mt-2"
                    >
                      Change to new restaurant
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* New Restaurant Form */}
            {isNewRestaurant && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900">New Restaurant Details</h4>
                
                <Input
                  label="Restaurant Name *"
                  value={formData.restaurantName}
                  onChange={(e) => updateForm('restaurantName', e.target.value)}
                  required
                />

                <Select
                  label="Cuisine Type *"
                  value={formData.cuisineType}
                  onChange={(e) => updateForm('cuisineType', e.target.value)}
                  options={cuisineOptions}
                  required
                />

                <Input
                  label="Address *"
                  placeholder="e.g., 123 Main St"
                  value={formData.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  required
                />

                <Input
                  label="ZIP Code *"
                  value={formData.zipcode}
                  onChange={(e) => updateForm('zipcode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  maxLength={5}
                  required
                />

                <Input
                  label="Phone"
                  placeholder="e.g., (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                />

                <Input
                  label="Website"
                  placeholder="e.g., https://restaurant.com"
                  value={formData.website}
                  onChange={(e) => updateForm('website', e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={nextStep}
              disabled={!formData.restaurantName || (!selectedRestaurant && !isNewRestaurant) || (isNewRestaurant && (!formData.address || !formData.zipcode))}
              fullWidth
            >
              Next: Add Deal Details
            </Button>
          </div>
        )}

        {/* Step 1: Deal Details */}
        {step === 1 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Image Upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Selected deal"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500 mb-3">Upload a photo of the deal (optional)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="deal-image"
                  />
                  <label
                    htmlFor="deal-image"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200"
                  >
                    <Camera className="w-4 h-4" />
                    Choose Photo
                  </label>
                </>
              )}
            </div>

            <Input
              label="Deal Title *"
              placeholder="e.g., 50% Off Lunch Buffet"
              value={formData.title}
              onChange={(e) => updateForm('title', e.target.value)}
              required
            />

            <Select
              label="Deal Type *"
              value={formData.dealType}
              onChange={(e) => updateForm('dealType', e.target.value)}
              options={dealTypeOptions}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Original Price ($)"
                type="number"
                placeholder="0.00"
                value={formData.originalPrice}
                onChange={(e) => updateForm('originalPrice', e.target.value)}
              />
              <Input
                label="Discounted Price ($)"
                type="number"
                placeholder="0.00"
                value={formData.discountedPrice}
                onChange={(e) => updateForm('discountedPrice', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateForm('startTime', e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => updateForm('endTime', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Days
              </label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(parseInt(day.value))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.daysAvailable.includes(parseInt(day.value))
                        ? 'bg-[#FF9933] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Description"
              placeholder="Additional details about the deal..."
              value={formData.description}
              onChange={(e) => updateForm('description', e.target.value)}
            />

            <Input
              label="Coupon Code"
              placeholder="e.g., SAVE20"
              value={formData.couponCode}
              onChange={(e) => updateForm('couponCode', e.target.value)}
            />

            <Input
              label="Terms & Conditions"
              placeholder="Any restrictions or special conditions..."
              value={formData.termsConditions}
              onChange={(e) => updateForm('termsConditions', e.target.value)}
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!formData.title}
                className="flex-1"
              >
                Submit Deal
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Deal Submitted!</h3>
            <p className="text-gray-500 mb-6">
              Thanks for contributing! Your deal will be reviewed and will appear on the feed shortly.
            </p>
            <Button onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
