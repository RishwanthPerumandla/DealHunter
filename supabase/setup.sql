-- DesiDeals Complete Database Setup
-- Run this in Supabase SQL Editor to set up your entire database

-- ============================================
-- STEP 1: Enable Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: Create Tables
-- ============================================

-- User Fingerprints Table
CREATE TABLE IF NOT EXISTS user_fingerprints (
    id TEXT PRIMARY KEY,
    fingerprint_hash TEXT UNIQUE NOT NULL,
    canvas_hash TEXT,
    webgl_renderer TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    language TEXT,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vote_count INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 1,
    country TEXT,
    city TEXT,
    ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_fingerprints_hash ON user_fingerprints(fingerprint_hash);

-- Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cuisine_type TEXT CHECK (cuisine_type IN ('indian', 'desi', 'continental', 'fast_food', 'chinese', 'other')),
    address TEXT NOT NULL,
    zipcode TEXT NOT NULL,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    phone TEXT,
    website TEXT,
    verified BOOLEAN DEFAULT false,
    submitted_by_fingerprint TEXT REFERENCES user_fingerprints(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_zipcode ON restaurants(zipcode);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);

-- Deals Table
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deal_type TEXT CHECK (deal_type IN ('percentage_off', 'fixed_price', 'bogo', 'free_item', 'combo', 'buffet_special')),
    original_price DECIMAL(10,2),
    discounted_price DECIMAL(10,2),
    discount_percentage INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN original_price > 0 AND discounted_price IS NOT NULL 
            THEN ROUND(((original_price - discounted_price) / original_price) * 100)
            ELSE 0 
        END
    ) STORED,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    days_available INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
    terms_conditions TEXT,
    coupon_code TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    score INTEGER GENERATED ALWAYS AS (upvotes - downvotes) STORED,
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'flagged', 'pending')),
    view_count INTEGER DEFAULT 0,
    image_url TEXT,
    created_by_fingerprint TEXT REFERENCES user_fingerprints(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_score ON deals(score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_restaurant ON deals(restaurant_id);

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    fingerprint_id TEXT REFERENCES user_fingerprints(id),
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deal_id, fingerprint_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_deal ON votes(deal_id);
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint ON votes(fingerprint_id);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint_id TEXT REFERENCES user_fingerprints(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'deal_view', 'vote', 'location_change', 'deal_click', 'deal_submit', 'restaurant_create', 'deal_create')),
    metadata JSONB DEFAULT '{}',
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_fingerprint ON analytics_events(fingerprint_id);

-- ZIP Code Cache Table
CREATE TABLE IF NOT EXISTS zipcode_cache (
    zipcode TEXT PRIMARY KEY,
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA'
);

-- ============================================
-- STEP 3: Create Functions
-- ============================================

-- Function: Get deals by zipcode
CREATE OR REPLACE FUNCTION get_deals_by_zipcode(
    p_zipcode TEXT,
    cuisine_filter TEXT[]
)
RETURNS TABLE (
    id UUID,
    restaurant_id UUID,
    title TEXT,
    description TEXT,
    deal_type TEXT,
    original_price DECIMAL,
    discounted_price DECIMAL,
    discount_percentage INTEGER,
    valid_from DATE,
    valid_until DATE,
    days_available INTEGER[],
    terms_conditions TEXT,
    coupon_code TEXT,
    upvotes INTEGER,
    downvotes INTEGER,
    score INTEGER,
    status TEXT,
    view_count INTEGER,
    image_url TEXT,
    created_by_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    restaurant_name TEXT,
    cuisine_type TEXT,
    address TEXT,
    restaurant_zipcode TEXT,
    phone TEXT,
    website TEXT,
    lat DECIMAL,
    lng DECIMAL,
    distance_miles DECIMAL
) AS $$
DECLARE
    user_lat DECIMAL;
    user_lng DECIMAL;
BEGIN
    -- Get coordinates for the provided zipcode
    SELECT zc.lat, zc.lng INTO user_lat, user_lng
    FROM zipcode_cache zc
    WHERE zc.zipcode = p_zipcode;
    
    -- If zipcode not found in cache, use the restaurant's zipcode matching
    IF user_lat IS NULL OR user_lng IS NULL THEN
        RETURN QUERY
        SELECT 
            d.id, d.restaurant_id, d.title, d.description, d.deal_type,
            d.original_price, d.discounted_price, d.discount_percentage,
            d.valid_from, d.valid_until, d.days_available, d.terms_conditions,
            d.coupon_code, d.upvotes, d.downvotes, d.score, d.status,
            d.view_count, d.image_url, d.created_by_fingerprint, d.created_at, d.updated_at,
            r.name as restaurant_name, r.cuisine_type, r.address,
            r.zipcode as restaurant_zipcode, r.phone, r.website, r.lat, r.lng,
            0::DECIMAL as distance_miles
        FROM deals d
        JOIN restaurants r ON d.restaurant_id = r.id
        WHERE d.status = 'active'
            AND r.zipcode = p_zipcode
            AND (array_length(cuisine_filter, 1) IS NULL OR r.cuisine_type = ANY(cuisine_filter))
        ORDER BY d.score DESC, d.created_at DESC;
    ELSE
        -- Calculate distance from user's zipcode to restaurant
        RETURN QUERY
        SELECT 
            d.id, d.restaurant_id, d.title, d.description, d.deal_type,
            d.original_price, d.discounted_price, d.discount_percentage,
            d.valid_from, d.valid_until, d.days_available, d.terms_conditions,
            d.coupon_code, d.upvotes, d.downvotes, d.score, d.status,
            d.view_count, d.image_url, d.created_by_fingerprint, d.created_at, d.updated_at,
            r.name as restaurant_name, r.cuisine_type, r.address,
            r.zipcode as restaurant_zipcode, r.phone, r.website, r.lat, r.lng,
            CASE 
                WHEN r.lat IS NOT NULL AND r.lng IS NOT NULL THEN
                    (3959 * acos(
                        cos(radians(user_lat)) * cos(radians(r.lat)) *
                        cos(radians(r.lng) - radians(user_lng)) +
                        sin(radians(user_lat)) * sin(radians(r.lat))
                    ))::DECIMAL
                ELSE NULL
            END as distance_miles
        FROM deals d
        JOIN restaurants r ON d.restaurant_id = r.id
        WHERE d.status = 'active'
            AND (array_length(cuisine_filter, 1) IS NULL OR r.cuisine_type = ANY(cuisine_filter))
            AND (
                r.zipcode = p_zipcode 
                OR (
                    r.lat IS NOT NULL 
                    AND r.lng IS NOT NULL 
                    AND (3959 * acos(
                        cos(radians(user_lat)) * cos(radians(r.lat)) *
                        cos(radians(r.lng) - radians(user_lng)) +
                        sin(radians(user_lat)) * sin(radians(r.lat))
                    )) <= 15
                )
            )
        ORDER BY 
            CASE WHEN r.zipcode = p_zipcode THEN 0 ELSE 1 END,
            distance_miles ASC NULLS LAST,
            d.score DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Get nearby deals by coordinates (legacy)
CREATE OR REPLACE FUNCTION get_nearby_deals(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_miles DECIMAL,
    cuisine_filter TEXT[]
)
RETURNS TABLE (
    id UUID,
    restaurant_id UUID,
    title TEXT,
    description TEXT,
    deal_type TEXT,
    original_price DECIMAL,
    discounted_price DECIMAL,
    discount_percentage INTEGER,
    valid_from DATE,
    valid_until DATE,
    days_available INTEGER[],
    terms_conditions TEXT,
    coupon_code TEXT,
    upvotes INTEGER,
    downvotes INTEGER,
    score INTEGER,
    status TEXT,
    view_count INTEGER,
    image_url TEXT,
    created_by_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    restaurant_name TEXT,
    cuisine_type TEXT,
    address TEXT,
    zipcode TEXT,
    phone TEXT,
    website TEXT,
    lat DECIMAL,
    lng DECIMAL,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id, d.restaurant_id, d.title, d.description, d.deal_type,
        d.original_price, d.discounted_price, d.discount_percentage,
        d.valid_from, d.valid_until, d.days_available, d.terms_conditions,
        d.coupon_code, d.upvotes, d.downvotes, d.score, d.status,
        d.view_count, d.image_url, d.created_by_fingerprint, d.created_at, d.updated_at,
        r.name as restaurant_name, r.cuisine_type, r.address, r.zipcode,
        r.phone, r.website, r.lat, r.lng,
        (3959 * acos(
            cos(radians(user_lat)) * cos(radians(r.lat)) *
            cos(radians(r.lng) - radians(user_lng)) +
            sin(radians(user_lat)) * sin(radians(r.lat))
        ))::DECIMAL as distance
    FROM deals d
    JOIN restaurants r ON d.restaurant_id = r.id
    WHERE d.status = 'active'
        AND r.lat IS NOT NULL
        AND r.lng IS NOT NULL
        AND (3959 * acos(
            cos(radians(user_lat)) * cos(radians(r.lat)) *
            cos(radians(r.lng) - radians(user_lng)) +
            sin(radians(user_lat)) * sin(radians(r.lat))
        )) <= radius_miles
        AND (array_length(cuisine_filter, 1) IS NULL OR r.cuisine_type = ANY(cuisine_filter))
    ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment deal view count
CREATE OR REPLACE FUNCTION increment_deal_view(deal_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE deals
    SET view_count = view_count + 1
    WHERE id = deal_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function: Update vote counts trigger
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE deals SET upvotes = upvotes + 1 WHERE id = NEW.deal_id;
        ELSE
            UPDATE deals SET downvotes = downvotes + 1 WHERE id = NEW.deal_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE deals SET upvotes = upvotes - 1 WHERE id = OLD.deal_id;
        ELSE
            UPDATE deals SET downvotes = downvotes - 1 WHERE id = OLD.deal_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.vote_type != NEW.vote_type THEN
            IF NEW.vote_type = 'up' THEN
                UPDATE deals SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.deal_id;
            ELSE
                UPDATE deals SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.deal_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create vote counts trigger
DROP TRIGGER IF EXISTS trigger_update_vote_counts ON votes;
CREATE TRIGGER trigger_update_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_counts();

-- Function: Refresh daily analytics
CREATE OR REPLACE FUNCTION refresh_daily_analytics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_analytics;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: Create Materialized Views
-- ============================================

-- Daily Analytics View
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics AS
SELECT 
    DATE(timestamp) as date,
    event_type,
    COUNT(DISTINCT fingerprint_id) as unique_users,
    COUNT(*) as event_count,
    metadata->>'zipcode' as zipcode,
    metadata->>'cuisine_type' as cuisine_type
FROM analytics_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_type, metadata->>'zipcode', metadata->>'cuisine_type';

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_event ON daily_analytics(event_type);

-- ============================================
-- STEP 5: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE user_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_fingerprints
DROP POLICY IF EXISTS "Allow insert fingerprints" ON user_fingerprints;
DROP POLICY IF EXISTS "Read own fingerprint" ON user_fingerprints;

CREATE POLICY "Allow insert fingerprints" 
    ON user_fingerprints FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Read own fingerprint" 
    ON user_fingerprints FOR SELECT 
    USING (id = COALESCE(current_setting('app.current_fingerprint_id', true), ''));

-- RLS Policies for restaurants
DROP POLICY IF EXISTS "Public read restaurants" ON restaurants;
DROP POLICY IF EXISTS "Insert restaurants" ON restaurants;

CREATE POLICY "Public read restaurants" 
    ON restaurants FOR SELECT 
    USING (true);

CREATE POLICY "Insert restaurants" 
    ON restaurants FOR INSERT 
    WITH CHECK (true);

-- RLS Policies for deals
DROP POLICY IF EXISTS "Public read active deals" ON deals;
DROP POLICY IF EXISTS "Insert deals" ON deals;

CREATE POLICY "Public read active deals" 
    ON deals FOR SELECT 
    USING (status = 'active');

CREATE POLICY "Insert deals" 
    ON deals FOR INSERT 
    WITH CHECK (true);

-- RLS Policies for votes
DROP POLICY IF EXISTS "Public read votes" ON votes;
DROP POLICY IF EXISTS "Insert own vote" ON votes;

CREATE POLICY "Public read votes" 
    ON votes FOR SELECT 
    USING (true);

CREATE POLICY "Insert own vote" 
    ON votes FOR INSERT 
    WITH CHECK (true);

-- RLS Policies for analytics
DROP POLICY IF EXISTS "Allow insert analytics" ON analytics_events;

CREATE POLICY "Allow insert analytics" 
    ON analytics_events FOR INSERT 
    WITH CHECK (true);

-- ============================================
-- STEP 6: Storage Bucket Setup
-- ============================================

-- Note: Create the "restaurant-images" bucket manually in Supabase Dashboard
-- Then run these storage policies:

-- Storage Policy: Public read access
-- CREATE POLICY "Public Access" 
--     ON storage.objects FOR SELECT 
--     USING (bucket_id = 'restaurant-images');

-- Storage Policy: Allow uploads
-- CREATE POLICY "Allow Uploads" 
--     ON storage.objects FOR INSERT 
--     WITH CHECK (bucket_id = 'restaurant-images');

-- ============================================
-- STEP 7: Sample Data (Optional)
-- ============================================

-- Insert sample zipcode for testing (New York)
INSERT INTO zipcode_cache (zipcode, lat, lng, city, state, country)
VALUES ('10001', 40.7505, -73.9934, 'New York', 'NY', 'USA')
ON CONFLICT (zipcode) DO NOTHING;

-- Insert sample zipcode for testing (Dallas area)
INSERT INTO zipcode_cache (zipcode, lat, lng, city, state, country)
VALUES ('75201', 32.7831, -96.8067, 'Dallas', 'TX', 'USA')
ON CONFLICT (zipcode) DO NOTHING;

-- Insert sample zipcode for testing (Denton area)
INSERT INTO zipcode_cache (zipcode, lat, lng, city, state, country)
VALUES ('76201', 33.2148, -97.1331, 'Denton', 'TX', 'USA')
ON CONFLICT (zipcode) DO NOTHING;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- Next Steps:
-- 1. Create a storage bucket named "restaurant-images" in Supabase Dashboard
-- 2. Make the bucket public
-- 3. Add storage policies for read and upload access
-- 4. Set up your environment variables in .env.local:
--    NEXT_PUBLIC_SUPABASE_URL=your-project-url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
--    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
--
-- Admin access code: desideals2024
