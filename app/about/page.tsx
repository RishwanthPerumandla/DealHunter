'use client';

import { useEffect } from 'react';
import { Camera, MapPin, ThumbsUp, Sparkles } from 'lucide-react';
import { trackPageView } from '@/lib/utils/analytics';

const features = [
  {
    icon: Camera,
    title: 'Snap to Share',
    description: 'Take a photo of any menu or deal board and share it with the community.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: MapPin,
    title: 'Location Based',
    description: 'Find deals within 5 miles of your location. No more scrolling through irrelevant offers.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: ThumbsUp,
    title: 'Community Voted',
    description: 'Upvote the best deals and downvote expired ones. The community keeps content fresh.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Sparkles,
    title: 'Always Free',
    description: 'No sign-ups, no subscriptions. Just pure deal discovery powered by the community.',
    color: 'bg-purple-100 text-purple-600',
  },
];

export default function AboutPage() {
  useEffect(() => {
    trackPageView('/about', 'About');
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#FF9933] to-[#FF7700] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">About DesiDeals</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            We&apos;re building the most comprehensive, community-driven restaurant deal aggregator 
            focused on Indian and Desi cuisine in the USA.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 -mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Every day, thousands of restaurants run special deals that go unnoticed. At the same time, 
            hungry customers are paying full price, unaware of the amazing offers just around the corner.
          </p>
          <p className="text-gray-600 leading-relaxed">
            DesiDeals bridges this gap by creating a platform where anyone can share a deal they discover, 
            and everyone can benefit from the collective knowledge of the community. No more checking 
            multiple apps or websites – everything is here, sorted by what&apos;s closest to you.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white rounded-xl shadow-md p-6">
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-[#138808] to-[#0F6B06] rounded-2xl shadow-lg p-8 text-white">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-white/80 text-sm">Free to Use</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">5mi</div>
              <div className="text-white/80 text-sm">Search Radius</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">0</div>
              <div className="text-white/80 text-sm">Sign-ups Needed</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Discover Deals?</h2>
        <p className="text-gray-600 mb-6">
          Join thousands of food lovers sharing and discovering the best restaurant deals.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 bg-[#FF9933] text-white font-medium rounded-xl hover:bg-[#E88820] transition-colors"
        >
          Explore Deals
        </a>
      </div>
    </div>
  );
}
