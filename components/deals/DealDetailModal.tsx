'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Tag,
  ExternalLink,
  Phone,
  Navigation,
  Calendar,
  Percent,
  Building2,
  Globe,
  Share2,
  X,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Deal, VoteType } from '@/types';
import { formatDistance, formatDays, isDealActive } from '@/lib/utils/location';
import { trackDealClick, trackDealView } from '@/lib/utils/analytics';
import { supabase } from '@/lib/db/supabase';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface DealDetailModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onVote: (dealId: string, voteType: VoteType) => void;
  voting?: boolean;
}

export default function DealDetailModal({ deal, isOpen, onClose, onVote, voting = false }: DealDetailModalProps) {
  useEffect(() => {
    if (deal && isOpen) {
      // Track view in analytics
      trackDealView(deal.id, deal.restaurant_id, deal.title);
      
      // Increment view count in database
      incrementViewCount(deal.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id, isOpen]);

  const incrementViewCount = async (dealId: string) => {
    try {
      await supabase.rpc('increment_deal_view', { deal_uuid: dealId });
    } catch (err) {
      console.error('Failed to increment view:', err);
    }
  };

  if (!deal) return null;

  // Check both time-based availability AND deal status
  const isTimeActive = isDealActive(deal);
  const isStatusActive = deal.status === 'active';
  const isActive = isTimeActive && isStatusActive;
  
  const hasUpvoted = deal.user_vote === 'up';
  const hasDownvoted = deal.user_vote === 'down';
  const hasDiscount = deal.discount_percentage && deal.discount_percentage > 0;
  
  // Get restaurant info from joined fields
  const restaurantName = deal.restaurant_name || 'Unknown Restaurant';
  const cuisineType = deal.cuisine_type;
  const restaurantPhone = deal.phone;
  const restaurantWebsite = deal.website;
  const restaurantLat = deal.lat;
  const restaurantLng = deal.lng;
  const restaurantAddress = deal.address;
  const restaurantZipcode = deal.restaurant_zipcode;

  const handleVote = (type: VoteType) => {
    if (voting) return;
    onVote(deal.id, type);
  };

  const handleGetDirections = () => {
    if (restaurantLat && restaurantLng) {
      trackDealClick(deal.id, 'directions');
      const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurantLat},${restaurantLng}`;
      window.open(url, '_blank');
    }
  };

  const handleCall = () => {
    if (restaurantPhone) {
      trackDealClick(deal.id, 'phone');
      window.location.href = `tel:${restaurantPhone}`;
    }
  };

  const handleWebsite = () => {
    if (restaurantWebsite) {
      trackDealClick(deal.id, 'website');
      window.open(restaurantWebsite, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          text: `Check out this deal at ${restaurantName}: ${deal.title}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-56 sm:h-64 bg-gray-100 overflow-hidden">
          {deal.image_url ? (
            <img
              src={deal.image_url}
              alt={deal.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50">
              <Building2 className="w-20 h-20 text-orange-200" />
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Status Badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${
              isActive 
                ? 'bg-green-500 text-white' 
                : !isStatusActive
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-500 text-white'
            }`}>
              {!isStatusActive ? '● Inactive' : isActive ? '● Active Now' : '○ Not Available'}
            </span>
            {deal.status === 'pending' && (
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg bg-yellow-500 text-white">
                ⏳ Pending Approval
              </span>
            )}
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {deal.title}
            </h2>
            <div className="flex items-center gap-2 text-white/90">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{restaurantName}</span>
              {cuisineType && (
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full capitalize">
                  {cuisineType.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price & Discount Section */}
          {(deal.original_price || deal.discounted_price) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <div className="flex items-baseline gap-3 flex-wrap">
                {deal.discounted_price && (
                  <span className="text-4xl font-bold text-[#138808]">
                    ${Number(deal.discounted_price).toFixed(2)}
                  </span>
                )}
                {deal.original_price && (
                  <span className="text-xl text-gray-400 line-through">
                    ${Number(deal.original_price).toFixed(2)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-[#FF9933] text-white text-sm font-bold rounded-full">
                    <Percent className="w-4 h-4" />
                    Save {deal.discount_percentage}%
                  </span>
                )}
              </div>
              {hasDiscount && deal.original_price && deal.discounted_price && (
                <p className="text-sm text-green-700 mt-2">
                  You save ${(deal.original_price - deal.discounted_price).toFixed(2)}!
                </p>
              )}
            </div>
          )}

          {/* Voting Section */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-gray-600">Was this helpful?</p>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleVote('up')}
                  disabled={voting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    hasUpvoted 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                      : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 shadow-sm'
                  }`}
                >
                  <ThumbsUp className={`w-5 h-5 ${hasUpvoted ? 'fill-current' : ''}`} />
                  <span>{deal.upvotes}</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleVote('down')}
                  disabled={voting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    hasDownvoted 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                      : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 shadow-sm'
                  }`}
                >
                  <ThumbsDown className={`w-5 h-5 ${hasDownvoted ? 'fill-current' : ''}`} />
                  <span>{deal.downvotes}</span>
                </motion.button>
              </div>
            </div>
            
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Restaurant Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF9933]" />
              Restaurant Details
            </h3>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{restaurantName}</p>
                  <p className="text-sm text-gray-500">{restaurantAddress}</p>
                  <p className="text-sm text-gray-400">{restaurantZipcode}</p>
                  {deal.distance_miles !== undefined && deal.distance_miles > 0 && (
                    <p className="text-sm text-[#138808] mt-1 font-medium">
                      {formatDistance(deal.distance_miles)} away
                    </p>
                  )}
                </div>
              </div>

              {restaurantPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a 
                    href={`tel:${restaurantPhone}`}
                    className="text-gray-600 hover:text-[#138808] transition-colors"
                  >
                    {restaurantPhone}
                  </a>
                </div>
              )}

              {restaurantWebsite && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <a 
                    href={restaurantWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-[#138808] transition-colors flex items-center gap-1"
                  >
                    Visit Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {cuisineType && (
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <span className="capitalize text-gray-600">
                    {cuisineType.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Deal Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#FF9933]" />
              Deal Details
            </h3>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              {/* Status Info */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {isActive ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Available Now</p>
                      <p className="text-sm text-gray-500">This deal is currently active</p>
                    </div>
                  </>
                ) : !isStatusActive ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Currently Inactive</p>
                      <p className="text-sm text-gray-500">This deal has been disabled by admin</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Not Available Now</p>
                      <p className="text-sm text-gray-500">Check available days below</p>
                    </div>
                  </>
                )}
              </div>

              {deal.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700">{deal.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Available Days</p>
                  <p className="text-gray-700">{formatDays(deal.days_available)}</p>
                </div>
              </div>

              {deal.coupon_code && (
                <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl p-4">
                  <p className="text-sm font-medium text-yellow-700 mb-1">Coupon Code</p>
                  <p className="text-2xl font-bold text-yellow-800 tracking-wider">
                    {deal.coupon_code}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Show this code when ordering
                  </p>
                </div>
              )}

              {deal.terms_conditions && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Terms & Conditions</p>
                  <p className="text-sm text-gray-600">{deal.terms_conditions}</p>
                </div>
              )}

              {deal.view_count > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    {deal.view_count} people viewed this deal
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleGetDirections}
              disabled={!restaurantLat || !restaurantLng}
              className="flex-1 flex items-center justify-center gap-2"
              size="lg"
            >
              <Navigation className="w-5 h-5" />
              Get Directions
            </Button>
            
            {restaurantPhone && (
              <Button
                variant="outline"
                onClick={handleCall}
                className="flex-1 flex items-center justify-center gap-2"
                size="lg"
              >
                <Phone className="w-5 h-5" />
                Call Restaurant
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
