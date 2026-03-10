import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import VoteControl from '@/components/VoteControl' // Correct Import
import { MapPin, CheckCircle2, CalendarDays, Clock, ChevronLeft, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const revalidate = 0 

// UPDATED INTERFACE FOR NEXT.JS 15
interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function VenuePage({ params }: PageProps) {
  // 1. Await params (Next.js 15)
  const { slug } = await params

  // 2. Fetch Venue Data
  const { data: venue, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !venue) {
    console.error("Venue Error:", error)
    return (
       <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
         <Store size={48} className="text-slate-300 mb-4" />
         <h1 className="text-2xl font-bold text-slate-900">Venue Not Found</h1>
         <p className="text-slate-500 mb-6">We couldn't find the restaurant you're looking for.</p>
         <Link href="/">
           <Button>Return Home</Button>
         </Link>
       </div>
    )
  }

  // 3. Fetch Active Deals (Using RPC to get votes)
  const { data: deals } = await supabase.rpc('get_venue_deals', {
    venue_uuid: venue.id
  })

  const formatTime = (t: string | null) => {
    if (!t) return 'Open'
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    const suffix = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${suffix}`
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      <Navbar />

      {/* --- HERO HEADER --- */}
      <div className="bg-white border-b border-slate-200">
        <div className="relative h-64 md:h-80 w-full bg-slate-200 overflow-hidden group">
            {/* Back Button Overlay */}
            <div className="absolute top-4 left-4 z-20">
                <Link href="/">
                    <button className="bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all backdrop-blur-sm">
                        <ChevronLeft size={16} /> Back
                    </button>
                </Link>
            </div>

            {/* Cover Image */}
            <img 
                src={venue.cover_image_url || `https://placehold.co/1200x400/f1f5f9/94a3b8?text=${encodeURIComponent(venue.name)}`} 
                alt={venue.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          
            {/* Hero Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-5xl mx-auto text-white">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 shadow-sm text-white leading-none">
                            {venue.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-200">
                            {venue.verified && (
                                <Badge className="bg-blue-600 hover:bg-blue-700 border-0 gap-1 px-2 py-0.5 shadow-sm">
                                    <CheckCircle2 size={12} /> Verified
                                </Badge>
                            )}
                            <div className="flex items-center gap-1.5 opacity-90 hover:text-white transition-colors cursor-pointer bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                <MapPin size={14} />
                                {venue.address || 'Location varies'}, {venue.city || venue.zip_code}
                            </div>
                        </div>
                    </div>
                    
                    {/* Action: Add Deal */}
                    <Link href={`/submit/form?venue=${venue.id}&name=${encodeURIComponent(venue.name)}`}>
                        <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-lg h-12 px-6">
                            Add a Deal Here
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        
        {/* Section Title */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <CalendarDays className="text-blue-600" />
            Active Offers <span className="text-slate-400 font-normal text-base ml-1">({deals?.length || 0})</span>
          </h2>
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {(!deals || deals.length === 0) ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 inline-flex p-4 rounded-full mb-4">
                 <Store className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No active deals right now</h3>
              <p className="text-slate-500 text-sm mb-6">Be the first to share a special from {venue.name}!</p>
              <Link href={`/submit/form?venue=${venue.id}&name=${encodeURIComponent(venue.name)}`}>
                  <Button variant="outline">Post a Deal</Button>
              </Link>
            </div>
          ) : (
            deals.map((deal: any) => (
              <Card key={deal.id} className="group overflow-hidden border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row h-full">
                    
                    {/* Voting Section (Integrated) */}
                    <div className="hidden sm:flex flex-col items-center justify-center p-4 bg-slate-50 border-r border-slate-100 min-w-[70px]">
                        <VoteControl 
                            dealId={deal.id} 
                            initialScore={deal.score || 0} 
                            initialUserVote={deal.user_vote || 0}
                        />
                    </div>

                    {/* Image */}
                    {deal.proof_image_url && (
                        <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-slate-100 border-b sm:border-b-0 sm:border-r border-slate-100 overflow-hidden shrink-0">
                            <img 
                                src={deal.proof_image_url} 
                                alt="Proof" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col">
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <h3 className="font-bold text-lg text-slate-900 leading-tight">
                                {deal.title}
                            </h3>
                            {/* Mobile Vote (Only visible on small screens) */}
                            <div className="sm:hidden">
                                <VoteControl 
                                    dealId={deal.id} 
                                    initialScore={deal.score || 0} 
                                    initialUserVote={deal.user_vote || 0}
                                    size="sm"
                                />
                            </div>
                        </div>

                        <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                            {deal.description || "No additional details provided."}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-slate-50">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 gap-1.5 h-7 px-2.5">
                                <Clock size={12} />
                                {formatTime(deal.start_time)} - {formatTime(deal.end_time)}
                            </Badge>

                            {/* Days Tags */}
                            <div className="flex gap-1">
                                {['S','M','T','W','T','F','S'].map((dayChar, idx) => {
                                    // Map JS Sunday (0) to whatever your DB uses (assuming 1=Sun, 7=Sat)
                                    // Adjust 'idx + 1' if your DB logic is different
                                    const isActive = deal.days_active?.includes(idx + 1)
                                    return (
                                        <span 
                                            key={idx} 
                                            className={`text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                                                isActive 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-slate-50 text-slate-300'
                                            }`}
                                        >
                                            {dayChar}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  )
}