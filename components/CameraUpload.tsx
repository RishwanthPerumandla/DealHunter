// components/CameraUpload.tsx
'use client'
import { Camera, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface CameraProps {
  onScanComplete: (data: any, file: File) => void
}

export default function CameraUpload({ onScanComplete }: CameraProps) {
  const [analyzing, setAnalyzing] = useState(false)

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Send to our Next.js API (Gemini)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.error) {
        alert("AI Error: " + data.error)
      } else {
        // Success: Pass both the JSON data AND the raw file to the page
        onScanComplete(data, file)
      }
    } catch (err) {
      console.error(err)
      alert("Upload failed. Check console.")
    } finally {
      setAnalyzing(false)
      // Reset input to allow scanning same file again
      e.target.value = '' 
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        id="camera-input"
        className="hidden"
        onChange={handleCapture}
        disabled={analyzing}
      />

      <label
        htmlFor="camera-input"
        className={`flex items-center justify-center w-16 h-16 rounded-full shadow-xl cursor-pointer transition-transform active:scale-95 ${
          analyzing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {analyzing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <Camera className="w-8 h-8 text-white" />
        )}
      </label>
    </div>
  )
}