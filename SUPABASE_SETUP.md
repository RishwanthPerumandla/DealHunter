# DesiDeals - Supabase Setup Guide

This guide will help you set up the DesiDeals database on Supabase.

## Quick Setup (Recommended)

1. Create a free Supabase account at https://supabase.com
2. Create a new project
3. Go to the **SQL Editor** in your Supabase dashboard
4. Copy the entire contents of [`supabase/setup.sql`](supabase/setup.sql)
5. Paste it into the SQL Editor and click **Run**
6. Done! Your database is ready.

## Manual Setup

If you prefer to set up tables individually, follow the sections below.

### Step 1: Enable Extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 2: Storage Setup

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `restaurant-images`
3. Set it as **Public**
4. Add these policies:

```sql
-- Allow public read
CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'restaurant-images');

-- Allow authenticated upload
CREATE POLICY "Allow Uploads" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'restaurant-images');
```

### Step 3: Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these values from: Project Settings → API

## Database Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `user_fingerprints` | Anonymous user tracking via browser fingerprint |
| `restaurants` | Restaurant information |
| `deals` | Deal listings with votes and status |
| `votes` | User votes on deals |
| `analytics_events` | Usage tracking |
| `zipcode_cache` | ZIP code geocoding cache |

### Functions

| Function | Description |
|----------|-------------|
| `get_deals_by_zipcode` | Get deals near a ZIP code |
| `get_nearby_deals` | Get deals by coordinates |
| `increment_deal_view` | Increment deal view count |
| `update_vote_counts` | Auto-update vote counts trigger |
| `refresh_daily_analytics` | Refresh analytics view |

### Admin Access

Access the admin panel at `/admin` with the code: `desideals2024`

## Troubleshooting

### No deals showing?
1. Check that the `get_deals_by_zipcode` function exists
2. Verify you have active deals in the database
3. Check the browser console for errors

### Images not uploading?
1. Verify the `restaurant-images` bucket exists and is public
2. Check storage policies are correctly set
3. Ensure you're using the correct Supabase credentials

### Analytics not working?
1. Check the `analytics_events` table exists
2. Verify RLS policies allow inserts
3. Check browser console for tracking logs

## Maintenance

### Weekly Cleanup (Run in SQL Editor)

```sql
-- Clean up old analytics events (keep 30 days)
DELETE FROM analytics_events 
WHERE timestamp < NOW() - INTERVAL '30 days';

-- Refresh analytics view
REFRESH MATERIALIZED VIEW daily_analytics;

-- Update expired deals
UPDATE deals 
SET status = 'expired' 
WHERE valid_until < CURRENT_DATE 
    AND status = 'active';
```

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify your Supabase project is active
3. Check that all environment variables are set correctly
