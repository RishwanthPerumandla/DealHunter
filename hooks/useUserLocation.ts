import { useState, useEffect } from 'react'
import { resolveZipCode, GeoResult } from '@/lib/geocoding'

const STORAGE_KEY = 'dealhunter_user_loc'

export function useUserLocation() {
  // Initialize with "Loading" state (0,0 is not valid)
  const [coords, setCoords] = useState<{ lat: number; long: number } | null>(null)
  const [label, setLabel] = useState<string>('Locating...')
  const [mode, setMode] = useState<'gps' | 'manual'>('gps')
  const [isReady, setIsReady] = useState(false)

  // 1. Check LocalStorage first (Persistent User Preference)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      setCoords({ lat: parsed.lat, long: parsed.long })
      setLabel(parsed.placeName)
      setMode('manual')
      setIsReady(true)
    } else {
      // 2. If no saved loc, try GPS
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            long: pos.coords.longitude
          })
          setLabel('Current Location')
          setMode('gps')
          setIsReady(true)
        },
        (err) => {
          console.warn("GPS Denied")
          setLabel('Location Required')
          setIsReady(true) // Ready, but coords are null (triggers manual input)
        }
      )
    }
  }, [])

  // 3. Function to manually set Zip
  const setManualLocation = async (zip: string) => {
    const result = await resolveZipCode(zip)
    if (result) {
      setCoords({ lat: result.lat, long: result.long })
      setLabel(result.placeName)
      setMode('manual')
      
      // Persist to storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
      return true
    }
    return false
  }

  return { coords, label, mode, isReady, setManualLocation }
}