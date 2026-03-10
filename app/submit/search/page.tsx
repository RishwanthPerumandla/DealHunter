'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ChevronRight, Loader2, Plus, Store, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/useDebounce'

export default function SubmitSearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    async function searchVenues() {
      if (debouncedQuery.length < 2) {
        setResults([])
        return
      }

      setSearching(true)
      
      const { data } = await supabase
        .from('restaurants')
        .select('id, name, address, city')
        .ilike('name', `%${debouncedQuery}%`)
        .limit(10)
      
      setResults(data || [])
      setSearching(false)
    }

    searchVenues()
  }, [debouncedQuery])

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="-ml-2">
           <ArrowLeft size={20} className="text-slate-600" />
        </Button>
        <span className="font-bold text-slate-900">Find Venue</span>
      </div>
      
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-2">
             <Store size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Where's the deal?</h1>
          <p className="text-slate-500">Search for the restaurant or bar to get started.</p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6 shadow-sm">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <Input 
            placeholder="Search name (e.g. Chili's)..." 
            className="pl-12 h-12 text-lg bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all rounded-xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {searching && (
             <div className="absolute right-4 top-3.5">
               <Loader2 className="animate-spin text-blue-500" size={20} />
             </div>
          )}
        </div>

        {/* Results List */}
        <div className="space-y-3">
          
          {/* List Items */}
          {results.map((venue) => (
            <div 
              key={venue.id}
              onClick={() => router.push(`/submit/form?venue=${venue.id}&name=${encodeURIComponent(venue.name)}`)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {venue.name}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">
                    {venue.address}, {venue.city}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-blue-500 shrink-0" size={18} />
            </div>
          ))}

          {/* "Add Manually" Option (Only shows if typing) */}
          {!searching && query.length > 2 && (
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={() => router.push(`/submit/form?name=${encodeURIComponent(query)}&manual=true`)}
                className="w-full bg-slate-100 hover:bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 p-4 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 transition-all group"
              >
                <Plus size={18} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Not listed? Add "<span className="font-bold">{query}</span>" manually</span>
              </button>
            </div>
          )}

          {!searching && query.length < 2 && (
             <div className="text-center py-12 text-slate-400 text-sm">
                Start typing to find a place...
             </div>
          )}
        </div>
      </div>
    </div>
  )
}