// lib/osm.ts
import { getCenter } from 'geolib' // You might need to install this, or we do a simple average

export interface OSMRestaurant {
  name: string
  lat: number
  lon: number
  cuisine?: string
  city?: string
  street?: string
  housenumber?: string
}

export async function fetchRestaurantsFromOSM(lat: number, lon: number, radiusMeters: number = 15000) {
  // CHANGED: 'nwr' means Node, Way, Relation (covers buildings too)
  // We asks for center point geometry ('center') so we get a single lat/lon for buildings
  const query = `
    [out:json];
    (
      nwr["amenity"~"restaurant|bar|cafe|pub|fast_food"](around:${radiusMeters},${lat},${lon});
    );
    out center; 
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    
    const data = await res.json();
    
    console.log(`OSM Raw Count: ${data.elements.length}`);

    return data.elements
      .filter((el: any) => el.tags && el.tags.name) // Must have a name
      .map((el: any) => {
        // Ways/Relations give us a 'center' object, Nodes give direct lat/lon
        const latitude = el.lat || el.center?.lat;
        const longitude = el.lon || el.center?.lon;

        return {
          name: el.tags.name,
          lat: latitude,
          lon: longitude,
          cuisine: el.tags.cuisine,
          city: el.tags['addr:city'],
          street: el.tags['addr:street'],
          housenumber: el.tags['addr:housenumber']
        };
      })
      .filter((r: any) => r.lat && r.lon) as OSMRestaurant[]; // Ensure valid coords
      
  } catch (err) {
    console.error("OSM Fetch Error:", err);
    return [];
  }
}