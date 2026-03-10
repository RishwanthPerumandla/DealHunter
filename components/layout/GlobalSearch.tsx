'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Loader2, Utensils, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'

export default function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // Debounce input to wait 300ms before searching
  const debouncedQuery = useDebounce(query, 300)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 1. Search Effect
  useEffect(() => {
    async function fetchResults() {
      if (debouncedQuery.length < 2) {
        setResults([])
        return
      }

      setLoading(true)

      // Search Restaurants (Match name)
      const { data: venues } = await supabase
        .from('restaurants')
        .select('id, name, slug, city, cover_image_url')
        .ilike('name', `%${debouncedQuery}%`)
        .limit(3)

      // Search Active Deals (Match title)
      const { data: deals } = await supabase
        .from('deals')
        .select(`
          id, 
          title, 
          restaurant:restaurants(slug, name)
        `)
        .eq('status', 'active')
        .ilike('title', `%${debouncedQuery}%`)
        .limit(3)

      // Combine Results
      const combined = [
        ...(venues || []).map(v => ({ type: 'venue', ...v })),
        ...(deals || []).map(d => ({ type: 'deal', ...d }))
      ]

      setResults(combined)
      setLoading(false)
      setIsOpen(true)
    }

    fetchResults()
  }, [debouncedQuery])

  // 2. Click Outside to Close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef])

  // 3. Handle Selection
  const handleSelect = (item: any) => {
    setIsOpen(false)
    setQuery('') // Clear search
    if (item.type === 'venue') {
      router.push(`/venue/${item.slug}`)
    } else {
      // If it's a deal, go to the venue page too (maybe scroll to deal later)
      router.push(`/venue/${item.restaurant.slug}`) 
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md hidden md:block">
      {/* Input Field */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <Input 
          placeholder="Search 'Desi District' or 'Tacos'..." 
          className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-blue-500 transition-all focus:bg-white"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.length > 0) setIsOpen(true)
          }}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="p-2">
            <p className="text-[10px] uppercase font-bold text-gray-400 px-2 py-1">Best Matches</p>
            {results.map((item, i) => (
              <div 
                key={i}
                onClick={() => handleSelect(item)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                {/* Icon based on Type */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  item.type === 'venue' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {item.type === 'venue' ? <Utensils size={14} /> : <Tag size={14} />}
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {item.type === 'venue' ? item.name : item.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                     {item.type === 'venue' ? item.city : `at ${item.restaurant.name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {isOpen && query.length > 2 && !loading && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center z-50">
          <p className="text-sm text-gray-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  )
}