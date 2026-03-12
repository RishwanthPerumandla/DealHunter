# DesiDeals - Restaurant Deal Aggregator

A community-driven restaurant deal discovery platform focused on Indian and Desi cuisine. Find the best deals near you, share deals you discover, and help others save money.

![DesiDeals Screenshot](screenshot.png)

## Features

- 📍 **Location-Based Discovery**: Find deals within 5km of your location
- 📸 **Snap-to-Share**: Take a photo of any menu/deal board - our AI extracts the details
- 👍 **Community Voting**: Upvote great deals, downvote expired ones
- 🔍 **Smart Filters**: Filter by cuisine type, deal type, and more
- 🗺️ **Directions**: Get directions to restaurants with one tap
- 💯 **100% Free**: No sign-ups, no subscriptions

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **AI**: Google Gemini 1.5 Flash for OCR
- **Animations**: Framer Motion
- **State Management**: React Query

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier)
- Google Gemini API key (free tier)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rishwanthperumandla/desideals.git
cd desideals
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

5. Set up the database:
   - Follow the steps in `SUPABASE_SETUP.md`
   - Run all SQL commands in Supabase SQL Editor

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
desideals/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── about/             # About page
│   ├── admin/             # Admin dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── deals/            # Deal-related components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and database
│   ├── db/              # Database client
│   └── utils/           # Helper functions
├── types/                # TypeScript types
└── supabase/            # Supabase migrations
```

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- `user_fingerprints`: Anonymous user tracking
- `restaurants`: Restaurant information
- `deals`: Deal listings with voting
- `votes`: User votes on deals
- `analytics_events`: Usage tracking

See `SUPABASE_SETUP.md` for complete schema.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Supabase Storage

Remember to set up the `restaurant-images` bucket in Supabase Storage and make it public.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [Google Gemini](https://ai.google.dev) for the OCR capabilities
- [OpenStreetMap](https://www.openstreetmap.org) for geocoding
