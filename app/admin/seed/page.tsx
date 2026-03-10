'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchRestaurantsFromOSM } from '@/lib/osm'
import { resolveZipCode } from '@/lib/geocoding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress' // Ensure you have this or use a simple div
import { Loader2, Database, AlertCircle, StopCircle, Play, CheckCircle2 } from 'lucide-react'

// Helper: Consistent slug generation
const createSlug = (name: string) => 
  name.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') 
    + '-' + Math.floor(Math.random() * 9999)

export default function SeedPage() {
  const [zip, setZip] = useState('')
  const [status, setStatus] = useState<'idle' | 'searching' | 'fetching' | 'processing' | 'done' | 'stopped'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  
  // Stats
  const [stats, setStats] = useState({ total: 0, imported: 0, skipped: 0 })

  // Ref to handle "Stop" signal without re-rendering issues
  const stopSignal = useRef(false)

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), msg]) // Keep only last 5 logs to save memory
  }

  const handleStop = () => {
    stopSignal.current = true
    addLog("🛑 Stopping... finishing current batch.")
  }

  const handleImport = async () => {
    // 1. Reset State
    stopSignal.current = false
    setStatus('searching')
    setLogs([])
    setStats({ total: 0, imported: 0, skipped: 0 })
    setProgress(0)
    
    // 2. Resolve Zip
    addLog(`📍 Resolving Zip: ${zip}...`)
    const geo = await resolveZipCode(zip)
    
    if (!geo) {
      addLog("❌ Invalid Zip Code.")
      setStatus('idle')
      return
    }
    
    addLog(`✅ Found ${geo.placeName}`)
    
    // 3. Fetch from OSM
    setStatus('fetching')
    addLog(`🌍 Querying OSM (15km radius)...`)
    
    // Note: We use the 15km radius as agreed earlier
    const osmVenues = await fetchRestaurantsFromOSM(geo.lat, geo.long, 15000)
    
    if (osmVenues.length === 0) {
      addLog("⚠️ No venues found in OSM.")
      setStatus('idle')
      return
    }
    
    // 4. Pre-fetch EXISTING venues in this Zip to handle duplicates LOCALLY
    // This turns 3000 DB calls into 1 DB call.
    addLog(`📦 Got ${osmVenues.length} raw venues. Checking duplicates...`)
    
    // Fetch names of restaurants that match this zip code (or fuzzy match)
    // Optimization: If DB is huge, this might need a better filter, but for <10k rows it's instant.
    const { data: existingData } = await supabase
      .from('restaurants')
      .select('name')
      .eq('zip_code', zip) // Filter by Zip to narrow down
    
    // Create a Set for O(1) lookup
    const existingSet = new Set(existingData?.map(r => r.name.toLowerCase()) || [])

    // Filter the OSM list in memory
    const uniqueVenues = osmVenues.filter(v => !existingSet.has(v.name.toLowerCase()))
    
    const skippedCount = osmVenues.length - uniqueVenues.length
    setStats(prev => ({ ...prev, total: uniqueVenues.length, skipped: skippedCount }))

    if (uniqueVenues.length === 0) {
      addLog(`✅ All ${osmVenues.length} venues already exist!`)
      setStatus('done')
      setProgress(100)
      return
    }

    // 5. Batch Insert (The Speed Fix)
    setStatus('processing')
    const BATCH_SIZE = 50
    let importedCount = 0

    // Loop through in chunks
    for (let i = 0; i < uniqueVenues.length; i += BATCH_SIZE) {
      // CHECK STOP SIGNAL
      if (stopSignal.current) {
        setStatus('stopped')
        addLog(`⛔ Import stopped by user.`)
        break
      }

      const batch = uniqueVenues.slice(i, i + BATCH_SIZE)

      // Transform data for Supabase
      const insertPayload = batch.map(venue => ({
        name: venue.name,
        slug: createSlug(venue.name),
        location: `POINT(${venue.lon} ${venue.lat})`,
        address: `${venue.housenumber || ''} ${venue.street || ''}`.trim() || 'Address not listed',
        city: venue.city || geo.placeName.split(',')[0],
        zip_code: zip,
        verified: false
      }))

      // Single Insert for 50 rows
      const { error } = await supabase.from('restaurants').insert(insertPayload)

      if (error) {
        console.error("Batch Error:", error)
        addLog(`❌ Batch failed: ${error.message}`)
      } else {
        importedCount += batch.length
        setStats(prev => ({ ...prev, imported: importedCount }))
        setProgress(Math.round((importedCount / uniqueVenues.length) * 100))
        addLog(`🚀 Inserted ${importedCount} / ${uniqueVenues.length}`)
      }
    }

    if (!stopSignal.current) {
      setStatus('done')
      addLog(`🎉 COMPLETE! Imported ${importedCount} venues.`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Database className="text-blue-600" />
            Database Seeder <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">PRO</span>
          </h1>
          <p className="text-gray-500">Bulk import with duplicate prevention & batching.</p>
        </div>

        <Card className="p-6 space-y-6">
          {/* Controls */}
          <div className="flex gap-4">
            <Input 
              placeholder="Target Zip (e.g. 78701)" 
              value={zip}
              onChange={e => setZip(e.target.value)}
              className="font-mono text-lg h-12"
              disabled={status === 'processing' || status === 'fetching'}
            />
            
            {status === 'processing' || status === 'fetching' ? (
              <Button 
                onClick={handleStop} 
                variant="destructive"
                className="w-32 h-12 gap-2"
              >
                <StopCircle size={18} /> Stop
              </Button>
            ) : (
              <Button 
                onClick={handleImport} 
                className="bg-black w-32 h-12 gap-2"
              >
                <Play size={18} /> Start
              </Button>
            )}
          </div>

          {/* Progress Bar (Visual Feedback) */}
          {(status === 'processing' || status === 'done' || status === 'stopped') && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${status === 'stopped' ? 'bg-red-500' : 'bg-green-500'}`} 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-black text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-400 font-bold uppercase">To Import</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-black text-green-600">{stats.imported}</div>
              <div className="text-xs text-green-400 font-bold uppercase">Imported</div>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-black text-gray-600">{stats.skipped}</div>
              <div className="text-xs text-gray-400 font-bold uppercase">Skipped</div>
            </div>
          </div>

          {/* Console Output */}
          <div className="bg-black rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs text-green-400 shadow-inner flex flex-col-reverse">
             {logs.length === 0 && <span className="text-gray-600 italic">Ready for command...</span>}
             {logs.map((log, i) => (
               <div key={i} className="mb-1 border-b border-white/10 pb-1 last:border-0">{log}</div>
             ))}
          </div>

          {/* Success Banner */}
          {status === 'done' && (
             <div className="flex items-center gap-3 bg-green-100 border border-green-200 text-green-800 p-3 rounded-lg text-sm font-medium">
                <CheckCircle2 className="text-green-600" />
                <span>Import Complete. Database is ready.</span>
             </div>
          )}
          {status === 'stopped' && (
             <div className="flex items-center gap-3 bg-red-100 border border-red-200 text-red-800 p-3 rounded-lg text-sm font-medium">
                <AlertCircle className="text-red-600" />
                <span>Import manually stopped by user.</span>
             </div>
          )}
        </Card>
      </div>
    </div>
  )
}