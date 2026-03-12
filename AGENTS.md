# DesiDeals - Agent Guide

> This file contains essential information for AI coding agents working on the DesiDeals project.
> Last updated: 2026-03-11

## Project Overview

**DesiDeals** is a community-driven restaurant deal discovery platform focused on Indian and Desi cuisine. It allows users to:
- Discover deals within a 5-mile radius of their location
- Submit deals by taking photos of menu boards (AI-powered OCR via Google Gemini)
- Vote on deals (upvote/downvote) to keep content fresh
- Get directions, call restaurants, and visit websites directly from the app

The app is designed to be **100% free with no sign-ups required**, using browser fingerprinting for anonymous user tracking.

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14.2.35 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 3.4.1 |
| **Backend** | Supabase (PostgreSQL + Storage) |
| **State Management** | React Query (TanStack Query) 5.x |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **AI/OCR** | Google Gemini 1.5 Flash |
| **Image Compression** | browser-image-compression |
| **Client Storage** | IndexedDB (via `idb` library) |

---

## Project Structure

```
desideals/
├── app/                          # Next.js App Router
│   ├── api/deals/route.ts        # API routes for deals (GET, POST)
│   ├── about/page.tsx            # About page
│   ├── admin/page.tsx            # Admin dashboard (secret code protected)
│   ├── debug/page.tsx            # Debug utilities
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (deal feed)
│   ├── globals.css               # Global styles + Tailwind
│   └── fonts/                    # Custom fonts (Geist)
├── components/
│   ├── deals/                    # Deal-related components
│   │   ├── DealCard.tsx          # Individual deal display
│   │   ├── DealList.tsx          # List of deals with filtering
│   │   ├── LocationSelector.tsx  # Location input/modal
│   │   └── SubmitDealModal.tsx   # Deal submission form
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            # App header
│   │   ├── Footer.tsx            # App footer
│   │   └── FloatingActionButton.tsx # FAB for adding deals
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx            # Button component
│   │   ├── Input.tsx             # Input component
│   │   ├── Modal.tsx             # Modal/dialog component
│   │   ├── Select.tsx            # Select dropdown
│   │   └── Toast.tsx             # Toast notifications
│   ├── LocationGate.tsx          # Location permission gate
│   └── QueryProvider.tsx         # React Query provider
├── hooks/                        # Custom React hooks
│   ├── useDeals.ts               # Fetch deals, voting logic
│   ├── useFingerprint.ts         # Browser fingerprinting
│   ├── useLocation.ts            # Location management
│   ├── useRestaurants.ts         # Restaurant data
│   └── useSubmitDeal.ts          # Deal submission
├── lib/                          # Utilities and database
│   ├── db/supabase.ts            # Supabase client configuration
│   └── utils/
│       ├── analytics.ts          # Analytics tracking
│       ├── fingerprint.ts        # Fingerprint generation (SHA256)
│       ├── image.ts              # Image compression & upload
│       └── location.ts           # Geocoding, distance calc
├── types/                        # TypeScript types
│   ├── database.ts               # Supabase database types
│   └── index.ts                  # Application types
├── supabase/                     # Supabase migrations (if any)
├── public/                       # Static assets
├── .env.local                    # Environment variables (gitignored)
├── .env.local.example            # Environment template
├── next.config.js                # Next.js config (security headers)
├── tailwind.config.ts            # Tailwind customization
├── tsconfig.json                 # TypeScript config
└── SUPABASE_SETUP.md             # Database setup instructions
```

---

## Environment Variables

Create `.env.local` from `.env.local.example`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API Key (for OCR)
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Optional: Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
```

---

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

---

## Database Schema (Supabase)

### Core Tables

1. **user_fingerprints** - Anonymous user tracking
   - `id` (TEXT, SHA256 hash, PK)
   - `fingerprint_hash`, `canvas_hash`, `webgl_renderer`
   - `screen_resolution`, `timezone`, `language`
   - `first_seen`, `last_seen`, `vote_count`, `session_count`

2. **restaurants** - Restaurant information
   - `id` (UUID, PK)
   - `name`, `cuisine_type`, `address`, `zipcode`
   - `lat`, `lng` (coordinates)
   - `phone`, `website`, `verified`

3. **deals** - Deal listings
   - `id` (UUID, PK)
   - `restaurant_id` (FK)
   - `title`, `description`, `deal_type`
   - `original_price`, `discounted_price`, `discount_percentage` (generated)
   - `valid_from`, `valid_until`, `days_available` (integer[])
   - `upvotes`, `downvotes`, `score` (generated: upvotes - downvotes)
   - `status` (active/expired/flagged/pending)
   - `image_url`

4. **votes** - User votes on deals
   - `id` (UUID, PK)
   - `deal_id`, `fingerprint_id`
   - `vote_type` (up/down)
   - Unique constraint: (deal_id, fingerprint_id)

5. **analytics_events** - Usage tracking
   - `id` (UUID, PK)
   - `fingerprint_id`, `event_type`, `metadata` (JSONB)
   - `session_id`, `timestamp`

6. **zipcode_cache** - ZIP code geocoding cache
   - `zipcode` (PK), `lat`, `lng`, `city`, `state`, `country`

### Key Database Functions

- `get_nearby_deals(user_lat, user_lng, radius_miles, cuisine_filter)` - Returns deals within radius
- `increment_deal_view(deal_uuid)` - Atomically increments view count
- `update_vote_counts()` - Trigger function to maintain vote counts

### Materialized Views

- `daily_analytics` - Aggregated analytics by date/event type

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - All code must pass strict type checking
- Use explicit return types for functions when not obvious
- Prefer `interface` over `type` for object definitions
- Use `@/` path alias for imports from project root

### Component Patterns

```typescript
'use client';  // Required for client components (hooks, browser APIs)

import { useState } from 'react';
import { Deal } from '@/types';

interface ComponentProps {
  deal: Deal;
  onVote: (dealId: string, voteType: VoteType) => void;
}

export default function ComponentName({ deal, onVote }: ComponentProps) {
  // Component logic
}
```

### Styling Conventions

- Use **Tailwind CSS** utility classes exclusively
- Custom colors defined in `tailwind.config.ts`:
  - `primary`: #FF9933 (saffron/orange)
  - `secondary`: #138808 (green)
  - `accent`: #FFD700 (gold)
  - `background`: #F9F7F4 (warm off-white)
- Use `className` prop ordering: layout → sizing → spacing → colors → effects
- Responsive prefixes: `sm:`, `md:`, `lg:`

### Fingerprint & Privacy

- User identity is tracked via **SHA256 browser fingerprint** (canvas, WebGL, screen, timezone, language)
- Fingerprint stored in localStorage, IndexedDB, and cookie as fallback
- **No PII is collected** - completely anonymous
- Rate limiting enforced via analytics events (20 votes/hour, 20 submissions/day)

---

## API Routes

### `/api/deals`

**GET** - Fetch nearby deals
```
Query params: lat, lng, radius (default 5), cuisine (optional)
Returns: { deals: Deal[] }
```

**POST** - Create new deal
```
Body: {
  restaurantName, cuisineType, address, zipcode,
  phone?, website?, lat?, lng?,
  title, description?, dealType,
  originalPrice?, discountedPrice?, imageUrl?
}
```

---

## Custom Hooks

### `useDeals(options)`
```typescript
const { deals, loading, error, refetch, vote, voting } = useDeals({
  lat: number,
  lng: number,
  radius?: number,
  cuisineFilter?: string[]
});
```

### `useFingerprint()`
```typescript
const { fingerprint, loading, error, refreshFingerprint } = useFingerprint();
```

---

## Image Handling

1. **Compression**: All images compressed to WebP format (max 1024px, 100KB)
2. **Upload**: Stored in Supabase Storage bucket `restaurant-images`
3. **Display**: Use standard `<img>` tag (Next.js Image not used due to external URLs)
4. **Error handling**: Fallback placeholder on image load error

---

## Analytics Events

Fire-and-forget tracking via `lib/utils/analytics.ts`:

```typescript
trackPageView(path, title?);
trackDealView(dealId, restaurantId);
trackVote(dealId, voteType);
trackLocationChange(zipcode, lat, lng);
trackDealClick(dealId, type); // 'website' | 'phone' | 'directions'
trackDealSubmit(dealId, restaurantId);
```

---

## Admin Dashboard

Access at `/admin` with secret code `desideals2024` (hardcoded, sessionStorage-based).

Features:
- View statistics (total deals, active, pending, votes, users)
- Approve/reject pending deals
- View 7-day activity analytics

---

## Security Considerations

1. **RLS Enabled** on all Supabase tables with appropriate policies
2. **Security Headers** in `next.config.js`:
   - Strict-Transport-Security
   - X-Content-Type-Options: nosniff
   - Referrer-Policy
3. **No authentication** - fingerprint-based anonymous access
4. **Rate limiting** via analytics tracking
5. **Image validation** - compression happens client-side before upload

---

## External APIs

1. **Google Gemini** - OCR for extracting deal details from menu photos
2. **OpenStreetMap Nominatim** - Free geocoding/reverse geocoding (ZIP code → coordinates)

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy

### Supabase Storage Setup

1. Create bucket `restaurant-images`
2. Set to Public
3. Add storage policies for read/insert

---

## Common Tasks

### Adding a New Deal Type

1. Update `DealType` in `types/index.ts`
2. Update check constraint in Supabase (if modifying DB)
3. Add display label in UI components

### Adding a New Cuisine Type

1. Update `CuisineType` in `types/index.ts`
2. Update `get_nearby_deals` function cuisine_filter default

### Modifying Database Schema

1. Update SQL in `SUPABASE_SETUP.md`
2. Run migrations in Supabase SQL Editor
3. Update `types/database.ts` with new schema
4. Update application types in `types/index.ts`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Deals not loading | Check Supabase connection, verify `get_nearby_deals` function exists |
| Images not uploading | Verify `restaurant-images` bucket exists and is public |
| Fingerprint issues | Check browser console for IndexedDB errors |
| Location not working | Ensure HTTPS (geolocation requires secure context) |
| Admin not accessible | Clear sessionStorage, re-enter secret code |

---

## Dependencies to Know

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state management, caching |
| `@supabase/supabase-js` | Database client |
| `framer-motion` | Animations |
| `browser-image-compression` | Client-side image optimization |
| `idb` | IndexedDB wrapper for fingerprint storage |
| `lucide-react` | Icon library |
| `@google/generative-ai` | Gemini AI integration |

---

## File Naming Conventions

- Components: PascalCase (e.g., `DealCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useDeals.ts`)
- Utilities: camelCase (e.g., `fingerprint.ts`)
- Types: camelCase (e.g., `database.ts`)
- Pages: `page.tsx` (Next.js convention)
- API Routes: `route.ts` (Next.js convention)
