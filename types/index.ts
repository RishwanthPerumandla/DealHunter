// types/index.ts
export interface Deal {
  deal_id: string
  title: string
  description: string
  restaurant_name: string
  restaurant_slug: string
  cover_image: string
  start_time: string | null
  end_time: string | null
  score: number // (upvotes - downvotes)
  dist_meters: number
}

export interface Restaurant {
  id: string
  name: string
  slug: string
  address: string
  city: string
  cover_image_url: string | null
  verified: boolean
}