import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import VoteControl from './VoteControl'

interface DealCardProps {
  data: any
}

export default function DealCard({ data }: DealCardProps) {
  const miles = data.dist_meters 
    ? (data.dist_meters * 0.000621371).toFixed(1) 
    : '?'
    
  const formatTime = (t: string) => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    const suffix = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${suffix}`
  }

  return (
    <Link href={`/venue/${data.restaurant_slug || '#'}`}>
      <Card className="group flex flex-col h-full overflow-hidden border-slate-200 bg-white hover:shadow-lg transition-all duration-300 cursor-pointer rounded-xl">
        
        {/* IMAGE AREA */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          <img 
            src={data.cover_image || data.proof_image_url || 'https://placehold.co/600x400/f1f5f9/94a3b8?text=No+Image'} 
            alt={data.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <MapPin size={10} className="text-blue-500" /> 
            {miles} mi
          </div>
        </div>

        {/* CONTENT AREA */}
        <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4">
          
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
              {data.title}
            </h3>
            <p className="text-slate-500 text-sm font-medium truncate">
              at {data.restaurant_name}
            </p>
          </div>

          {/* FOOTER ROW: Time + Votes */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            
            {/* Time Badge */}
            <Badge variant="secondary" className="font-medium text-[10px] text-slate-500 bg-slate-100 border-slate-200 h-6 px-2 rounded-md">
              <Clock size={10} className="mr-1.5 text-slate-400" />
              {formatTime(data.start_time)} - {formatTime(data.end_time)}
            </Badge>

            {/* Vote Pill */}
            <div className="scale-90 origin-right">
               <VoteControl 
                 dealId={data.deal_id || data.id} 
                 initialScore={data.score || 0}
                 initialUserVote={data.user_vote || 0}
               />
            </div>

          </div>

        </CardContent>
      </Card>
    </Link>
  )
}