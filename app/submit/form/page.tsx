'use client'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Camera, ChevronLeft, Gift, X, CheckCircle2, Image as ImageIcon } from 'lucide-react'

export default function SubmitFormPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>}>
      <FormContent />
    </Suspense>
  )
}

function FormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Params
  const venueId = searchParams.get('venue')
  const initialName = searchParams.get('name') || ''
  const isManual = searchParams.get('manual') === 'true'

  // State
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    venueName: initialName,
    title: '',
    description: '',
    start_time: '16:00',
    end_time: '19:00',
    phone: ''
  })

  // Cleanup preview URL
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  // Phone Masking Logic (US Format)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // Strip non-digits
    if (value.length > 10) value = value.slice(0, 10)
    
    // Format: (123) 456-7890
    if (value.length > 6) {
      value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`
    } else if (value.length > 3) {
      value = `(${value.slice(0,3)}) ${value.slice(3)}`
    }
    
    setFormData(prev => ({ ...prev, phone: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleSubmit = async () => {
    if (!formData.title) return alert("Please enter a deal title")
    if (isManual && !formData.venueName) return alert("Please enter the venue name")
    
    setLoading(true)

    try {
      // 1. Upload Image
      let imageUrl = null
      if (file) {
        imageUrl = await uploadImage(file)
      }

      // 2. Handle Manual Venue Creation (If needed)
      let finalVenueId = venueId
      let finalVenueName = isManual ? formData.venueName : initialName

      if (isManual) {
        // Create a temporary unverified venue record
        const { data: newVenue, error: venueError } = await supabase
          .from('restaurants')
          .insert({
            name: formData.venueName,
            slug: formData.venueName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random()*1000),
            address: 'User Submitted',
            verified: false
          })
          .select()
          .single()
        
        if (venueError) throw venueError
        finalVenueId = newVenue.id
      }

      // 3. Create Deal
      const { error } = await supabase.from('deals').insert({
        restaurant_id: finalVenueId,
        restaurant_name: finalVenueName, // Redundant but useful for display if joined
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        days_active: [1,2,3,4,5,6,7],
        proof_image_url: imageUrl,
        status: 'active', 
        score: 0,
        contributor_phone: formData.phone.replace(/\D/g, '') // Save raw numbers
      })

      if (error) throw error

      setStep('success') // Show Success View

    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // --- SUCCESS VIEW ---
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
        <div className="bg-green-100 p-4 rounded-full mb-6 text-green-600 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Deal Posted!</h1>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto">
          Thanks for helping the community. {formData.phone ? 'Your reward points have been added.' : ''}
        </p>
        <Button 
          onClick={() => router.push('/')} 
          className="bg-slate-900 text-white w-full max-w-sm h-12 text-lg font-bold"
        >
          Return Home
        </Button>
      </div>
    )
  }

  // --- FORM VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ChevronLeft className="text-slate-600" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 truncate">
             {isManual ? 'New Place' : (initialName || 'New Deal')}
          </h1>
          {!isManual && <p className="text-xs text-slate-500">New Deal Submission</p>}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* MANUAL NAME INPUT (Only if manual mode) */}
        {isManual && (
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <Label className="text-blue-600">Restaurant Name</Label>
              <Input 
                 value={formData.venueName} 
                 onChange={e => setFormData({...formData, venueName: e.target.value})}
                 className="font-bold text-lg border-blue-100 bg-blue-50/50"
                 placeholder="e.g. Joe's Bar"
                 autoFocus
              />
           </div>
        )}

        {/* REWARDS CARD */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-center">
           <div className="bg-white p-2.5 rounded-full shadow-sm text-amber-500 shrink-0">
              <Gift size={20} />
           </div>
           <div className="flex-1">
             <Label className="text-amber-900 font-bold">Earn Reward Points</Label>
             <Input 
                placeholder="(555) 000-0000" 
                className="mt-1 bg-white border-amber-200 h-9"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={14}
             />
           </div>
        </div>

        {/* IMAGE UPLOAD (With Preview) */}
        <div className="space-y-2">
          <Label>Photo Proof (Optional)</Label>
          <div className="relative group">
            {previewUrl ? (
               <div className="relative h-48 w-full rounded-xl overflow-hidden border border-slate-200">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    onClick={() => { setFile(null); setPreviewUrl(null) }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
               </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition cursor-pointer h-40">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <div className="bg-slate-100 p-3 rounded-full mb-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <ImageIcon size={24} className="text-slate-400 group-hover:text-blue-500" />
                </div>
                <p className="text-sm font-medium text-slate-600">Tap to upload menu/deal</p>
              </label>
            )}
          </div>
        </div>

        {/* MAIN FORM */}
        <div className="space-y-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="space-y-2">
            <Label>Deal Title <span className="text-red-500">*</span></Label>
            <Input 
              placeholder="e.g. $2 Taco Tuesday" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="font-bold text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label>Details / Restrictions</Label>
            <Textarea 
              placeholder="e.g. Dine-in only, 5pm-8pm" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Starts</Label>
              <Input 
                type="time" 
                value={formData.start_time}
                onChange={e => setFormData({...formData, start_time: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Ends</Label>
              <Input 
                type="time" 
                value={formData.end_time}
                onChange={e => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-20 md:static md:bg-transparent md:border-0 md:p-0">
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.title} 
            className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {loading ? 'Posting...' : 'Post Deal'}
          </Button>
        </div>
        
        {/* Spacer for fixed bottom button on mobile */}
        <div className="h-20 md:hidden"></div>
      </div>
    </div>
  )
}