import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import QueryProvider from '@/components/QueryProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import PreferenceSelector from '@/components/PreferenceSelector';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DesiDeals - Restaurant Deal Aggregator',
  description: 'Discover the best restaurant deals near you. Community-driven deals for Indian, Desi, and international cuisine.',
  keywords: 'restaurant deals, food discounts, indian food, desi deals, happy hour, buffet offers',
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
  themeColor: '#FF9933',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
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
      <body className={inter.className}>
        <QueryProvider>
          {/* Google Analytics Tracking */}
          <GoogleAnalytics />
          
          {/* Cuisine Preference Selector */}
          <PreferenceSelector />
          
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
