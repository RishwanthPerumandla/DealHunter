// lib/geocoding.ts
export interface GeoResult {
  lat: number
  long: number
  placeName: string
}

export async function resolveZipCode(zip: string): Promise<GeoResult | null> {
  try {
    // Basic validation for US Zip codes
    if (!/^\d{5}$/.test(zip)) throw new Error("Invalid Zip Format")

    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return null

    const data = await res.json()
    const place = data.places[0]

    return {
      lat: parseFloat(place.latitude),
      long: parseFloat(place.longitude),
      placeName: `${place['place name']}, ${place['state abbreviation']}`
    }
  } catch (err) {
    console.error("Geocoding failed", err)
    return null
  }
}