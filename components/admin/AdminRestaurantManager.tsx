'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Check, 
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/db/supabase';
import { Restaurant } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { trackEvent } from '@/lib/utils/analytics';

const cuisineOptions = [
  { value: 'indian', label: 'Indian' },
  { value: 'desi', label: 'Desi/Street Food' },
  { value: 'continental', label: 'Continental' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'other', label: 'Other' },
];

interface AdminRestaurantManagerProps {
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  selectMode?: boolean;
  onRestaurantCreated?: () => void;
}

export default function AdminRestaurantManager({ onRestaurantSelect, selectMode = false, onRestaurantCreated }: AdminRestaurantManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);

  // Create restaurant form state
  const [formData, setFormData] = useState({
    name: '',
    cuisineType: 'indian',
    address: '',
    zipcode: '',
    phone: '',
    website: '',
    lat: '',
    lng: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  // Search restaurants
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching restaurants:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Create new restaurant
  const handleCreateRestaurant = async () => {
    setCreateError('');
    setCreateSuccess(false);

    // Validation
    if (!formData.name.trim()) {
      setCreateError('Restaurant name is required');
      return;
    }
    if (!formData.address.trim()) {
      setCreateError('Address is required');
      return;
    }
    if (!formData.zipcode.trim() || formData.zipcode.length !== 5) {
      setCreateError('Valid 5-digit ZIP code is required');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name: formData.name.trim(),
          cuisine_type: formData.cuisineType,
          address: formData.address.trim(),
          zipcode: formData.zipcode.trim(),
          phone: formData.phone.trim() || null,
          website: formData.website.trim() || null,
          lat: formData.lat ? parseFloat(formData.lat) : null,
          lng: formData.lng ? parseFloat(formData.lng) : null,
          verified: true,
        })
        .select()
        .single();

      if (error) throw error;

      trackEvent('restaurant_create', { restaurant_id: data.id });
      setCreateSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        cuisineType: 'indian',
        address: '',
        zipcode: '',
        phone: '',
        website: '',
        lat: '',
        lng: '',
      });

      // Close modal after a delay
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
        setSearchQuery('');
        setSearchResults([]);
        onRestaurantCreated?.();
      }, 1500);
    } catch (err) {
      console.error('Error creating restaurant:', err);
      setCreateError('Failed to create restaurant. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    if (selectMode && onRestaurantSelect) {
      onRestaurantSelect(restaurant);
      setSelectedRestaurant(restaurant);
    }
  };

  const toggleExpand = (restaurantId: string) => {
    setExpandedRestaurant(expandedRestaurant === restaurantId ? null : restaurantId);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#FF9933] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
          )}
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Restaurant
        </Button>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100"
          >
            {searchResults.map((restaurant) => (
              <div
                key={restaurant.id}
                className={`
                  p-4 transition-colors
                  ${selectMode ? 'cursor-pointer hover:bg-orange-50' : ''}
                  ${selectedRestaurant?.id === restaurant.id ? 'bg-orange-50 ring-2 ring-[#FF9933]' : ''}
                `}
                onClick={() => handleSelectRestaurant(restaurant)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                      {restaurant.verified && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {restaurant.address}, {restaurant.zipcode}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                        {restaurant.cuisine_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {!selectMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(restaurant.id);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {expandedRestaurant === restaurant.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}

                  {selectMode && selectedRestaurant?.id === restaurant.id && (
                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedRestaurant === restaurant.id && !selectMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {restaurant.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{restaurant.phone}</span>
                          </div>
                        )}
                        {restaurant.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <a 
                              href={restaurant.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {restaurant.website}
                            </a>
                          </div>
                        )}
                        {restaurant.lat && restaurant.lng && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>{restaurant.lat.toFixed(6)}, {restaurant.lng.toFixed(6)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No restaurants found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try a different search or add a new restaurant
          </p>
        </div>
      )}

      {/* Create Restaurant Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Restaurant"
        size="lg"
      >
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {createSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Restaurant Created!</h3>
              <p className="text-gray-500">The restaurant has been added successfully.</p>
            </motion.div>
          ) : (
            <>
              <Input
                label="Restaurant Name *"
                placeholder="e.g., Curry House"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Select
                label="Cuisine Type *"
                value={formData.cuisineType}
                onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                options={cuisineOptions}
                required
              />

              <Input
                label="Address *"
                placeholder="e.g., 123 Main St"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />

              <Input
                label="ZIP Code *"
                placeholder="e.g., 10001"
                value={formData.zipcode}
                onChange={(e) => setFormData({ ...formData, zipcode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                maxLength={5}
                required
              />

              <Input
                label="Phone"
                placeholder="e.g., (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Input
                label="Website"
                placeholder="e.g., https://restaurant.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude (optional)"
                  placeholder="e.g., 40.7128"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  type="number"
                  step="any"
                />
                <Input
                  label="Longitude (optional)"
                  placeholder="e.g., -74.0060"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  type="number"
                  step="any"
                />
              </div>

              <p className="text-xs text-gray-500">
                * Required fields
              </p>

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
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRestaurant}
                  loading={isCreating}
                  disabled={!formData.name.trim() || !formData.address.trim() || formData.zipcode.length !== 5}
                  className="flex-1"
                >
                  Create Restaurant
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
