import Link from 'next/link'
import { MapPin, Share2, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProDealCardProps {
  data: any
}

export default function ProDealCard({ data }: ProDealCardProps) {
  // 1. Calculate "Live" Status
  const now = new Date()
  const currentHour = now.getHours() + ':' + now.getMinutes()
  const isLive = currentHour >= (data.start_time || '00:00') && currentHour <= (data.end_time || '23:59')
  
  // 2. Format Distance
  const miles = (data.dist_meters * 0.000621371).toFixed(1)

  // 3. Format Date (e.g. "Updated 12-24-25")
  const updatedDate = new Date(data.created_at).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: '2-digit'
  })

  return (
    <div className="group relative flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all shadow-lg">
      
      {/* CARD BODY */}
      <div className="p-5">
        {/* Header: Name & Distance */}
        <div className="flex justify-between items-start mb-2">
          <Link href={`/venue/${data.slug}`} className="hover:text-yellow-400 transition-colors">
             <h3 className="font-bold text-yellow-500 text-lg leading-tight line-clamp-1">
               {data.name}
             </h3>
          </Link>
          <div className="flex items-center text-slate-400 text-xs gap-1 shrink-0">
            <MapPin size={12} />
            {miles} miles
          </div>
        </div>

        {/* Sub-Header: Time & Live Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center text-slate-300 text-xs font-medium">
            <Clock size={12} className="mr-1.5" />
            {data.deals?.[0]?.start_time?.slice(0,5)} - {data.deals?.[0]?.end_time?.slice(0,5) || 'Close'}
          </div>
          
          {isLive && (
             <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 h-5 px-2 text-[10px] gap-1">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
               Live
             </Badge>
          )}
        </div>

        {/* The Deal List (Bullet Points) */}
        <div className="space-y-2 mb-6">
          {data.deals && data.deals.length > 0 ? (
            data.deals.slice(0, 3).map((deal: any, i: number) => (
              <div key={i} className="text-slate-200 text-sm font-medium flex items-start">
                <span className="mr-2 text-slate-500">•</span>
                <span className="line-clamp-2">{deal.title}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-sm italic">View venue for details</div>
          )}
        </div>

        {/* Action Button */}
        <Link href={`/venue/${data.slug}`}>
          <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-9 text-xs">
            View All Specials
          </Button>
        </Link>
      </div>

      {/* FOOTER: Verified & Share */}
      <div className="bg-slate-950/50 p-3 px-5 flex items-center justify-between border-t border-slate-800">
        <button className="flex items-center gap-1.5 text-slate-500 hover:text-white transition text-xs font-medium">
          <Share2 size={12} /> Share
        </button>

        <span className="text-[10px] text-slate-600 font-mono">
          Updated {updatedDate}
        </span>
      </div>

      {/* Verification Badge (Absolute Top Left) */}
      {data.verified && (
        <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10 flex items-center gap-1">
          <CheckCircle2 size={10} /> Verified
        </div>
      )}
    </div>
  )
}