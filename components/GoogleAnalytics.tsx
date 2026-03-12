'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Re-export GA functions from the main utils file
export { 
  trackEvent as trackGAEvent,
  pageview,
  setUserProperties as setGAUserProperties 
} from '@/lib/utils/google-analytics';

// Import for use in this file
import { pageview } from '@/lib/utils/google-analytics';

// GA Measurement ID from environment
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Inner component that uses useSearchParams
function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  if (!GA_ID) {
    console.warn('Google Analytics ID not set. Set NEXT_PUBLIC_GA_ID in .env.local');
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_title: document.title,
            send_page_view: false,
            allow_google_signals: true,
            allow_ad_personalization_signals: true,
            custom_map: {
              'dimension1': 'cuisine_preference',
              'dimension2': 'user_fingerprint',
              'dimension3': 'location_zipcode'
            }
          });
        `}
      </Script>
      
      {/* Route change tracking */}
      <Suspense fallback={null}>
        <GoogleAnalyticsInner />
      </Suspense>
    </>
  );
}
