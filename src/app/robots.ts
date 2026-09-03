import type { MetadataRoute } from 'next';

// Bot AI / motori di risposta che vogliamo possano trovare il sito (GEO/AEO)
const AI_CRAWLERS = [
  'GPTBot',            // OpenAI (ChatGPT)
  'OAI-SearchBot',     // OpenAI (SearchGPT)
  'ChatGPT-User',      // ChatGPT browsing
  'ClaudeBot',         // Anthropic Claude
  'Claude-Web',        // Anthropic Claude web
  'anthropic-ai',      // Anthropic (legacy)
  'PerplexityBot',     // Perplexity
  'Perplexity-User',
  'Google-Extended',   // Gemini / AI Overviews
  'GoogleOther',
  'Meta-ExternalAgent',// Meta AI
  'meta-externalagent',
  'Applebot-Extended', // Apple Intelligence
  'Amazonbot',         // Alexa / Rufus
  'cohere-ai',         // Cohere
  'CCBot',             // Common Crawl
  'Bytespider',        // ByteDance / TikTok
  'YouBot',            // You.com
];

const PUBLIC_RULES = {
  allow: '/',
  disallow: ['/api/', '/dashboard/', '/settings/', '/chat/'],
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Motori di ricerca tradizionali
      { userAgent: '*', ...PUBLIC_RULES },
      // Bot AI: accesso alle pagine pubbliche (non alle aree private/API)
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, ...PUBLIC_RULES })),
    ],
    sitemap: 'https://semplycode.vercel.app/sitemap.xml',
    host: 'https://semplycode.vercel.app',
  };
}
