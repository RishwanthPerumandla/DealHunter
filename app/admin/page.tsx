'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Check,
  X,
  Lock,
  Building2,
  Tag,
  MapPin,
  Eye,
  Phone,
  Globe,
  Edit3,
  Power,
  Trash2,
  RefreshCw,
  Save,
  Filter,
  MousePointer,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/db/supabase';
import { getDailyAnalytics, getConversionFunnel, getLocationMetrics } from '@/lib/utils/analytics';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import AdminRestaurantManager from '@/components/admin/AdminRestaurantManager';
import AdminDealManager from '@/components/admin/AdminDealManager';
import { Deal, Restaurant, CuisineType, DealType } from '@/types';

const ADMIN_SECRET = 'desideals2024';

interface Stats {
  totalDeals: number;
  activeDeals: number;
  pendingDeals: number;
  totalVotes: number;
  uniqueUsers: number;
  totalRestaurants: number;
  totalViews: number;
}

interface RestaurantWithStats extends Restaurant {
  deal_count?: number;
  total_views?: number;
}

const cuisineOptions = [
  { value: 'indian', label: 'Indian' },
  { value: 'desi', label: 'Desi/Street Food' },
  { value: 'continental', label: 'Continental' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'other', label: 'Other' },
];

const dealTypeOptions = [
  { value: 'percentage_off', label: 'Percentage Off' },
  { value: 'fixed_price', label: 'Fixed Price Deal' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'free_item', label: 'Free Item' },
  { value: 'combo', label: 'Combo Deal' },
  { value: 'buffet_special', label: 'Buffet Special' },
];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'restaurants' | 'deals' | 'analytics'>('overview');
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<unknown[]>([]);
  const [funnelData, setFunnelData] = useState<{
    uniqueUsers: number;
    dealViews: number;
    dealClicks: number;
    votes: number;
    submissions: number;
    viewToClickRate: string;
    clickToVoteRate: string;
    voteToSubmitRate: string;
  } | null>(null);
  const [locationMetrics, setLocationMetrics] = useState<{
    zipcode: string;
    views: number;
    clicks: number;
    sessions: number;
    engagementRate: string;
  }[]>([]);
  const [pendingDeals, setPendingDeals] = useState<Deal[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantWithStats[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit modals state
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('desideals_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (secretCode === ADMIN_SECRET) {
      setIsAuthenticated(true);
      sessionStorage.setItem('desideals_admin_auth', 'true');
      setAuthError('');
      loadAllData();
    } else {
      setAuthError('Invalid secret code');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadAnalytics(),
        loadPendingDeals(),
        loadRestaurants(),
        loadAllDeals()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [{ count: totalDeals }, { count: activeDeals }, { count: pendingDeals }, 
             { count: totalVotes }, { count: uniqueUsers }, { count: totalRestaurants }] = await Promise.all([
        supabase.from('deals').select('*', { count: 'exact', head: true }),
        supabase.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
        supabase.from('user_fingerprints').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true })
      ]);

      const { data: viewData } = await supabase.from('deals').select('view_count');
      const totalViews = viewData?.reduce((sum, d) => sum + (d.view_count || 0), 0) || 0;

      setStats({
        totalDeals: totalDeals || 0,
        activeDeals: activeDeals || 0,
        pendingDeals: pendingDeals || 0,
        totalVotes: totalVotes || 0,
        uniqueUsers: uniqueUsers || 0,
        totalRestaurants: totalRestaurants || 0,
        totalViews
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [dailyData, funnel, locations] = await Promise.all([
        getDailyAnalytics(7),
        getConversionFunnel(7),
        getLocationMetrics(7),
      ]);
      setAnalytics(dailyData);
      setFunnelData(funnel);
      setLocationMetrics(locations || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadPendingDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*, restaurant:restaurants(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingDeals(data || []);
    } catch (error) {
      console.error('Error loading pending deals:', error);
    }
  };

  const loadRestaurants = async () => {
    try {
      const { data: restaurantsData, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const restaurantsWithStats = await Promise.all(
        (restaurantsData || []).map(async (restaurant) => {
          const { count: dealCount } = await supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurant.id);
          
          const { data: dealsData } = await supabase
            .from('deals')
            .select('view_count')
            .eq('restaurant_id', restaurant.id);
          
          const totalViews = dealsData?.reduce((sum, d) => sum + (d.view_count || 0), 0) || 0;

          return { ...restaurant, deal_count: dealCount || 0, total_views: totalViews };
        })
      );

      setRestaurants(restaurantsWithStats);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  const loadAllDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*, restaurant:restaurants(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };

  const approveDeal = async (dealId: string) => {
    setProcessingId(dealId);
    try {
      await supabase.from('deals').update({ status: 'active' }).eq('id', dealId);
      await loadPendingDeals();
      await loadAllDeals();
      await loadStats();
    } catch (error) {
      console.error('Error approving deal:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectDeal = async (dealId: string) => {
    setProcessingId(dealId);
    try {
      await supabase.from('deals').update({ status: 'flagged' }).eq('id', dealId);
      await loadPendingDeals();
      await loadAllDeals();
      await loadStats();
    } catch (error) {
      console.error('Error rejecting deal:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleDealStatus = async (dealId: string, currentStatus: string) => {
    setProcessingId(dealId);
    try {
      const newStatus = currentStatus === 'active' ? 'expired' : 'active';
      await supabase.from('deals').update({ status: newStatus }).eq('id', dealId);
      await loadAllDeals();
      await loadStats();
    } catch (error) {
      console.error('Error toggling deal status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const deleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    setProcessingId(dealId);
    try {
      await supabase.from('deals').delete().eq('id', dealId);
      await loadAllDeals();
      await loadStats();
    } catch (error) {
      console.error('Error deleting deal:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const updateRestaurant = async (restaurant: Restaurant) => {
    try {
      await supabase
        .from('restaurants')
        .update({
          name: restaurant.name,
          cuisine_type: restaurant.cuisine_type,
          address: restaurant.address,
          zipcode: restaurant.zipcode,
          phone: restaurant.phone,
          website: restaurant.website,
          lat: restaurant.lat,
          lng: restaurant.lng,
          verified: restaurant.verified,
        })
        .eq('id', restaurant.id);
      
      setEditingRestaurant(null);
      await loadRestaurants();
    } catch (error) {
      console.error('Error updating restaurant:', error);
    }
  };

  const updateDeal = async (deal: Deal) => {
    try {
      await supabase
        .from('deals')
        .update({
          title: deal.title,
          description: deal.description,
          deal_type: deal.deal_type,
          original_price: deal.original_price,
          discounted_price: deal.discounted_price,
          days_available: deal.days_available,
          terms_conditions: deal.terms_conditions,
          coupon_code: deal.coupon_code,
          status: deal.status,
        })
        .eq('id', deal.id);
      
      setEditingDeal(null);
      await loadAllDeals();
      await loadStats();
    } catch (error) {
      console.error('Error updating deal:', error);
    }
  };

  const deleteRestaurant = async (restaurantId: string) => {
    if (!confirm('Are you sure? This will also delete all deals for this restaurant.')) return;
    try {
      await supabase.from('restaurants').delete().eq('id', restaurantId);
      await loadRestaurants();
      await loadAllDeals();
      await loadStats();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#FF9933] to-[#FF7700] rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-gray-500 mt-2">Enter the secret code to access the admin panel</p>
          </div>
          <div className="space-y-4">
            <Input type="password" label="Secret Code" placeholder="Enter admin code" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            {authError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{authError}</p>}
            <Button onClick={handleLogin} fullWidth>Access Admin Panel</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <nav className="hidden md:flex items-center gap-1">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'restaurants', label: 'Restaurants', icon: Building2 },
                  { id: 'deals', label: 'Deals', icon: Tag },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id ? 'bg-[#FF9933] text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadAllData} className="hidden sm:flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => { sessionStorage.removeItem('desideals_admin_auth'); setIsAuthenticated(false); }}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <StatCard icon={Building2} label="Restaurants" value={stats.totalRestaurants} color="bg-blue-100 text-blue-600" />
                <StatCard icon={Tag} label="Total Deals" value={stats.totalDeals} color="bg-purple-100 text-purple-600" />
                <StatCard icon={CheckCircle} label="Active" value={stats.activeDeals} color="bg-green-100 text-green-600" />
                <StatCard icon={AlertTriangle} label="Pending" value={stats.pendingDeals} color="bg-yellow-100 text-yellow-600" />
                <StatCard icon={Eye} label="Views" value={stats.totalViews} color="bg-cyan-100 text-cyan-600" />
                <StatCard icon={TrendingUp} label="Votes" value={stats.totalVotes} color="bg-pink-100 text-pink-600" />
                <StatCard icon={Users} label="Users" value={stats.uniqueUsers} color="bg-orange-100 text-orange-600" />
              </div>
            )}

            {/* Pending Deals */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Pending Approval
                    {pendingDeals.length > 0 && <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-sm rounded-full">{pendingDeals.length}</span>}
                  </h2>
                  <p className="text-sm text-gray-500">Review and approve user-submitted deals</p>
                </div>
              </div>

              {pendingDeals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>No pending deals to approve!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDeals.map((deal) => (
                    <DealListItem key={deal.id} deal={deal} processingId={processingId} onApprove={approveDeal} onReject={rejectDeal} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <AdminRestaurantManager onRestaurantCreated={loadRestaurants} />
              <AdminDealManager onDealCreated={loadAllDeals} />
            </div>
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Restaurants</h2>
              <Button onClick={() => setActiveTab('overview')}>+ Add Restaurant</Button>
            </div>
            <div className="space-y-4">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="border border-gray-200 rounded-xl p-4 hover:border-[#FF9933] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                        {restaurant.verified && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Verified</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{restaurant.address}, {restaurant.zipcode}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Tag className="w-4 h-4" />{restaurant.deal_count} deals</span>
                        <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{restaurant.total_views} views</span>
                        <span className="capitalize">{restaurant.cuisine_type?.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingRestaurant(restaurant)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => deleteRestaurant(restaurant.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deals Tab */}
        {activeTab === 'deals' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Deals</h2>
              <Button onClick={() => setActiveTab('overview')}>+ Add Deal</Button>
            </div>
            <div className="space-y-4">
              {allDeals.map((deal) => (
                <div key={deal.id} className={`border rounded-xl p-4 transition-colors ${deal.status === 'active' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {deal.image_url ? (
                        <img src={deal.image_url} alt={deal.title} className="w-20 h-20 object-cover rounded-lg" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center"><Tag className="w-8 h-8 text-gray-300" /></div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            deal.status === 'active' ? 'bg-green-100 text-green-700' :
                            deal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{deal.status}</span>
                        </div>
                        <p className="text-sm text-gray-500">{deal.restaurant_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" />{deal.upvotes - deal.downvotes} score</span>
                          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{deal.view_count} views</span>
                          {(deal.discount_percentage || 0) > 0 && <span className="text-[#FF9933] font-medium">{deal.discount_percentage}% off</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingDeal(deal)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <button onClick={() => toggleDealStatus(deal.id, deal.status)} disabled={processingId === deal.id} className={`p-2 rounded-lg transition-colors ${deal.status === 'active' ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'}`} title={deal.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <Power className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteDeal(deal.id)} disabled={processingId === deal.id} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Conversion Funnel */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel (Last 7 Days)</h2>
              {funnelData ? (
                <div className="space-y-4">
                  {/* Funnel Steps */}
                  <div className="grid grid-cols-5 gap-4">
                    <FunnelStep 
                      label="Unique Users" 
                      value={funnelData.uniqueUsers} 
                      color="bg-blue-500"
                      icon={Users}
                    />
                    <FunnelStep 
                      label="Deal Views" 
                      value={funnelData.dealViews} 
                      color="bg-purple-500"
                      icon={Eye}
                    />
                    <FunnelStep 
                      label="Deal Clicks" 
                      value={funnelData.dealClicks} 
                      color="bg-orange-500"
                      icon={Globe}
                    />
                    <FunnelStep 
                      label="Votes" 
                      value={funnelData.votes} 
                      color="bg-green-500"
                      icon={CheckCircle}
                    />
                    <FunnelStep 
                      label="Submissions" 
                      value={funnelData.submissions} 
                      color="bg-pink-500"
                      icon={Tag}
                    />
                  </div>
                  
                  {/* Conversion Rates */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                    <ConversionRate label="View → Click" value={funnelData.viewToClickRate} />
                    <ConversionRate label="Click → Vote" value={funnelData.clickToVoteRate} />
                    <ConversionRate label="Vote → Submit" value={funnelData.voteToSubmitRate} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No funnel data available yet.</div>
              )}
            </div>

            {/* Location Engagement */}
            {locationMetrics.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Locations by Engagement</h2>
                <div className="space-y-2">
                  {locationMetrics.map((loc, i) => (
                    <div key={loc.zipcode} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400 w-6">#{i + 1}</span>
                        <div>
                          <span className="font-medium text-gray-900">{loc.zipcode}</span>
                          <span className="text-xs text-gray-400 ml-2">{loc.sessions} sessions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{loc.views} views</span>
                        <span className="text-gray-500">{loc.clicks} clicks</span>
                        <span className={`font-medium ${parseFloat(loc.engagementRate) > 20 ? 'text-green-600' : 'text-[#FF9933]'}`}>
                          {loc.engagementRate}% engagement
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Analytics */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Event Analytics (Last 7 Days)</h2>
              {analytics.length > 0 ? (
                <div className="space-y-2">
                  {analytics.slice(0, 20).map((event: any, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                        <span className="text-xs text-gray-400 ml-2">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{event.unique_users} users</span>
                        <span className="font-medium text-[#FF9933]">{event.event_count} events</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No analytics data available yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Restaurant Modal */}
      {editingRestaurant && (
        <EditRestaurantModal
          restaurant={editingRestaurant}
          isOpen={!!editingRestaurant}
          onClose={() => setEditingRestaurant(null)}
          onSave={updateRestaurant}
        />
      )}

      {/* Edit Deal Modal */}
      {editingDeal && (
        <EditDealModal
          deal={editingDeal}
          isOpen={!!editingDeal}
          onClose={() => setEditingDeal(null)}
          onSave={updateDeal}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-md p-4">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}><Icon className="w-5 h-5" /></div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </motion.div>
  );
}

function DealListItem({ deal, processingId, onApprove, onReject }: { deal: Deal; processingId: string | null; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-[#FF9933] transition-colors">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex gap-4">
          {deal.image_url ? <img src={deal.image_url} alt={deal.title} className="w-20 h-20 object-cover rounded-lg" /> : <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center"><span className="text-2xl">🍽️</span></div>}
          <div>
            <h3 className="font-semibold text-gray-900">{deal.title}</h3>
            <p className="text-sm text-gray-500">{deal.restaurant_name}</p>
            <p className="text-xs text-gray-400 mt-1">{deal.cuisine_type} • {deal.address}</p>
            {deal.discounted_price && <p className="text-sm font-medium text-[#138808] mt-1">${deal.discounted_price}{deal.original_price && <span className="text-gray-400 line-through ml-1">${deal.original_price}</span>}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onReject(deal.id)} disabled={processingId === deal.id} className="text-red-600 border-red-200 hover:bg-red-50"><X className="w-4 h-4" />Reject</Button>
          <Button onClick={() => onApprove(deal.id)} loading={processingId === deal.id} className="bg-green-600 hover:bg-green-700"><Check className="w-4 h-4" />Approve</Button>
        </div>
      </div>
    </div>
  );
}

// Edit Restaurant Modal Component
function EditRestaurantModal({ restaurant, isOpen, onClose, onSave }: { restaurant: Restaurant; isOpen: boolean; onClose: () => void; onSave: (r: Restaurant) => void }) {
  const [formData, setFormData] = useState(restaurant);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Restaurant" size="lg">
      <div className="p-6 space-y-4">
        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        <Select label="Cuisine Type" value={formData.cuisine_type} onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value as CuisineType })} options={cuisineOptions} />
        <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        <Input label="ZIP Code" value={formData.zipcode} onChange={(e) => setFormData({ ...formData, zipcode: e.target.value.replace(/\D/g, '').slice(0, 5) })} maxLength={5} />
        <Input label="Phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        <Input label="Website" value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Latitude" type="number" step="any" value={formData.lat || ''} onChange={(e) => setFormData({ ...formData, lat: e.target.value ? parseFloat(e.target.value) : null })} />
          <Input label="Longitude" type="number" step="any" value={formData.lng || ''} onChange={(e) => setFormData({ ...formData, lng: e.target.value ? parseFloat(e.target.value) : null })} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="verified" checked={formData.verified} onChange={(e) => setFormData({ ...formData, verified: e.target.checked })} className="w-4 h-4" />
          <label htmlFor="verified">Verified Restaurant</label>
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} loading={saving} className="flex-1"><Save className="w-4 h-4 mr-2" />Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}

// Edit Deal Modal Component
function EditDealModal({ deal, isOpen, onClose, onSave }: { deal: Deal; isOpen: boolean; onClose: () => void; onSave: (d: Deal) => void }) {
  const [formData, setFormData] = useState(deal);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_available: prev.days_available.includes(day)
        ? prev.days_available.filter(d => d !== day)
        : [...prev.days_available, day].sort(),
    }));
  };

  const dayOptions = [
    { value: 1, label: 'Sun' }, { value: 2, label: 'Mon' }, { value: 3, label: 'Tue' },
    { value: 4, label: 'Wed' }, { value: 5, label: 'Thu' }, { value: 6, label: 'Fri' }, { value: 7, label: 'Sat' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Deal" size="lg">
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        <Select label="Deal Type" value={formData.deal_type} onChange={(e) => setFormData({ ...formData, deal_type: e.target.value as DealType })} options={dealTypeOptions} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Original Price" type="number" step="0.01" value={formData.original_price || ''} onChange={(e) => setFormData({ ...formData, original_price: e.target.value ? parseFloat(e.target.value) : null })} />
          <Input label="Discounted Price" type="number" step="0.01" value={formData.discounted_price || ''} onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value ? parseFloat(e.target.value) : null })} />
        </div>
        <Input label="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <Input label="Coupon Code" value={formData.coupon_code || ''} onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })} />
        <Input label="Terms & Conditions" value={formData.terms_conditions || ''} onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })} />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((day) => (
              <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.days_available.includes(day.value) ? 'bg-[#FF9933] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} options={[
          { value: 'active', label: 'Active' },
          { value: 'pending', label: 'Pending' },
          { value: 'expired', label: 'Expired' },
          { value: 'flagged', label: 'Flagged' },
        ]} />

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} loading={saving} className="flex-1"><Save className="w-4 h-4 mr-2" />Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}

// Helper component for funnel steps
function FunnelStep({ 
  label, 
  value, 
  color, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  color: string; 
  icon: any;
}) {
  return (
    <div className="text-center">
      <div className={`w-12 h-12 mx-auto rounded-full ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

// Helper component for conversion rates
function ConversionRate({ label, value }: { label: string; value: string }) {
  const rate = parseFloat(value);
  let colorClass = 'text-gray-600';
  if (rate >= 30) colorClass = 'text-green-600';
  else if (rate >= 15) colorClass = 'text-[#FF9933]';
  else if (rate < 5) colorClass = 'text-red-600';
  
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${colorClass}`}>{value}%</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
