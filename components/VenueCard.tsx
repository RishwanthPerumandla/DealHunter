'use client'
import Link from 'next/link'
import { MapPin, Navigation, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VenueCardProps {
  data: any
}

// Helper: Generates a consistent background gradient based on the name
// (Used as a fallback when no cover image exists)
function getPatternForVenue(name: string) {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-indigo-500 to-indigo-600', 
    'from-orange-400 to-red-500',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  return `bg-gradient-to-br ${colors[colorIndex]}`;
}

export default function VenueCard({ data }: VenueCardProps) {
  // 1. Calculate Distance
  const miles = data.dist_meters 
    ? (data.dist_meters * 0.000621371).toFixed(1) 
    : '?'

  // 2. Handle Google Maps
  const handleDirections = (e: React.MouseEvent) => {
    e.preventDefault() // Stop link propagation if necessary
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.name + ' ' + data.address)}`
    window.open(url, '_blank')
  }

  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 h-full flex flex-col">
      
      {/* --- CLICK TARGET 1: MAIN CARD BODY (Goes to Venue Page) --- */}
      <Link href={`/venue/${data.slug || '#'}`} className="flex-1 flex flex-col">
        
        {/* Image Area */}
        <div className={cn(
          "h-32 relative flex items-center justify-center overflow-hidden", 
          data.cover_image_url ? "bg-slate-100" : getPatternForVenue(data.name || 'Venue')
        )}>
          {data.cover_image_url ? (
            <img 
              src={data.cover_image_url} 
              alt={data.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
          ) : (
            <MapPin className="text-white/30" size={48} />
          )}
          
          {/* Distance Badge */}
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
             <Navigation size={10} className="text-blue-500" /> {miles} mi
          </div>
        </div>

        {/* Text Area */}
        <div className="p-4 pb-2">
          <h3 className="font-bold text-slate-900 truncate text-base group-hover:text-blue-600 transition-colors">
            {data.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed min-h-[2.5em]">
            {data.address || 'Address not available'}
          </p>
        </div>
      </Link>
      
      {/* --- CLICK TARGETS 2 & 3: FOOTER ACTIONS (Separate from Main Link) --- */}
      <div className="p-4 pt-0 mt-auto grid grid-cols-2 gap-2">
        
        {/* Button A: Directions */}
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-9 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          onClick={handleDirections}
        >
          <Navigation size={12} className="mr-1.5" />
          Map
        </Button>

        {/* Button B: Add Deal (This Link is now a sibling, not a child) */}
        <Link 
          href={`/submit/form?venue=${data.id}&name=${encodeURIComponent(data.name || '')}`} 
          className="w-full"
        >
          <Button size="sm" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-0 text-xs h-9 font-bold shadow-none">
            <PlusCircle size={12} className="mr-1.5" />
            Add Deal
          </Button>
        </Link>

      </div>
    </div>
  )
}