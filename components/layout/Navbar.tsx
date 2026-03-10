'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trophy, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import GlobalSearch from './GlobalSearch'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)

  // Fetch User & Points on Mount
  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch Karma/Points from 'profiles' table
        const { data: profile } = await supabase
          .from('profiles')
          .select('karma')
          .eq('id', user.id)
          .single()
        
        if (profile) setPoints(profile.karma)
      }
    }
    getUserData()
  }, [])

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* 1. Logo */}
        <Link href="/" className="font-black text-xl tracking-tighter flex items-center shrink-0 text-slate-900">
          Deal<span className="text-blue-600">Hunter</span>
        </Link>

        {/* 2. Global Search (Hidden on tiny screens) */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
           <GlobalSearch />
        </div>

        {/* 3. Right Actions */}
        <div className="flex items-center gap-3 shrink-0">
          
          {user ? (
            // LOGGED IN STATE
            <>
              <Link href="/rewards">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition shadow-sm">
                  <Trophy size={14} className="text-yellow-600" />
                  <span>{points.toLocaleString()}</span>
                </div>
              </Link>

              <Link href="/submit/search">
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-9">
                  <Plus size={16} />
                  <span className="hidden sm:inline">Post Deal</span>
                </Button>
              </Link>

              <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-white shadow-sm">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                  {user.email?.slice(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            // LOGGED OUT STATE
            <>
              <Link href="/login">
                 <Button variant="ghost" size="sm" className="text-slate-600">Log In</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <LogIn size={16} /> Sign Up
                </Button>
              </Link>
            </>
          )}
          
        </div>
      </div>
    </nav>
  )
}