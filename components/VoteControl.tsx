'use client'
import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface VoteControlProps {
  dealId: string
  initialScore: number
  initialUserVote?: number
}

export default function VoteControl({ dealId, initialScore, initialUserVote = 0 }: VoteControlProps) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState(initialUserVote)
  const [loading, setLoading] = useState(false)

  // Sync state if props change (important for list virtualization or refetching)
  useEffect(() => {
    setScore(initialScore)
    setUserVote(initialUserVote)
  }, [initialScore, initialUserVote])

  const handleVote = async (val: number, e: React.MouseEvent) => {
    // CRITICAL: Stop event propagation immediately
    e.preventDefault()
    e.stopPropagation()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        alert("Please sign in to vote!")
        return
    }

    if (loading) return
    setLoading(true)
    
    const previousVote = userVote
    const previousScore = score
    let newVote = val
    if (userVote === val) newVote = 0

    // Optimistic Update
    const scoreChange = newVote - previousVote
    setUserVote(newVote)
    setScore(previousScore + scoreChange)

   try {
      if (newVote === 0) {
        // This delete matches the column names, so keep as is
        await supabase.from('votes').delete().match({ deal_id: dealId, user_id: user.id })
      } else {
        // UPDATE THIS SECTION:
        await supabase.rpc('cast_vote', { 
          _deal_id: dealId,  // <--- Added underscore
          _vote_val: newVote // <--- Added underscore
        })
      }
    } catch (err) {
      console.error("Vote failed:", err)
      // Rollback on error
      setUserVote(previousVote)
      setScore(previousScore)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="flex items-center bg-slate-100/80 border border-slate-200 rounded-full h-8 px-1 shadow-sm"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} // Double safety
    >
      <button 
        onClick={(e) => handleVote(1, e)}
        disabled={loading}
        className={cn(
          "h-6 w-6 flex items-center justify-center rounded-full transition-all active:scale-90",
          userVote === 1 ? "text-orange-600 bg-white shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
        )}
      >
        <ChevronUp size={16} strokeWidth={2.5} />
      </button>

      <span className={cn(
        "font-bold font-mono text-xs mx-2 min-w-[1.2rem] text-center select-none",
        userVote === 1 ? "text-orange-600" : userVote === -1 ? "text-blue-600" : "text-slate-600"
      )}>
        {score}
      </span>

      <button 
        onClick={(e) => handleVote(-1, e)}
        disabled={loading}
        className={cn(
          "h-6 w-6 flex items-center justify-center rounded-full transition-all active:scale-90",
          userVote === -1 ? "text-blue-600 bg-white shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
        )}
      >
        <ChevronDown size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}