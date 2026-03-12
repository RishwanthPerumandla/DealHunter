import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

// GET /api/deals - Get nearby deals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5');
    const cuisine = searchParams.get('cuisine');

    let query = supabaseAdmin
      .from('deals')
      .select('*, restaurant:restaurants(*)')
      .eq('status', 'active');

    if (cuisine) {
      query = query.eq('restaurant.cuisine_type', cuisine);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate distance for each deal (in miles)
    const dealsWithDistance = (data || []).map((deal: Record<string, unknown>) => {
      const restaurant = deal.restaurant as Record<string, unknown> | undefined;
      if (restaurant?.lat && restaurant?.lng) {
        const distance = calculateDistance(
          lat,
          lng,
          restaurant.lat as number,
          restaurant.lng as number
        );
        return { ...deal, distance };
      }
      return { ...deal, distance: Infinity };
    });

    // Filter by radius and sort by distance
    const filteredDeals = dealsWithDistance
      .filter((deal: Record<string, unknown>) => (deal.distance as number) <= radius)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
        ((a.distance as number) || Infinity) - ((b.distance as number) || Infinity)
      );

    return NextResponse.json({ deals: filteredDeals || [] });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create restaurant first
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        name: body.restaurantName,
        cuisine_type: body.cuisineType,
        address: body.address,
        zipcode: body.zipcode,
        phone: body.phone || null,
        website: body.website || null,
        lat: body.lat || null,
        lng: body.lng || null,
      } as Record<string, unknown>)
      .select()
      .single();

    if (restaurantError) throw restaurantError;

    // Create deal
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .insert({
        restaurant_id: restaurant.id,
        title: body.title,
        description: body.description || null,
        deal_type: body.dealType,
        original_price: body.originalPrice || null,
        discounted_price: body.discountedPrice || null,
        start_time: body.startTime || null,
        end_time: body.endTime || null,
        days_available: body.daysAvailable || [1, 2, 3, 4, 5, 6, 7],
        terms_conditions: body.termsConditions || null,
        coupon_code: body.couponCode || null,
        image_url: body.imageUrl || null,
        status: 'pending',
      } as Record<string, unknown>)
      .select('*, restaurant:restaurants(*)')
      .single();

    if (dealError) throw dealError;

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}

// Calculate distance using Haversine formula (returns miles)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
