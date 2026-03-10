'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Components
import Navbar from '@/components/layout/Navbar'
import LocationGate from '@/components/layout/LocationGate'
import DealCard from '@/components/DealCard'
import VenueCard from '@/components/VenueCard'
import { Loader2, MapPin, Search, Store, CheckCircle2, SlidersHorizontal, ChevronRight, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Types
type ViewState = 'GATE' | 'FEED'
type TabState = 'deals' | 'venues'

export default function Home() {
  // 1. App State
  const [view, setView] = useState<ViewState>('GATE')
  const [isCheckingLoc, setIsCheckingLoc] = useState(true) // FIX #1: Prevent "Gate" flash
  const [coords, setCoords] = useState<{ lat: number; long: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  
  // 2. Data State
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<{deals: any[], venues: any[]}>({ deals: [], venues: [] })
  
  // 3. UI Filters
  const [activeTab, setActiveTab] = useState<TabState>('deals')
  const [activeFilter, setActiveFilter] = useState('Any cuisine')
  const [radius, setRadius] = useState(16093) // Default ~10 miles

  const CUISINES = ['Any cuisine', 'American', 'Barbecue', 'Chinese', 'French', 'Hamburger', 'Indian', 'Italian', 'Japanese', 'Mexican', 'Pizza', 'Seafood', 'Steak', 'Sushi', 'Thai', 'Wings', 'Cocktails', 'Coffee', 'Dessert']

  // --- INITIALIZATION (Fix #1: Handle Persistence Properly) ---
  useEffect(() => {
    const checkLocation = () => {
      const saved = localStorage.getItem('dealhunter_user_loc')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setCoords({ lat: parsed.lat, long: parsed.long })
          setLocationLabel(parsed.placeName)
          setView('FEED')
        } catch (e) { 
          localStorage.removeItem('dealhunter_user_loc') 
        }
      }
      setIsCheckingLoc(false) // Done checking, allow render
    }
    
    checkLocation()
  }, [])

  // --- FETCHING ---
  useEffect(() => {
    if (!coords) return
    async function fetchData() {
      setLoading(true)
      const [dealsRes, venuesRes] = await Promise.all([
        supabase.rpc('get_nearby_deals', { user_lat: coords?.lat, user_long: coords?.long, radius_meters: radius }),
        supabase.rpc('get_nearby_restaurants', { user_lat: coords?.lat, user_long: coords?.long, radius_meters: radius })
      ])
      console.log("DEBUG DEALS:", dealsRes);
console.log("DEBUG ERROR:", dealsRes.error);
      setItems({ deals: dealsRes.data || [], venues: venuesRes.data || [] })
      
      if ((dealsRes.data || []).length === 0 && (venuesRes.data || []).length > 0) {
        setActiveTab('venues')
      }
      setLoading(false)
    }
    fetchData()
  }, [coords, radius]) 

  // --- HANDLERS ---
  const handleResetLocation = () => {
    localStorage.removeItem('dealhunter_user_loc')
    setCoords(null)
    setView('GATE') 
  }

  const handleLocationSet = (c: { lat: number; long: number }, l: string) => {
    setCoords(c)
    setLocationLabel(l)
    setView('FEED')
    // Ensure persistence happens here or in the component
    localStorage.setItem('dealhunter_user_loc', JSON.stringify({ ...c, placeName: l }))
  }

  // --- RENDER GATES ---
  // 1. Loading Storage? Show Blank/Loader (Prevents Gate Flash)
  if (isCheckingLoc) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
  }

  // 2. No Location? Show Gate
  if (view === 'GATE') return <LocationGate onLocationResolved={handleLocationSet} />

  // --- FILTER LOGIC ---
  const filteredDeals = activeFilter === 'Any cuisine' 
    ? items.deals 
    : items.deals.filter(d => 
        JSON.stringify(d).toLowerCase().includes(activeFilter.toLowerCase())
      )

  const filteredVenues = activeFilter === 'Any cuisine' 
    ? items.venues 
    : items.venues.filter(v => 
        JSON.stringify(v).toLowerCase().includes(activeFilter.toLowerCase())
      )

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      <Navbar /> 

      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-3">
          
          {/* Top Row: Location & Radius */}
          <div className="flex items-center justify-between">
            <button 
              onClick={handleResetLocation}
              className="flex items-center gap-2 text-slate-800 font-bold hover:text-blue-600 transition group text-left"
            >
              <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors">
                 <MapPin size={16} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">Searching near</div>
                <div className="flex items-center gap-1">
                  <span className="truncate max-w-[150px] text-sm leading-tight">{locationLabel}</span>
                  <span className="text-xs text-blue-500 underline">(Change)</span>
                </div>
              </div>
            </button>

            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
               {[5, 10, 25].map(mi => (
                 <button
                   key={mi}
                   onClick={() => setRadius(mi * 1609)} 
                   className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${Math.round(radius/1609) === mi ? 'bg-white shadow-sm text-black ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {mi}mi
                 </button>
               ))}
            </div>
          </div>

          {/* Bottom Row: Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabState)} className="w-full md:w-auto shrink-0">
              <TabsList className="bg-slate-100 h-9 p-1 w-full md:w-auto">
                <TabsTrigger value="deals" className="px-4 text-xs h-7 flex-1">Deals ({filteredDeals.length})</TabsTrigger>
                <TabsTrigger value="venues" className="px-4 text-xs h-7 flex-1">Places ({filteredVenues.length})</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters (Fix #2: Removed Slice so all are visible) */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2 pb-1 mask-fade-right">
                {CUISINES.map(tag => ( // REMOVED .slice(0,6)
                  <button
                    key={tag}
                    onClick={() => setActiveFilter(tag)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      activeFilter === tag 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {/* MODAL TRIGGER */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 shrink-0">
                    <SlidersHorizontal size={14} className="text-slate-600" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter by Cuisine</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-2 py-4 max-h-[60vh] overflow-y-auto">
                    {CUISINES.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setActiveFilter(tag)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium border text-left flex justify-between items-center ${activeFilter === tag ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {tag}
                        {activeFilter === tag && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FEED */}
      <div className="max-w-5xl mx-auto px-4 py-6 min-h-[50vh]">
        {loading && <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>}

        {!loading && (
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="deals" className="mt-0">
              {filteredDeals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                  {filteredDeals.map(deal => (
                    <DealCard key={deal.deal_id} data={{...deal, dist_meters: deal.dist_meters}} />
                  ))}
                </div>
              ) : <EmptyState label={activeFilter} type="deals" onClear={() => setActiveFilter('Any cuisine')} />}
            </TabsContent>

            <TabsContent value="venues" className="mt-0">
              {filteredVenues.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
                  {filteredVenues.map(venue => (
                    <VenueCard key={venue.id} data={{...venue, dist_meters: venue.dist_meters}} />
                  ))}
                </div>
              ) : <EmptyState label={activeFilter} type="venues" onClear={() => setActiveFilter('Any cuisine')} />}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* OWNER SECTION */}
      <section className="bg-slate-50 border-y border-slate-200 py-12 px-4 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-black text-slate-900">Restaurant Owner?</h2>
            <p className="text-slate-600 max-w-lg">Join thousands of businesses promoting happy hours for free.</p>
            <div className="flex gap-4 justify-center md:justify-start">
              <Link href="/submit/search"> 
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6">
                  Add Your Deals for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-8 flex items-center justify-center gap-2">
           <HelpCircle className="text-slate-400" /> Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
           <AccordionItem value="item-1">
             <AccordionTrigger className="text-left font-bold">How can I find the best happy hours near me?</AccordionTrigger>
             <AccordionContent className="text-slate-600 leading-relaxed">
               Simply click the "Change" button on the location bar to enter your zip code. We'll show you all active deals in your area sorted by distance.
             </AccordionContent>
           </AccordionItem>
           <AccordionItem value="item-2">
             <AccordionTrigger className="text-left font-bold">I own a restaurant. How can I promote my deals?</AccordionTrigger>
             <AccordionContent className="text-slate-600 leading-relaxed">
               You can easily add your establishment's deals for free! Click the "Add Your Deals for Free" button above to begin advertising your specials instantly.
             </AccordionContent>
           </AccordionItem>
        </Accordion>
      </section>
    </main>
  )
}

function EmptyState({ label, type, onClear }: { label: string, type: string, onClear: () => void }) {
  return (
    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      <p className="text-slate-500 font-medium">No {type} matching "{label}" found.</p>
      {label !== 'Any cuisine' && (
         <Button variant="outline" onClick={onClear} className="mt-4">Clear Filters</Button>
      )}
    </div>
  )
}