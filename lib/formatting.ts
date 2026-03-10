// lib/formatting.ts

export const metersToMiles = (meters: number): string => {
  // 1609.34 meters = 1 mile
  return (meters * 0.000621371).toFixed(1) + ' mi'
}

export const formatTime = (timeStr: string | null): string => {
  if (!timeStr) return ''
  // Handles "16:00:00" -> "4:00 PM"
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${suffix}`
}