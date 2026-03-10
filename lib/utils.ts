import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// NEW: Deterministic Pattern Generator
export function getPatternForVenue(name: string) {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600', 
    'from-orange-400 to-red-500',
    'from-green-400 to-emerald-600',
    'from-pink-400 to-rose-600'
  ];
  
  // Simple hash of string to pick a color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colorIndex = Math.abs(hash) % colors.length;
  return `bg-gradient-to-br ${colors[colorIndex]}`;
}