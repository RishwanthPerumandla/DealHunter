'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/db/supabase';
import { Restaurant } from '@/types';

// Search restaurants by ZIP code
export async function searchRestaurantsByZipcode(zipcode: string): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('zipcode', zipcode)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error searching restaurants:', error);
    return [];
  }

  return data || [];
}

// Search restaurants by name (partial match)
export async function searchRestaurantsByName(name: string, zipcode?: string): Promise<Restaurant[]> {
  let query = supabase
    .from('restaurants')
    .select('*')
    .ilike('name', `%${name}%`);

  if (zipcode) {
    query = query.eq('zipcode', zipcode);
  }

  const { data, error } = await query.order('name', { ascending: true }).limit(10);

  if (error) {
    console.error('Error searching restaurants:', error);
    return [];
  }

  return data || [];
}

// Get all restaurants
export async function getAllRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }

  return data || [];
}

// Hook for searching restaurants
export function useRestaurantSearch(zipcode?: string, name?: string) {
  return useQuery({
    queryKey: ['restaurants', 'search', zipcode, name],
    queryFn: async () => {
      if (name && name.length >= 2) {
        return searchRestaurantsByName(name, zipcode);
      }
      if (zipcode && zipcode.length === 5) {
        return searchRestaurantsByZipcode(zipcode);
      }
      return [];
    },
    enabled: (zipcode && zipcode.length === 5) || (name && name.length >= 2) || false,
    staleTime: 60000,
  });
}
