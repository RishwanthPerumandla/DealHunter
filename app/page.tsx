'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import DealList from '@/components/deals/DealList';
import { trackPageView } from '@/lib/utils/analytics';

export default function Home() {
  useEffect(() => {
    trackPageView('/', 'Home');
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Hero Section - Simplified */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-[#FF9933] via-[#FFB366] to-[#FF7700] text-white"
      >
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-bold mb-2"
            >
              Find Best Food Deals
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/90 text-sm sm:text-base"
            >
              Indian, Desi & International Cuisine Near You
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Deals Feed */}
      <DealList />
    </div>
  );
}
