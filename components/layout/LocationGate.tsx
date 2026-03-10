'use client'
import { useState } from 'react'
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resolveZipCode } from '@/lib/geocoding'

interface LocationGateProps {
  onLocationResolved: (coords: { lat: number; long: number }, label: string) => void
}

export default function LocationGate({ onLocationResolved }: LocationGateProps) {
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleZip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (zip.length < 5) return
    
    setLoading(true)
    setError('')
    
    // Resolve Zip to Lat/Long
    const geo = await resolveZipCode(zip)
    if (geo) {
      // Save for next time (Persist user choice)
      localStorage.setItem('dealhunter_user_loc', JSON.stringify(geo))
      onLocationResolved({ lat: geo.lat, long: geo.long }, geo.placeName)
    } else {
      setError('Could not find that Zip Code.')
    }
    setLoading(false)
  }

  const handleGPS = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, long: pos.coords.longitude }
        onLocationResolved(coords, 'Current Location')
      },
      (err) => {
        setError('Location permission denied. Please enter Zip Code.')
        setLoading(false)
      }
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-md w-full space-y-8">
        
        {/* Brand Hero */}
        <div className="space-y-4">
          <div className="h-20 w-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-200 transform -rotate-3">
            <MapPin size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Find Local Deals
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            Discover happy hours, daily specials, and events in your neighborhood.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="p-6 space-y-4">
            <form onSubmit={handleZip} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <Input 
                  placeholder="Enter Zip Code (e.g. 78701)" 
                  className="pl-10 h-12 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  autoFocus
                />
              </div>
              <Button className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 transition-all" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Search Area'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-wider">Or use GPS</span></div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12 gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
              onClick={handleGPS}
            >
              <Navigation size={18} />
              Locate Me
            </Button>
            
            {error && <p className="text-red-500 text-sm mt-4 font-medium bg-red-50 p-2 rounded">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}