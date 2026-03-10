'use client'
import { useState } from 'react'
import { ArrowBigUp, ArrowBigDown, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VotingProps {
  dealId: string
  initialScore: number
}

export default function DealVoting({ dealId, initialScore }: VotingProps) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0) // 0 = no vote
  const [loading, setLoading] = useState(false)

  const handleVote = async (val: 1 | -1) => {
    if (loading) return
    
    // 1. Optimistic Update (Instant Feedback)
    const newVote = userVote === val ? 0 : val // Toggle off if clicked again
    const diff = newVote - userVote
    setScore(prev => prev + diff)
    setUserVote(newVote)
    
    setLoading(true)

    // 2. Database Sync
    // Note: In a real app, we need the user's ID. 
    // For this demo, we'll try to insert. If RLS fails (no auth), we revert.
    try {
      if (newVote === 0) {
        // Remove vote
        await supabase.from('votes').delete().eq('deal_id', dealId) // This assumes we can find the row by user_id implicitly via RLS
      } else {
        // Upsert vote
        // We really need a user_id here. If you are not logged in, this might fail depending on your RLS.
        // For MVP: We just simulate the visual success if auth is missing.
        const { error } = await supabase.from('votes').upsert({
          deal_id: dealId,
          vote_val: newVote
        })
        if (error) throw error
      }
    } catch (err) {
      console.error("Voting failed:", err)
      // Revert on error
      setScore(prev => prev - diff)
      setUserVote(userVote)
      alert("You must be logged in to vote!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 bg-gray-50 p-2 rounded-lg border">
      <Button 
        variant="ghost" 
        size="sm" 
        className={cn("h-8 w-8 p-0 hover:bg-green-100", userVote === 1 && "text-green-600 bg-green-50")}
        onClick={() => handleVote(1)}
      >
        <ArrowBigUp size={24} className={cn("fill-current", userVote === 1 && "fill-green-600")} />
      </Button>

      <span className={cn("font-bold text-sm", 
        score > 0 ? "text-green-600" : score < 0 ? "text-red-500" : "text-gray-600"
      )}>
        {loading ? <Loader2 size={12} className="animate-spin" /> : score}
      </span>

      <Button 
        variant="ghost" 
        size="sm" 
        className={cn("h-8 w-8 p-0 hover:bg-red-100", userVote === -1 && "text-red-600 bg-red-50")}
        onClick={() => handleVote(-1)}
      >
        <ArrowBigDown size={24} className={cn("fill-current", userVote === -1 && "fill-red-600")} />
      </Button>
    </div>
  )
}