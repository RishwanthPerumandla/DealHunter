// hooks/useLocation.ts
import { useState, useEffect } from 'react'

interface Location {
  lat: number
  long: number
  error: string | null
}

export function useLocation() {
  const [location, setLocation] = useState<Location>({
    lat: 0,
    long: 0,
    error: null,
  })

  // HARDCODED FALLBACK: e.g., Your University Campus or Downtown
  // Replace these with coordinates relevant to you
  const FALLBACK_LAT = 33.2148 
  const FALLBACK_LONG = -96.9442 // (Random coords near Texas for example)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ 
        lat: FALLBACK_LAT, 
        long: FALLBACK_LONG, 
        error: "Geolocation not supported" 
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          long: position.coords.longitude,
          error: null,
        })
      },
      (error) => {
        console.warn("Location denied, using fallback.")
        setLocation({
          lat: FALLBACK_LAT,
          long: FALLBACK_LONG,
          error: "Location denied. Showing default area.",
        })
      }
    )
  }, [])

  return location
}