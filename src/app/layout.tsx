import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import StyledJsxRegistry from "./registry";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/lib/auth";
import { MotionConfig } from "framer-motion";
import Analytics from "@/app/components/Analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import StructuredData from "@/app/components/StructuredData";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://semplycode.vercel.app"),
  title: {
    default: "Semplycode | Correttore e Debug Codice AI in Italiano",
    template: "%s | Semplycode",
  },
  description:
    "Semplycode è il correttore e revisore di codice AI in italiano: trova bug, spiega gli errori riga per riga e propone fix in 20+ linguaggi. Analisi gratis, senza installazione.",
  keywords: [
    "semplycode",
    "correttore codice AI",
    "debug codice online",
    "revisione codice",
    "code reviewer AI italiano",
    "trovare bug codice",
    "spiegazione errori codice",
    "analizzatore codice",
    "AI per programmatori",
    "code review automatica",
  ],
  authors: [{ name: "Semplycode" }],
  creator: "Semplycode",
  publisher: "Semplycode",
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://semplycode.vercel.app",
    siteName: "Semplycode",
    title: "Semplycode | Correttore e Debug Codice AI in Italiano",
    description:
      "Trova bug, spiega gli errori riga per riga e propone fix in 20+ linguaggi. Analisi gratis, senza installazione.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Semplycode - Smetti di combattere con il codice. Inizia a capirlo. — Esempio reale con bug evidenziato e fix in diff",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Semplycode | Correttore e Debug Codice AI in Italiano",
    description:
      "Trova bug, spiega gli errori riga per riga e propone fix in 20+ linguaggi. Analisi gratis, senza installazione.",
    images: ["/og-image.png"],
    creator: "@semplycode",
  },
  alternates: {
    canonical: "https://semplycode.vercel.app",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/semplycode.png", sizes: "1254x1254", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-48x48.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Semplycode" />
        <link
          rel="icon"
          type="image/png"
          href="/favicon-32x32.png"
          sizes="32x32"
        />
        <link
          rel="icon"
          type="image/png"
          href="/favicon-16x16.png"
          sizes="16x16"
        />
        <link rel="shortcut icon" href="/favicon-48x48.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <StructuredData />
        <Analytics />
        <VercelAnalytics />
        <SpeedInsights />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
            <MotionConfig reducedMotion="user">
            <StyledJsxRegistry>
              <div className="app-shell">
                <main id="main" className="content" role="main">
                  {children}
                </main>
              </div>
            </StyledJsxRegistry>
            </MotionConfig>
          </AuthProvider>
        </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
