import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import QueryProvider from '@/components/QueryProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import PreferenceSelector from '@/components/PreferenceSelector';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingActionButton from '@/components/layout/FloatingActionButton';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'DesiDeals - Premium Food, Restaurant & Happy Hour Offers',
  description:
    'Discover curated restaurant, food, and happy hour deals near you with a polished premium experience.',
  keywords:
    'restaurant deals, happy hour, food offers, indian food, desi deals, local dining discounts',
  authors: [{ name: 'DesiDeals' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#111111',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    send_page_view: false,
                    custom_map: {
                      custom_parameter_1: 'user_id',
                      custom_parameter_2: 'location_zip',
                      custom_parameter_3: 'cuisine_preference',
                    }
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${manrope.variable} ${cormorant.variable} font-sans`}>
        <QueryProvider>
          <GoogleAnalytics />
          <PreferenceSelector />
          <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(255,248,235,0.95),_rgba(245,241,233,0.92)_40%,_rgba(241,237,230,1)_100%)] text-neutral-950">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(255,201,120,0.18),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(58,90,64,0.09),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.38),transparent_22%,transparent_78%,rgba(255,255,255,0.44))]" />
            <div className="relative">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <FloatingActionButton />
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
