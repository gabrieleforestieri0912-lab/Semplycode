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
    "Semplycode scompone la logica complessa, trova i bug istantaneamente e ti insegna a scrivere codice migliore con spiegazioni AI in tempo reale.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Semplycode",
  description:
    "Scompone la logica complessa, trova i bug istantaneamente e ti insegna a scrivere codice migliore con spiegazioni AI in tempo reale.",
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
    "Scompone la logica complessa, trova i bug istantaneamente e ti insegna a scrivere codice migliore con spiegazioni AI in tempo reale. In italiano, 20+ linguaggi.",
  inLanguage: ["it", "en"],
  featureList: [
    "Report strutturato in italiano con errore, riga e fix in diff",
    "Debug correlato a stack trace quando fornito",
    "Supporto a 20+ linguaggi di programmazione",
    "Caricamento fino a 5 file (20 su Enterprise) + ZIP e GitHub secondo piano",
    "Tipi di analisi Correzione/Revisione/Creazione con focus Sicurezza/Performance/Stile",
    "Chat AI sul codice con copia/diff",
    "Export Markdown/codice e link condivisibile, salvataggio nel Cassetto",
  ],
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "0",
    highPrice: "7.99",
    offerCount: "4",
    offers: [
      {
        "@type": "Offer",
        name: "Gratis",
        price: "0",
        priceCurrency: "EUR",
        description: "30.000 crediti / mese ≈ ~6 analisi — 1 credito ≈ 4 caratteri",
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "4.99",
        priceCurrency: "EUR",
        description: "1.500.000 crediti / mese ≈ ~300 analisi",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "7.99",
        priceCurrency: "EUR",
        description: "3.000.000 crediti / mese ≈ ~600 analisi",
      },
      {
        "@type": "Offer",
        name: "Team",
        price: "0",
        priceCurrency: "EUR",
        description: "Lista d’attesa — fatturazione centralizzata su richiesta",
        availability: "https://schema.org/PreOrder",
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
