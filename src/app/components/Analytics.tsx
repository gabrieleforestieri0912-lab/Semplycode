'use client';

import Script from 'next/script';

export default function Analytics() {
  const analyticsDomain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Priority: Plausible first, then Google Analytics fallback
  if (analyticsDomain) {
    return (
      <Script
        defer
        data-domain={analyticsDomain}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
    );
  }

  if (gaId) {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </Script>
      </>
    );
  }

  // No analytics configured
  return null;
}
