'use client';

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/db/supabase';
import { getFingerprint } from '@/lib/utils/fingerprint';
import { uploadImage } from '@/lib/utils/image';
import { trackDealSubmit } from '@/lib/utils/analytics';
import { Deal, FingerprintId } from '@/types';

interface SubmitDealData {
  // Restaurant
  restaurantName: string;
  cuisineType: string;
  address: string;
  zipcode: string;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
  
  // Deal
  title: string;
  description?: string;
  dealType: string;
  originalPrice?: number;
  discountedPrice?: number;
  startTime?: string;
  endTime?: string;
  daysAvailable: number[];
  termsConditions?: string;
  couponCode?: string;
  image?: File;
}

// Geocode ZIP code to get lat/lng
async function geocodeZipcode(zipcode: string): Promise<{lat: number, lng: number} | null> {
  try {
    // First check cache
    const { data: cached } = await supabase
      .from('zipcode_cache')
      .select('lat, lng')
      .eq('zipcode', zipcode)
      .single();
    
    if (cached) {
      console.log('Using cached ZIP code coordinates:', cached);
      return { lat: cached.lat, lng: cached.lng };
    }
    
    // Fallback to API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipcode)}&country=USA&format=json&limit=1`
    );
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
}

async function submitDeal(data: SubmitDealData): Promise<Deal> {
  // Get fingerprint
  let fingerprintId: FingerprintId | null = null;
  
  try {
    fingerprintId = await getFingerprint();
    console.log('Got fingerprint:', fingerprintId);
  } catch (err) {
    console.error('Failed to get fingerprint:', err);
  }
  
  // Get coordinates for restaurant
  let lat = data.lat;
  let lng = data.lng;
  
  // If no coordinates provided, geocode the ZIP code
  if (!lat || !lng) {
    console.log('Geocoding ZIP code:', data.zipcode);
    const coords = await geocodeZipcode(data.zipcode);
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
      console.log('Got coordinates from ZIP:', coords);
    } else {
      console.warn('Could not geocode ZIP code, restaurant will not appear in nearby search');
    }
  }
  
  // First, find or create restaurant (unique by name + zipcode)
  let restaurantId: string;
  
  // Check if restaurant exists by name and zipcode
  const { data: existingRestaurant, error: findError } = await supabase
    .from('restaurants')
    .select('id, lat, lng')
    .eq('name', data.restaurantName)
    .eq('zipcode', data.zipcode)
    .maybeSingle();
  
  if (findError) {
    console.error('Error finding restaurant:', findError);
    throw new Error(`Failed to find restaurant: ${findError.message}`);
  }
  
  if (existingRestaurant) {
    // Use existing restaurant
    console.log('Using existing restaurant:', existingRestaurant.id);
    restaurantId = existingRestaurant.id;
    
    // If existing restaurant doesn't have coordinates but we do, update it
    if ((!existingRestaurant.lat || !existingRestaurant.lng) && lat && lng) {
      console.log('Updating restaurant with coordinates');
      await supabase
        .from('restaurants')
        .update({ lat, lng })
        .eq('id', restaurantId);
    }
  } else {
    // Create new restaurant
    console.log('Creating new restaurant...');
    
    const restaurantData: Record<string, unknown> = {
      name: data.restaurantName,
      cuisine_type: data.cuisineType,
      address: data.address,
      zipcode: data.zipcode,
      phone: data.phone || null,
      website: data.website || null,
      lat: lat || null,
      lng: lng || null,
    };
    
    if (fingerprintId) {
      restaurantData.submitted_by_fingerprint = fingerprintId;
    }
    
    const { data: newRestaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert(restaurantData)
      .select('id')
      .single();
    
    if (restaurantError) {
      console.error('Error creating restaurant:', restaurantError);
      throw new Error(`Failed to create restaurant: ${restaurantError.message}`);
    }
    restaurantId = newRestaurant.id;
    console.log('Created new restaurant:', restaurantId);
  }
  
  // Upload image if provided
  let imageUrl: string | null = null;
  if (data.image) {
    try {
      imageUrl = await uploadImage(data.image);
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }
  
  // Create deal
  console.log('Creating deal for restaurant:', restaurantId);
  
  const dealData: Record<string, unknown> = {
    restaurant_id: restaurantId,
    title: data.title,
    description: data.description || null,
    deal_type: data.dealType,
    original_price: data.originalPrice || null,
    discounted_price: data.discountedPrice || null,
    start_time: data.startTime || null,
    end_time: data.endTime || null,
    days_available: data.daysAvailable,
    terms_conditions: data.termsConditions || null,
    coupon_code: data.couponCode || null,
    image_url: imageUrl,
    status: 'pending',
  };
  
  if (fingerprintId) {
    dealData.created_by_fingerprint = fingerprintId;
  }
  
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .insert(dealData)
    .select('*, restaurant:restaurants(*)')
    .single();
  
  if (dealError) {
    console.error('Error creating deal:', dealError);
    throw new Error(`Failed to create deal: ${dealError.message}`);
  }
  
  trackDealSubmit(deal.id, restaurantId);
  
  return deal as Deal;
}

export function useSubmitDeal() {
  return useMutation({
    mutationFn: submitDeal,
  });
}
