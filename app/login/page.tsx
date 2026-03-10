'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Mail, Smartphone, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // State: 'email' | 'verify'
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  
  // Form Data
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  // 1. Send the Code (Magic Link / OTP)
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      if (authMethod === 'email') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            // This forces Supabase to send a code, not just a link
            shouldCreateUser: true, 
          }
        })
        if (error) throw error
        setSuccessMsg(`Code sent to ${email}`)
      } 
      else {
        // PHONE AUTH (Requires Twilio/MessageBird set up in Supabase Dashboard)
        const { error } = await supabase.auth.signInWithOtp({
          phone,
        })
        if (error) throw error
        setSuccessMsg(`Code sent to ${phone}`)
      }

      setStep('verify') // Move to next screen

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Verify the Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: authMethod === 'email' ? email : undefined,
        phone: authMethod === 'phone' ? phone : undefined,
        token: otp,
        type: authMethod === 'email' ? 'email' : 'sms',
      })

      if (error) throw error

      // Success!
      router.push('/')
      router.refresh()

    } catch (err: any) {
      setError("Invalid code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      <Link href="/" className="absolute top-8 left-8 text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-bold transition-colors">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {step === 'input' ? 'Welcome' : 'Verify Identity'}
          </h1>
          <p className="text-slate-500">
            {step === 'input' 
              ? 'Enter your details to sign in or create an account.' 
              : `Enter the 6-digit code sent to ${authMethod === 'email' ? email : phone}`
            }
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
          
          {/* STEP 1: ENTER EMAIL OR PHONE */}
          {step === 'input' && (
            <Tabs defaultValue="email" onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="gap-2"><Mail size={16}/> Email</TabsTrigger>
                <TabsTrigger value="phone" className="gap-2"><Smartphone size={16}/> Phone</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSendCode} className="space-y-4">
                <TabsContent value="email" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-12 text-lg"
                      required 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="h-12 text-lg"
                      required 
                    />
                    <p className="text-xs text-slate-400">Standard message rates may apply.</p>
                  </div>
                </TabsContent>

                {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg font-medium">{error}</div>}

                <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                  Send Code
                </Button>
              </form>
            </Tabs>
          )}

          {/* STEP 2: VERIFY CODE */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in slide-in-from-right-8">
              
              {successMsg && (
                <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg font-medium flex items-center gap-2">
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              <div className="space-y-2">
                <Label>One-Time Code</Label>
                <Input 
                  type="text" 
                  placeholder="123456" 
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,8))}
                  className="h-14 text-center text-3xl font-mono tracking-widest"
                  autoFocus
                  required 
                />
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg font-medium">{error}</div>}

              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Verify & Login
              </Button>

              <button 
                type="button"
                onClick={() => setStep('input')} 
                className="w-full text-center text-sm text-slate-500 hover:text-slate-800 underline"
              >
                Wrong number? Go back.
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}