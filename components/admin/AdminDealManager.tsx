'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Tag,
  Check,
  X,
  Loader2,
  Camera,
  Upload,
  Building2,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/db/supabase';
import { Restaurant, Deal } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import AdminRestaurantManager from './AdminRestaurantManager';
import { uploadImage } from '@/lib/utils/image';
import { trackEvent } from '@/lib/utils/analytics';

const dealTypeOptions = [
  { value: 'percentage_off', label: 'Percentage Off' },
  { value: 'fixed_price', label: 'Fixed Price Deal' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'free_item', label: 'Free Item' },
  { value: 'combo', label: 'Combo Deal' },
  { value: 'buffet_special', label: 'Buffet Special' },
];

const dayOptions = [
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
  { value: '7', label: 'Sun' },
];

interface AdminDealManagerProps {
  onDealCreated?: () => void;
}

export default function AdminDealManager({ onDealCreated }: AdminDealManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Restaurant, 2: Deal Details
  
  // Restaurant selection
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantSearch, setShowRestaurantSearch] = useState(false);

  // Deal form
  const [formData, setFormData] = useState({
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

  // Image
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  // Status
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRestaurantSearch(false);
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysAvailable: prev.daysAvailable.includes(day)
        ? prev.daysAvailable.filter(d => d !== day)
        : [...prev.daysAvailable, day].sort(),
    }));
  };

  const handleCreateDeal = async () => {
    setCreateError('');
    setCreateSuccess(false);

    if (!selectedRestaurant) {
      setCreateError('Please select a restaurant');
      return;
    }

    if (!formData.title.trim()) {
      setCreateError('Deal title is required');
      return;
    }

    setIsCreating(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const { data, error } = await supabase
        .from('deals')
        .insert({
          restaurant_id: selectedRestaurant.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          deal_type: formData.dealType,
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          discounted_price: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
          valid_from: new Date().toISOString().split('T')[0],
          days_available: formData.daysAvailable,
          terms_conditions: formData.termsConditions.trim() || null,
          coupon_code: formData.couponCode.trim() || null,
          status: 'active', // Admin created deals are active immediately
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      trackEvent('deal_create', { 
        deal_id: data.id,
        restaurant_id: selectedRestaurant.id 
      });

      setCreateSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
        setStep(1);
        setSelectedRestaurant(null);
        setFormData({
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
        setSelectedImage(null);
        setImagePreview('');
        onDealCreated?.();
      }, 1500);
    } catch (err) {
      console.error('Error creating deal:', err);
      setCreateError('Failed to create deal. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && selectedRestaurant) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Deals Management</h3>
          <p className="text-sm text-gray-500">Create and manage restaurant deals</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Deal
        </Button>
      </div>

      {/* Create Deal Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !isCreating && setShowCreateModal(false)}
        title="Create New Deal"
        size="lg"
      >
        <div className="p-6">
          {createSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Deal Created!</h3>
              <p className="text-gray-500">The deal has been added and is now active.</p>
            </motion.div>
          ) : (
            <>
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-[#FF9933] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-[#FF9933]' : 'bg-gray-200'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-[#FF9933] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
              </div>

              {/* Step 1: Select Restaurant */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-sm text-blue-700">
                      First, select the restaurant for this deal. You can search existing restaurants or create a new one.
                    </p>
                  </div>

                  {selectedRestaurant ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 border-2 border-green-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Building2 className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">{selectedRestaurant.name}</p>
                            <p className="text-sm text-green-600">{selectedRestaurant.address}</p>
                            <p className="text-sm text-green-500">{selectedRestaurant.zipcode}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedRestaurant(null)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <AdminRestaurantManager
                      onRestaurantSelect={handleSelectRestaurant}
                      selectMode
                    />
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={nextStep}
                      disabled={!selectedRestaurant}
                      className="flex items-center gap-2"
                    >
                      Next: Deal Details
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Deal Details */}
              {step === 2 && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {/* Selected Restaurant Summary */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Creating deal for</p>
                      <p className="font-medium text-gray-900">{selectedRestaurant?.name}</p>
                    </div>
                    <button
                      onClick={prevStep}
                      className="text-sm text-[#FF9933] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    {imagePreview ? (
                      <div className="relative">
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
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-10 h-10 mx-auto mb-3 text-gray-400" />
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
                          <Upload className="w-4 h-4" />
                          Choose Photo
                        </label>
                      </>
                    )}
                  </div>

                  <Input
                    label="Deal Title *"
                    placeholder="e.g., 50% Off Lunch Buffet"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />

                  <Select
                    label="Deal Type *"
                    value={formData.dealType}
                    onChange={(e) => setFormData({ ...formData, dealType: e.target.value })}
                    options={dealTypeOptions}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Original Price ($)"
                      type="number"
                      placeholder="0.00"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    />
                    <Input
                      label="Discounted Price ($)"
                      type="number"
                      placeholder="0.00"
                      value={formData.discountedPrice}
                      onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Description"
                    placeholder="Additional details about the deal..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />

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
                    label="Coupon Code"
                    placeholder="e.g., SAVE20"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                  />

                  <Input
                    label="Terms & Conditions"
                    placeholder="Any restrictions or special conditions..."
                    value={formData.termsConditions}
                    onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                  />

                  {createError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 flex items-center gap-2">
                        <X className="w-4 h-4 flex-shrink-0" />
                        {createError}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCreateDeal}
                      loading={isCreating}
                      disabled={!formData.title.trim()}
                      className="flex-1"
                    >
                      Create Deal
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
