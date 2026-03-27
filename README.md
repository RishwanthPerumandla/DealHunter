# DesiDeals

DesiDeals is a Next.js 14 app for discovering restaurant deals, centered on a ZIP-code-first browsing experience with community voting, anonymous fingerprint-based tracking, moderation tooling, and Supabase-backed storage.

The current codebase is implementation-heavy and differs in a few places from the original product notes. For the repo-accurate breakdown of what is actually built today, see [IMPLEMENTATION_STATUS.md](/d:/Personal/DealHunter/IMPLEMENTATION_STATUS.md).

## Stack

- Next.js 14.2.35 with App Router
- React 18 + TypeScript
- Tailwind CSS 3
- Supabase for database, RPCs, analytics events, and storage
- TanStack Query for client data fetching
- Framer Motion for UI motion
- Google Analytics support via `NEXT_PUBLIC_GA_ID`

## Local Development

```bash
npm install
npm run dev
```

Required environment variables are documented in `.env.local.example` and project setup notes are in [SUPABASE_SETUP.md](/d:/Personal/DealHunter/SUPABASE_SETUP.md).

## Main Areas

- User-facing deal feed: [app/page.tsx](/d:/Personal/DealHunter/app/page.tsx)
- Deal API route: [app/api/deals/route.ts](/d:/Personal/DealHunter/app/api/deals/route.ts)
- Admin dashboard: [app/admin/page.tsx](/d:/Personal/DealHunter/app/admin/page.tsx)
- Shared hooks: [hooks](/d:/Personal/DealHunter/hooks)
- Utilities and Supabase client: [lib](/d:/Personal/DealHunter/lib)

## Notes

- The current app is ZIP-code-first, with coordinate/radius search still present as a legacy path.
- Submission and admin access are both currently protected by hardcoded codes in the client.
- Some planned features mentioned in older docs, such as Gemini OCR-driven submission, are not wired into the current UI flow.
