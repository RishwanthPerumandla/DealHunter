import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function AddDealCard() {
  return (
    <div className="bg-yellow-600 rounded-xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[280px] shadow-lg relative overflow-hidden group cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-700 opacity-100 group-hover:scale-105 transition-transform duration-500" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4 text-white backdrop-blur-sm">
          <Plus size={32} />
        </div>
        
        <h3 className="text-white font-bold text-lg mb-2">Know a great deal?</h3>
        <p className="text-yellow-100 text-sm mb-6 max-w-[200px]">
          Earn Karma Points and help the community by adding it!
        </p>
        
        <Link href="/submit/search">
          <button className="bg-white text-yellow-700 font-bold text-xs py-2 px-6 rounded-full hover:bg-yellow-50 transition shadow-md">
            Add It Now
          </button>
        </Link>
      </div>
    </div>
  )
}