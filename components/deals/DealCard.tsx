'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock3,
  Flame,
  MapPin,
  Navigation,
  Phone,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { Deal, VoteType } from '@/types';
import { formatDistance, formatDays, isDealActive } from '@/lib/utils/location';
import { trackDealClick } from '@/lib/utils/analytics';

interface DealCardProps {
  deal: Deal;
  onVote: (dealId: string, voteType: VoteType) => void;
  onClick?: (deal: Deal) => void;
  voting?: boolean;
  featured?: boolean;
}

export default function DealCard({
  deal,
  onVote,
  onClick,
  voting = false,
  featured = false,
}: DealCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isTimeActive = isDealActive(deal);
  const isStatusActive = deal.status === 'active';
  const isActive = isTimeActive && isStatusActive;

  const hasUpvoted = deal.user_vote === 'up';
  const hasDownvoted = deal.user_vote === 'down';
  const isHot = deal.score > 10;

  const restaurantName = deal.restaurant_name || 'Unknown Restaurant';
  const restaurantPhone = deal.phone;
  const restaurantLat = deal.lat;
  const restaurantLng = deal.lng;
  const restaurantAddress = deal.address;

  const primaryPrice = useMemo(() => {
    if (deal.discounted_price) return `$${Number(deal.discounted_price).toFixed(2)}`;
    if (deal.original_price) return `$${Number(deal.original_price).toFixed(2)}`;
    return null;
  }, [deal.discounted_price, deal.original_price]);

  const handleVote = (e: React.MouseEvent, type: VoteType) => {
    e.stopPropagation();
    if (!voting) {
      onVote(deal.id, type);
    }
  };

  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (restaurantLat && restaurantLng) {
      trackDealClick(deal.id, 'directions', restaurantName);
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${restaurantLat},${restaurantLng}`,
        '_blank'
      );
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
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick?.(deal)}
      className={`group cursor-pointer overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,238,0.96))] shadow-[0_20px_44px_rgba(15,23,42,0.08)] transition-all duration-200 ${
        featured
          ? 'border-[#d2a568]/55 shadow-[0_24px_48px_rgba(210,165,104,0.16)]'
          : 'border-black/6 hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)]'
      }`}
    >
      <div className="relative h-64 overflow-hidden sm:h-72">
        {deal.image_url && !imageError ? (
          <motion.img
            src={deal.image_url}
            alt={deal.title}
            onError={() => setImageError(true)}
            animate={{ scale: isHovered ? 1.035 : 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8efe1,#d4a46e,#6f8b5b)]">
            <div className="rounded-full border border-white/25 bg-white/15 px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              Curated offer
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/14 to-transparent" />

        <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
          {featured && (
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-950 shadow-[0_12px_24px_rgba(15,23,42,0.1)]">
              Near you
            </span>
          )}
          {isHot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#8f2d2d] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_24px_rgba(143,45,45,0.18)]">
              <Flame className="h-3.5 w-3.5" />
              Popular
            </span>
          )}
        </div>

        {primaryPrice && (
          <div className="absolute bottom-5 right-5 rounded-[20px] bg-neutral-950/86 px-4 py-3 text-right text-white shadow-[0_16px_30px_rgba(17,17,17,0.18)] backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
              Price
            </p>
            <p className="mt-1 text-2xl font-semibold">{primaryPrice}</p>
          </div>
        )}
      </div>

      <div className="space-y-5 p-6 font-sans">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {isActive ? 'Live now' : !isStatusActive ? 'Inactive' : 'Scheduled'}
            </div>
            <h3 className="mt-3 line-clamp-2 text-2xl font-semibold leading-tight text-neutral-950">
              {deal.title}
            </h3>
            <p className="mt-2 text-base font-medium text-neutral-800">{restaurantName}</p>
            {restaurantAddress && (
              <p className="mt-2 flex items-center gap-2 text-sm leading-6 text-neutral-500">
                <MapPin className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                <span className="line-clamp-2">{restaurantAddress}</span>
              </p>
            )}
          </div>
          <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>

        <div className="flex flex-wrap gap-2">
          {deal.cuisine_type && (
            <span className="rounded-full border border-black/8 bg-black/[0.03] px-3 py-1.5 text-xs font-medium capitalize text-neutral-600">
              {deal.cuisine_type.replace('_', ' ')}
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-neutral-600">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDays(deal.days_available)}
          </span>
          {deal.distance_miles !== undefined && deal.distance_miles > 0 && (
            <span className="rounded-full border border-black/8 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-neutral-600">
              {formatDistance(deal.distance_miles)}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-center gap-2 rounded-[22px] border border-black/8 bg-white/85 p-2 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.1 }}
              onClick={(e) => handleVote(e, 'up')}
              disabled={voting}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-medium transition-all duration-150 ${
                hasUpvoted
                  ? 'bg-neutral-950 text-white shadow-[0_12px_22px_rgba(17,17,17,0.16)]'
                  : 'text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-950'
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-current' : ''}`} />
              Upvote
              <span className={`rounded-full px-2 py-0.5 text-xs ${hasUpvoted ? 'bg-white/12' : 'bg-black/[0.05]'}`}>
                {deal.upvotes}
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.1 }}
              onClick={(e) => handleVote(e, 'down')}
              disabled={voting}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-medium transition-all duration-150 ${
                hasDownvoted
                  ? 'bg-[#8f2d2d] text-white shadow-[0_12px_22px_rgba(143,45,45,0.16)]'
                  : 'text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-950'
              }`}
            >
              <ThumbsDown className={`h-4 w-4 ${hasDownvoted ? 'fill-current' : ''}`} />
              Downvote
              <span className={`rounded-full px-2 py-0.5 text-xs ${hasDownvoted ? 'bg-white/12' : 'bg-black/[0.05]'}`}>
                {deal.downvotes}
              </span>
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            {restaurantPhone && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.12 }}
                onClick={handleCall}
                className="rounded-full border border-black/8 bg-white p-3 text-neutral-600 shadow-[0_12px_24px_rgba(15,23,42,0.05)] transition-all duration-150 hover:text-neutral-950"
                title="Call restaurant"
              >
                <Phone className="h-4 w-4" />
              </motion.button>
            )}
            {restaurantLat && restaurantLng && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.12 }}
                onClick={handleGetDirections}
                className="rounded-full border border-black/8 bg-white p-3 text-neutral-600 shadow-[0_12px_24px_rgba(15,23,42,0.05)] transition-all duration-150 hover:text-neutral-950"
                title="Directions"
              >
                <Navigation className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
