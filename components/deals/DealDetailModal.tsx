'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Share2,
  ThumbsDown,
  ThumbsUp,
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

export default function DealDetailModal({
  deal,
  isOpen,
  onClose,
  onVote,
  voting = false,
}: DealDetailModalProps) {
  useEffect(() => {
    if (deal && isOpen) {
      trackDealView(deal.id, deal.restaurant_id, deal.title);
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

  const isTimeActive = isDealActive(deal);
  const isStatusActive = deal.status === 'active';
  const isActive = isTimeActive && isStatusActive;
  const hasUpvoted = deal.user_vote === 'up';
  const hasDownvoted = deal.user_vote === 'down';
  const hasDiscount = deal.discount_percentage && deal.discount_percentage > 0;

  const restaurantName = deal.restaurant_name || 'Unknown Restaurant';
  const cuisineType = deal.cuisine_type;
  const restaurantPhone = deal.phone;
  const restaurantWebsite = deal.website;
  const restaurantLat = deal.lat;
  const restaurantLng = deal.lng;
  const restaurantAddress = deal.address;
  const restaurantZipcode = deal.restaurant_zipcode;

  const handleVote = (type: VoteType) => {
    if (!voting) {
      onVote(deal.id, type);
    }
  };

  const handleGetDirections = () => {
    if (restaurantLat && restaurantLng) {
      trackDealClick(deal.id, 'directions');
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${restaurantLat},${restaurantLng}`,
        '_blank'
      );
    }
  };

  const handleCall = () => {
    if (restaurantPhone) {
      trackDealClick(deal.id, 'phone');
      window.location.href = `tel:${restaurantPhone}`;
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
        // Ignore cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="border-b border-black/6 bg-neutral-950 lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="flex h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 sm:h-[420px]">
            {deal.image_url ? (
              <img
                src={deal.image_url}
                alt={deal.title}
                className="max-h-full w-full rounded-[26px] object-contain shadow-[0_26px_60px_rgba(0,0,0,0.24)]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,#f8efe1,#d4a46e,#6f8b5b)] text-white">
                <div className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em]">
                  Deal image unavailable
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-6 py-5 text-white sm:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                isActive ? 'bg-emerald-400/18 text-emerald-200' : 'bg-white/10 text-white/72'
              }`}>
                {isActive ? 'Available now' : !isStatusActive ? 'Inactive' : 'Scheduled'}
              </span>
              {deal.status === 'pending' && (
                <span className="rounded-full bg-amber-400/18 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Pending approval
                </span>
              )}
            </div>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{deal.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">
              {deal.description || 'A curated local offer worth checking out.'}
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {(deal.original_price || deal.discounted_price) && (
            <div className="rounded-[26px] border border-emerald-200 bg-emerald-50/70 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Price
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                {deal.discounted_price && (
                  <span className="text-4xl font-semibold text-emerald-900">
                    ${Number(deal.discounted_price).toFixed(2)}
                  </span>
                )}
                {deal.original_price && (
                  <span className="text-lg text-neutral-400 line-through">
                    ${Number(deal.original_price).toFixed(2)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="rounded-full bg-neutral-950 px-3 py-1.5 text-sm font-semibold text-white">
                    Save {deal.discount_percentage}%
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="rounded-[24px] border border-black/8 bg-white/80 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-600">Was this deal useful?</p>
              <button
                onClick={handleShare}
                className="rounded-full border border-black/8 bg-white p-2.5 text-neutral-500 transition-all duration-150 hover:text-neutral-950"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                onClick={() => handleVote('up')}
                disabled={voting}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-medium transition-all duration-150 ${
                  hasUpvoted
                    ? 'bg-neutral-950 text-white shadow-[0_12px_22px_rgba(17,17,17,0.16)]'
                    : 'border border-black/8 bg-white text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-950'
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                Upvote
                <span className={`rounded-full px-2 py-0.5 text-xs ${hasUpvoted ? 'bg-white/12' : 'bg-black/[0.05]'}`}>
                  {deal.upvotes}
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                onClick={() => handleVote('down')}
                disabled={voting}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-medium transition-all duration-150 ${
                  hasDownvoted
                    ? 'bg-[#8f2d2d] text-white shadow-[0_12px_22px_rgba(143,45,45,0.16)]'
                    : 'border border-black/8 bg-white text-neutral-700 hover:bg-black/[0.04] hover:text-neutral-950'
                }`}
              >
                <ThumbsDown className={`h-4 w-4 ${hasDownvoted ? 'fill-current' : ''}`} />
                Downvote
                <span className={`rounded-full px-2 py-0.5 text-xs ${hasDownvoted ? 'bg-white/12' : 'bg-black/[0.05]'}`}>
                  {deal.downvotes}
                </span>
              </motion.button>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/8 bg-white/80 p-5">
            <h3 className="text-xl font-semibold text-neutral-950">Restaurant details</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-1 h-5 w-5 text-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-950">{restaurantName}</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">{restaurantAddress}</p>
                  <p className="text-sm text-neutral-400">{restaurantZipcode}</p>
                  {deal.distance_miles !== undefined && deal.distance_miles > 0 && (
                    <p className="mt-1 text-sm font-medium text-emerald-700">
                      {formatDistance(deal.distance_miles)} away
                    </p>
                  )}
                </div>
              </div>

              {restaurantPhone && (
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Phone className="h-4 w-4 text-neutral-400" />
                  <a href={`tel:${restaurantPhone}`} className="hover:text-neutral-950">
                    {restaurantPhone}
                  </a>
                </div>
              )}

              {restaurantWebsite && (
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Globe className="h-4 w-4 text-neutral-400" />
                  <a
                    href={restaurantWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-neutral-950"
                  >
                    Visit website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {cuisineType && (
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  <span className="capitalize">{cuisineType.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-black/8 bg-white/80 p-5">
            <h3 className="text-xl font-semibold text-neutral-950">Deal details</h3>
            <div className="mt-4 space-y-4 text-sm text-neutral-600">
              <div className="flex items-start gap-3 rounded-[18px] bg-black/[0.03] p-4">
                {isActive ? (
                  <>
                    <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-neutral-950">Available now</p>
                      <p className="mt-1 text-neutral-500">This offer is currently active.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-neutral-950">Check availability</p>
                      <p className="mt-1 text-neutral-500">This offer may be scheduled or temporarily inactive.</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-950">Available days</p>
                  <p className="mt-1 text-neutral-500">{formatDays(deal.days_available)}</p>
                </div>
              </div>

              {deal.coupon_code && (
                <div className="rounded-[20px] border border-dashed border-amber-300 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-700">Coupon code</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-amber-900">
                    {deal.coupon_code}
                  </p>
                </div>
              )}

              {deal.terms_conditions && (
                <div>
                  <p className="font-medium text-neutral-950">Terms and conditions</p>
                  <p className="mt-1 leading-7 text-neutral-500">{deal.terms_conditions}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleGetDirections}
              disabled={!restaurantLat || !restaurantLng}
              className="flex-1"
              size="lg"
            >
              <Navigation className="h-5 w-5" />
              Get directions
            </Button>

            {restaurantPhone && (
              <Button variant="outline" onClick={handleCall} className="flex-1" size="lg">
                <Phone className="h-5 w-5" />
                Call restaurant
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
