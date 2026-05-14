import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StyledJsxRegistry from "./registry";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/lib/auth";
import Analytics from "@/app/components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://semplycode.com'),
  title: {
    default: 'Semplycode | Analisi Intelligente del Codice',
    template: '%s | Semplycode',
  },
  description: 'Il tuo compagno AI per analizzare, debuggare e ottimizzare il codice. Analisi intelligente del codice in linguaggio semplice.',
  keywords: ['analisi codice AI', 'debug codice', 'assistente programmazione', 'ottimizzazione codice AI', 'imparare programmazione', 'spiegazione codice', 'strumenti sviluppatori'],
  authors: [{ name: 'Semplycode' }],
  creator: 'Semplycode',
  publisher: 'Semplycode',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://semplycode.com',
    siteName: 'Semplycode',
    title: 'Semplycode | Analisi Intelligente del Codice',
    description: 'Il tuo compagno AI per analizzare, debuggare e ottimizzare il codice.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Semplycode - Analisi Intelligente del Codice',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Semplycode | Analisi Intelligente del Codice',
    description: 'Il tuo compagno AI per analizzare, debuggare e ottimizzare il codice.',
    images: ['/og-image.png'],
    creator: '@semplycode',
  },
  alternates: {
    languages: {
      'en': 'https://semplycode.com',
      'it': 'https://semplycode.com?lang=it',
    },
  },
  icons: {
    icon: "/semplycode.png",
    apple: "/semplycode.png",
    shortcut: "/semplycode.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#064e3b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Semplycode" />
        <link rel="icon" type="image/png" href="/semplycode.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/semplycode.png" sizes="16x16" />
        <link rel="shortcut icon" href="/semplycode.png" />
        <link rel="apple-touch-icon" href="/semplycode.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Analytics />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            <StyledJsxRegistry>
              <div className="app-shell">
                <header className="site-header" role="banner" aria-label="Site header">
                  <a href="/" className="site-brand" aria-label="Semplycode home">Semplycode</a>
                  <div className="site-actions" aria-hidden>
                    <a href="/profile" className="header-link">Account</a>
                  </div>
                </header>

                <main id="main" className="content" role="main">
                  {children}
                </main>

                <nav className="bottom-nav" role="navigation" aria-label="Bottom navigation">
                  <a className="nav-item" href="/">Analisi</a>
                  <a className="nav-item" href="/history">Cronologia</a>
                  <a className="nav-item" href="/share">Condividi</a>
                  <a className="nav-item" href="/profile">Account</a>
                </nav>
              </div>
            </StyledJsxRegistry>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
