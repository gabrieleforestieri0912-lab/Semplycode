import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StyledJsxRegistry from "./registry";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/lib/auth";
import Analytics from "@/app/components/Analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import StructuredData from "@/app/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://semplycode.com"),
  title: {
    default: "Semplycode | Analisi Intelligente del Codice",
    template: "%s | Semplycode",
  },
  description:
    "Il tuo compagno AI per analizzare, debuggare e ottimizzare il codice. Analisi intelligente del codice in linguaggio semplice.",
  keywords: [
    "analisi codice AI",
    "debug codice",
    "assistente programmazione",
    "ottimizzazione codice AI",
    "imparare programmazione",
    "spiegazione codice",
    "strumenti sviluppatori",
  ],
  authors: [{ name: "Semplycode" }],
  creator: "Semplycode",
  publisher: "Semplycode",
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
    url: "https://semplycode.com",
    siteName: "Semplycode",
    title: "Semplycode | Analisi Intelligente del Codice",
    description:
      "Il tuo compagno AI per analizzare, debuggare e ottimizzare il codice.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Semplycode - Analisi Intelligente del Codice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Semplycode | Analisi Intelligente del Codice",
    description:
      "Il tuo compagno AI per analizzare, debuggare e ottimizzare il codice.",
    images: ["/og-image.png"],
    creator: "@semplycode",
  },
  alternates: {
    canonical: "https://semplycode.com",
  },
  icons: {
    icon: "/semplycode.png",
    apple: "/semplycode.png",
    shortcut: "/semplycode.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Semplycode" />
        <link
          rel="icon"
          type="image/png"
          href="/semplycode.png"
          sizes="32x32"
        />
        <link
          rel="icon"
          type="image/png"
          href="/semplycode.png"
          sizes="16x16"
        />
        <link rel="shortcut icon" href="/semplycode.png" />
        <link rel="apple-touch-icon" href="/semplycode.png" />
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
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
            <StyledJsxRegistry>
              <div className="app-shell">
                <main id="main" className="content pt-16" role="main">
                  {children}
                </main>
              </div>
            </StyledJsxRegistry>
          </AuthProvider>
        </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
