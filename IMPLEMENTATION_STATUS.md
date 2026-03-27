# DesiDeals Implementation Status

This document describes what is currently implemented in the repository as of March 27, 2026. It is based on the code in the repo, not on the planning notes in `AGENTS.md`.

## Executive Summary

The app is a working Next.js + Supabase restaurant-deals product with:

- A public deal feed driven primarily by ZIP code selection
- Client-side anonymous fingerprint generation for voting and analytics attribution
- Cuisine preference and filter controls
- Deal detail, voting, directions, phone, website, and share actions
- A user deal-submission flow with optional image upload
- An admin dashboard for approval, editing, creation, analytics, and moderation
- Supabase-backed analytics event logging and optional Google Analytics integration

The implementation is further along in moderation and analytics than in AI-assisted deal capture. OCR/Gemini is present in dependencies, but not wired into the current submission UI.

## What Users Can Do Today

### 1. Browse deals from the home page

Entry point: [app/page.tsx](/d:/Personal/DealHunter/app/page.tsx)

Current behavior:

- Shows a simple marketing hero followed by the main deal feed
- Tracks a page view on load
- Renders [DealList.tsx](/d:/Personal/DealHunter/components/deals/DealList.tsx) as the primary user experience

### 2. Set location by GPS or ZIP code

Primary location UX:

- [LocationSelector.tsx](/d:/Personal/DealHunter/components/deals/LocationSelector.tsx)
- [useLocation.ts](/d:/Personal/DealHunter/hooks/useLocation.ts)
- [location.ts](/d:/Personal/DealHunter/lib/utils/location.ts)

Implemented behavior:

- Prompts users to set a location if one is not already stored
- Supports browser geolocation
- Supports manual 5-digit ZIP code entry
- Stores location in `localStorage`
- Broadcasts a `locationSet` browser event for cross-component sync
- Tracks location changes in analytics
- Falls back to a default display location of New York (`10001`) when nothing is set

Important implementation note:

- The repo also contains [LocationGate.tsx](/d:/Personal/DealHunter/components/LocationGate.tsx), but it is not the primary flow currently mounted in the root layout or home page.

### 3. Set a cuisine preference

Relevant files:

- [PreferenceSelector.tsx](/d:/Personal/DealHunter/components/PreferenceSelector.tsx)
- [PreferenceModal.tsx](/d:/Personal/DealHunter/components/PreferenceModal.tsx)

Implemented behavior:

- After location is set, users may be prompted to choose `Desi Deals`, `Other Deals`, or `Show me everything`
- Preference is stored in `localStorage`
- The deal feed listens for `preferenceChanged` events and refetches using the selected preference
- Preference selection and modal open/close events are tracked

### 4. Browse, sort, and filter the feed

Relevant files:

- [DealList.tsx](/d:/Personal/DealHunter/components/deals/DealList.tsx)
- [useDeals.ts](/d:/Personal/DealHunter/hooks/useDeals.ts)

Implemented behavior:

- Uses ZIP-code mode by default
- Supports cuisine preference filters and explicit cuisine chips
- Supports sorting by distance, popularity, discount, and newest
- Splits the feed into:
  - same-ZIP featured deals
  - nearby-area deals
  - fallback recommended deals from other ZIP codes when the current ZIP has none
- Shows loading, error, and empty states
- Refetches every 30 seconds through React Query

Current data-fetching strategy:

- Preferred path is the Supabase RPC `get_deals_by_zipcode`
- Legacy coordinate search still exists via `get_nearby_deals`
- If a ZIP has no deals, the app fetches active deals from other ZIP codes as fallback recommendations

### 5. Open deal details and interact with deals

Relevant files:

- [DealCard.tsx](/d:/Personal/DealHunter/components/deals/DealCard.tsx)
- [DealDetailModal.tsx](/d:/Personal/DealHunter/components/deals/DealDetailModal.tsx)

Implemented behavior:

- Deal cards show title, restaurant, address, cuisine, available days, pricing, score, and quick actions
- Users can upvote or downvote deals
- Users can call the restaurant if a phone number exists
- Users can open Google Maps directions if coordinates exist
- Opening the detail modal:
  - tracks a deal view
  - calls the Supabase RPC `increment_deal_view`
- Detail modal supports:
  - sharing via `navigator.share`
  - clipboard fallback
  - website, phone, and directions actions
  - coupon code and terms display
  - current availability display based on status plus day/date logic

### 6. Submit new deals

Relevant files:

- [SubmitDealModal.tsx](/d:/Personal/DealHunter/components/deals/SubmitDealModal.tsx)
- [useSubmitDeal.ts](/d:/Personal/DealHunter/hooks/useSubmitDeal.ts)
- [image.ts](/d:/Personal/DealHunter/lib/utils/image.ts)
- [FloatingActionButton.tsx](/d:/Personal/DealHunter/components/layout/FloatingActionButton.tsx)

Implemented behavior:

- Multi-step modal:
  - choose or create a restaurant
  - enter deal details
  - see success state
- Searches existing restaurants by ZIP code or name before creating a new one
- Can upload an optional image
- New submissions are created with `pending` status
- Attempts to geocode the ZIP code if restaurant coordinates are missing
- Reuses an existing restaurant when name + ZIP match

Important implementation notes:

- The floating action button component exists, but it is not currently mounted in [app/layout.tsx](/d:/Personal/DealHunter/app/layout.tsx), so submission entry may not be visible in the main app unless mounted elsewhere later.
- Submission is currently protected by a hardcoded client-side code in [FloatingActionButton.tsx](/d:/Personal/DealHunter/components/layout/FloatingActionButton.tsx).
- The submit modal uploads the image directly before calling `useSubmitDeal`, while `useSubmitDeal` also supports image upload internally. That duplication suggests the flow was refactored partway and could be cleaned up.
- Gemini OCR is not currently used in this modal flow.

## Admin Features Implemented

Primary entry point: [app/admin/page.tsx](/d:/Personal/DealHunter/app/admin/page.tsx)

### Authentication

- Admin access uses a hardcoded secret: `desideals2024`
- Auth state is stored in `sessionStorage`
- This is purely client-side gating

### Overview dashboard

Implemented behavior:

- Loads counts for deals, active deals, pending deals, votes, users, restaurants, and total views
- Shows pending deals awaiting moderation
- Includes quick actions for adding restaurants and deals

### Deal moderation

Implemented behavior:

- Approve pending deals by changing status to `active`
- Reject pending deals by changing status to `flagged`
- Toggle active deals between `active` and `expired`
- Delete deals
- Edit deals via modal

### Restaurant management

Implemented behavior:

- Search restaurants
- Create restaurants directly from the admin UI
- Edit restaurant metadata
- Delete restaurants
- Select a restaurant as part of admin deal creation

### Admin deal creation

Implemented behavior:

- Two-step flow:
  - choose a restaurant
  - create an active deal
- Admin-created deals go live immediately with `status: active`
- Supports optional image upload

### Analytics dashboard

Relevant support code:

- [analytics.ts](/d:/Personal/DealHunter/lib/utils/analytics.ts)

Implemented behavior:

- Pulls daily aggregated event data from `daily_analytics`
- Calculates a 7-day conversion funnel from raw analytics events
- Calculates top ZIP codes by sessions, views, clicks, and engagement rate

## API and Data Layer

### Supabase client setup

Relevant file:

- [supabase.ts](/d:/Personal/DealHunter/lib/db/supabase.ts)

Implemented behavior:

- Client-side public Supabase client uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional admin client uses `SUPABASE_SERVICE_ROLE_KEY`
- If service role is missing, `supabaseAdmin` falls back to the public client

### API route

Relevant file:

- [route.ts](/d:/Personal/DealHunter/app/api/deals/route.ts)

Implemented behavior:

- `GET /api/deals`
  - fetches active deals with restaurant joins
  - optionally filters by cuisine
  - calculates distance in the route
  - filters by radius and sorts by computed distance
- `POST /api/deals`
  - creates a restaurant first
  - then creates a pending deal

Important implementation note:

- This route does not appear to be the main path used by the current React hooks, which talk directly to Supabase and RPCs from the client.

### Hooks and RPC usage

Implemented:

- `useDeals` for feed loading and vote handling
- `useDeal` for single-deal loading with vote status
- `useLocation` for location persistence and updates
- `useRestaurantSearch` for restaurant search
- `useSubmitDeal` for user submission
- `useFingerprint` for anonymous identity

Observed RPC usage in code:

- `get_deals_by_zipcode`
- `get_nearby_deals`
- `increment_deal_view`

## Analytics and Tracking

Relevant files:

- [analytics.ts](/d:/Personal/DealHunter/lib/utils/analytics.ts)
- [GoogleAnalytics.tsx](/d:/Personal/DealHunter/components/GoogleAnalytics.tsx)
- [google-analytics.ts](/d:/Personal/DealHunter/lib/utils/google-analytics.ts)

Implemented behavior:

- Dual tracking model:
  - Supabase `analytics_events`
  - Google Analytics when `NEXT_PUBLIC_GA_ID` is configured
- Tracks:
  - page views
  - deal views
  - vote events
  - location changes
  - deal clicks
  - submissions
  - preference changes
  - modal interactions
  - search
  - errors

Implementation note:

- Google Analytics is initialized in two places:
  - inline scripts in [app/layout.tsx](/d:/Personal/DealHunter/app/layout.tsx)
  - [GoogleAnalytics.tsx](/d:/Personal/DealHunter/components/GoogleAnalytics.tsx)
- That duplication is worth consolidating.

## Fingerprinting and Anonymous Identity

Relevant files:

- [fingerprint.ts](/d:/Personal/DealHunter/lib/utils/fingerprint.ts)
- [useFingerprint.ts](/d:/Personal/DealHunter/hooks/useFingerprint.ts)

Implemented behavior:

- Generates a SHA-256 fingerprint from:
  - canvas output
  - WebGL renderer
  - screen properties
  - timezone
  - language
  - platform
  - touch support
- Stores the fingerprint in:
  - `localStorage`
  - IndexedDB
  - cookie fallback
- Attempts to upsert the fingerprint into `user_fingerprints`
- Uses the fingerprint for vote attribution and analytics

Implementation note:

- The canvas fingerprint code contains garbled emoji text in the rendered string, likely from encoding issues in the source file. It does not block functionality, but it is a cleanup candidate.

## Styling and UX

Relevant files:

- [app/globals.css](/d:/Personal/DealHunter/app/globals.css)
- [tailwind.config.ts](/d:/Personal/DealHunter/tailwind.config.ts)

Implemented behavior:

- Tailwind-based styling across the app
- Framer Motion animations across feed, modals, cards, banners, and admin screens
- Warm orange/green brand palette carried through public and admin experiences
- Custom scrollbar hiding, line-clamp utilities, and a few global animation helpers

Implementation note:

- Although local font files exist under `app/fonts`, the current layout uses `Inter` from `next/font/google`.

## PWA and Platform Setup

Relevant files:

- [public/manifest.json](/d:/Personal/DealHunter/public/manifest.json)
- [next.config.js](/d:/Personal/DealHunter/next.config.js)

Implemented behavior:

- Web app manifest is present
- Theme color and standalone display are configured
- Security headers are configured in Next.js
- Supabase storage remote image patterns are configured

Implementation note:

- `manifest.json` references multiple PNG icons that do not all appear in the current `public/icons` file listing from this repo snapshot. That should be verified.

## Features Planned or Implied but Not Fully Implemented

These items are mentioned in docs, dependency choices, or code comments, but are not fully wired into the current product flow:

- Gemini OCR-based extraction in the user submission flow
- Fully public submission entry point in the mounted UI
- Dedicated privacy, terms, and contact pages linked from the footer
- Strong server-enforced admin authentication
- A single canonical data-access path between API routes and direct client Supabase access

## Notable Codebase Realities and Gaps

These are important for future contributors:

- The repo documentation previously described a radius-first discovery model, but the actual UX is ZIP-code-first.
- There are signs of mixed generations of implementation:
  - `LocationGate` versus `LocationSelector`
  - API route approach versus direct client RPC approach
  - single-upload flow versus duplicated upload handling
  - single GA bootstrap versus double initialization
- Several files contain mojibake or encoding artifacts in UI labels and symbols.
- The footer links point to routes that are not present in the current `app` directory.
- The admin and submission secrets are hardcoded in the client, so the current protection is convenience-level rather than secure.

## Suggested Next Documentation Targets

If you want to keep documenting the codebase, the most useful next docs would be:

- A database/RPC contract document tied to the actual Supabase schema
- A user-flow document with screenshots for location, browsing, and moderation
- A cleanup/debt log for duplicated flows and security hardening

