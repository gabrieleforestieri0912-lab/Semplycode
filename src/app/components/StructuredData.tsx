import { faqs } from "@/lib/faq";

const SITE_URL = "https://semplycode.vercel.app";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Semplycode",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/semplycode.png`,
  },
  description:
    "Semplycode è il tuo compagno AI per analizzare, debuggare e ottimizzare il codice in linguaggio semplice.",
  sameAs: ["https://github.com/gabrieleforestieri0912-lab"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Semplycode",
  description:
    "Analisi intelligente del codice con AI: trova bug, ottimizza e impara a programmare con spiegazioni in italiano.",
  inLanguage: "it",
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Semplycode",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Assistente AI che analizza codice sorgente in oltre 20 linguaggi, trova bug, spiega la logica e propone correzioni, con spiegazioni in italiano.",
  inLanguage: ["it", "en"],
  featureList: [
    "Analisi intelligente del codice con report su errori e correzioni",
    "Debug con stack trace",
    "Supporto a 20+ linguaggi di programmazione",
    "Caricamento file e archivi ZIP",
    "Import file da GitHub",
    "Review di sicurezza, performance e stile",
    "Chat AI sul codice",
    "Export e condivisione dei report",
  ],
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "0",
    highPrice: "49.99",
    offerCount: "4",
    offers: [
      {
        "@type": "Offer",
        name: "Gratis",
        price: "0",
        priceCurrency: "EUR",
        description: "10 analisi AI al giorno",
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "9.99",
        priceCurrency: "EUR",
        description: "100 analisi AI al giorno",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "19.99",
        priceCurrency: "EUR",
        description: "Analisi AI illimitate",
      },
      {
        "@type": "Offer",
        name: "Enterprise",
        price: "49.99",
        priceCurrency: "EUR",
        description: "Per team con esigenze dedicate",
      },
    ],
  },
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "it",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function StructuredData() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={softwareSchema} />
      <JsonLd data={faqSchema} />
    </>
  );
}
