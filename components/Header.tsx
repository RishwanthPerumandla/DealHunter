'use client'
import { MapPin, Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  locationLabel: string
  onManualLocation: (zip: string) => Promise<boolean>
}

export default function Header({ locationLabel, onManualLocation }: HeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [zipInput, setZipInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onManualLocation(zipInput)
    if (success) {
      setIsExpanded(false)
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="font-bold text-xl tracking-tighter text-black flex items-center gap-2">
            DH<span className="text-blue-600">.</span>
          </div>

          {/* Location Trigger */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 transition px-3 py-1.5 rounded-full text-xs font-medium text-gray-800"
          >
            <MapPin size={12} className="text-blue-600" />
            <span className="max-w-[120px] truncate">{locationLabel}</span>
            <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {/* Dropdown / Location Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={() => setIsExpanded(false)}>
          <div 
            className="absolute top-14 left-0 right-0 bg-white border-b shadow-xl p-4 animate-in slide-in-from-top-2"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Change Location</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter Zip Code (e.g. 90210)" 
                className={`flex-1 bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-500 ring-red-100' : 'focus:ring-blue-100'}`}
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="bg-black text-white px-4 rounded-lg font-medium text-sm">
                Apply
              </button>
            </form>
            {error && <p className="text-xs text-red-500 mt-2">Invalid Zip Code. Try again.</p>}
          </div>
        </div>
      )}
    </>
  )
}