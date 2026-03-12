'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Deal } from '@/types';

export default function DebugPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllDeals();
  }, []);

  async function fetchAllDeals() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*, restaurant:restaurants(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  }

  async function approveDeal(dealId: string) {
    try {
      await supabase
        .from('deals')
        .update({ status: 'active' })
        .eq('id', dealId);
      fetchAllDeals();
    } catch (err) {
      alert('Failed to approve: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug: All Deals</h1>
        
        <div className="mb-4 flex gap-4">
          <button 
            onClick={fetchAllDeals}
            className="px-4 py-2 bg-[#FF9933] text-white rounded-lg hover:bg-[#E88820]"
          >
            Refresh
          </button>
          <a href="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Back to Home
          </a>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Total Deals: {deals.length}</h2>
          
          {deals.map((deal) => (
            <div key={deal.id} className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{deal.title}</h3>
                  <p className="text-gray-600">{deal.restaurant?.name}</p>
                  <p className="text-sm text-gray-500">
                    Status: 
                    <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                      deal.status === 'active' ? 'bg-green-100 text-green-700' :
                      deal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {deal.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Restaurant Coords: {deal.restaurant?.lat ? `${deal.restaurant.lat}, ${deal.restaurant.lng}` : 'MISSING (deal won\'t show in nearby search)'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Deal Type: {deal.deal_type} | Price: ${deal.discounted_price}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(deal.created_at).toLocaleString()}
                  </p>
                </div>
                
                {deal.status === 'pending' && (
                  <button
                    onClick={() => approveDeal(deal.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
