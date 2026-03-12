'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Tag,
  Phone,
  Navigation,
  ChevronRight,
  Flame,
  Percent,
  Calendar,
  Building2
} from 'lucide-react';
import { Deal, VoteType } from '@/types';
import { formatDistance, formatDays, isDealActive } from '@/lib/utils/location';
import { trackDealClick, trackDealView } from '@/lib/utils/analytics';

interface DealCardProps {
  deal: Deal;
  onVote: (dealId: string, voteType: VoteType) => void;
  onClick?: (deal: Deal) => void;
  voting?: boolean;
  featured?: boolean;
}

export default function DealCard({ deal, onVote, onClick, voting = false, featured = false }: DealCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check both time-based availability AND deal status
  const isTimeActive = isDealActive(deal);
  const isStatusActive = deal.status === 'active';
  const isActive = isTimeActive && isStatusActive;
  
  const hasUpvoted = deal.user_vote === 'up';
  const hasDownvoted = deal.user_vote === 'down';
  const hasDiscount = deal.discount_percentage && deal.discount_percentage > 0;
  const isHot = deal.score > 10;
  
  // Get restaurant info from joined fields
  const restaurantName = deal.restaurant_name || 'Unknown Restaurant';
  const cuisineType = deal.cuisine_type;
  const restaurantPhone = deal.phone;
  const restaurantLat = deal.lat;
  const restaurantLng = deal.lng;
  const restaurantAddress = deal.address;

  const handleVote = (e: React.MouseEvent, type: VoteType) => {
    e.stopPropagation();
    if (voting) return;
    onVote(deal.id, type);
  };

  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (restaurantLat && restaurantLng) {
      trackDealClick(deal.id, 'directions', restaurantName);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurantLat},${restaurantLng}`;
      window.open(url, '_blank');
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (restaurantPhone) {
      trackDealClick(deal.id, 'phone', restaurantName);
      window.location.href = `tel:${restaurantPhone}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick?.(deal)}
      className={`
        relative bg-white rounded-2xl overflow-hidden cursor-pointer
        transition-shadow duration-300
        ${featured ? 'ring-2 ring-[#FF9933] shadow-xl' : 'shadow-md hover:shadow-xl'}
        ${onClick ? 'active:scale-[0.99]' : ''}
        ${!isStatusActive ? 'opacity-75' : ''}
      `}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-gray-100">
          {deal.image_url && !imageError ? (
            <motion.img
              src={deal.image_url}
              alt={deal.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50">
              <Building2 className="w-16 h-16 text-orange-200" />
            </div>
          )}
          
          {/* Status Badge - Bottom Left */}
          <div className="absolute bottom-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg ${
              isActive 
                ? 'bg-green-500 text-white' 
                : !isStatusActive
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-500 text-white'
            }`}>
              {!isStatusActive ? '● Inactive' : isActive ? '● Active' : '○ Not Available'}
            </span>
          </div>

          {/* Discount Badge - Top Left (below Featured badge if present) */}
          {hasDiscount && (
            <div className={`absolute left-3 ${featured ? 'top-10' : 'top-3'}`}>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FF9933] text-white shadow-lg"
              >
                <Percent className="w-3 h-3" />
                {deal.discount_percentage}% OFF
              </motion.div>
            </div>
          )}

          {/* Hot Badge - Top Right */}
          {isHot && (
            <div className="absolute top-3 right-3 z-20">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg"
              >
                <Flame className="w-3 h-3" />
                HOT
              </motion.div>
            </div>
          )}

          {/* Featured Badge - Top Left (highest priority) */}
          {featured && (
            <div className="absolute top-0 left-0 z-20 px-3 py-1 bg-[#FF9933] text-white text-xs font-bold rounded-br-xl shadow-md">
              Near You
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                {deal.title}
              </h3>
              {onClick && (
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
              )}
            </div>
            
            {/* Restaurant Info */}
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#FF9933]" />
                {restaurantName}
              </p>
              {restaurantAddress && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {restaurantAddress}
                  {deal.distance_miles !== undefined && deal.distance_miles > 0 && (
                    <span className="text-green-600 font-medium">
                      • {formatDistance(deal.distance_miles)} away
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {cuisineType && (
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 rounded-full capitalize border border-orange-100">
                {cuisineType.replace('_', ' ')}
              </span>
            )}
            {deal.coupon_code && (
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-full border border-yellow-100">
                Code: {deal.coupon_code}
              </span>
            )}
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-full">
              <Calendar className="w-3 h-3" />
              {formatDays(deal.days_available)}
            </span>
          </div>

          {/* Price */}
          {(deal.original_price || deal.discounted_price) && (
            <div className="flex items-baseline gap-2 mb-3 flex-wrap">
              {deal.discounted_price && (
                <span className="text-2xl font-bold text-[#138808]">
                  ${Number(deal.discounted_price).toFixed(2)}
                </span>
              )}
              {deal.original_price && (
                <span className="text-sm text-gray-400 line-through">
                  ${Number(deal.original_price).toFixed(2)}
                </span>
              )}
              {hasDiscount && deal.original_price && deal.discounted_price && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Save ${(deal.original_price - deal.discounted_price).toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {/* Vote Buttons */}
            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleVote(e, 'up')}
                disabled={voting}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  hasUpvoted 
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-200' 
                    : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                <span>{deal.upvotes}</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleVote(e, 'down')}
                disabled={voting}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  hasDownvoted 
                    ? 'bg-red-100 text-red-700 ring-2 ring-red-200' 
                    : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <ThumbsDown className={`w-4 h-4 ${hasDownvoted ? 'fill-current' : ''}`} />
                <span>{deal.downvotes}</span>
              </motion.button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {restaurantPhone && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCall}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title="Call restaurant"
                >
                  <Phone className="w-4 h-4" />
                </motion.button>
              )}
              {restaurantLat && restaurantLng && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleGetDirections}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Get directions"
                >
                  <Navigation className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
