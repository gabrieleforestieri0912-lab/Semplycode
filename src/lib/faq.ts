export interface FAQItem {
  question: string;
  answer: string;
}

export const faqsIt: FAQItem[] = [
  {
    question: "Come funziona Semplycode?",
    answer:
      "Apri Chat AI, incolla codice o carica file. L'AI produce un report con errori, spiegazioni, suggerimenti e codice corretto. Puoi anche chattare sul codice, esportare il report o condividere un link.",
  },
  {
    question: "Devo registrarmi subito?",
    answer:
      "No. Puoi provare Chat AI come ospite con 3 analisi al giorno. Con un account gratuito hai 30 crediti al mese (≈30k token, ~6 analisi), cronologia chat e dashboard. 1 credito = 1.000 token ≈ 4.000 caratteri.",
  },
  {
    question: "Quali linguaggi sono supportati?",
    answer:
      "JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, PHP, SQL, CSS, HTML, JSON e altri. Il linguaggio viene rilevato automaticamente.",
  },
  {
    question: "Come vengono trattati i miei dati?",
    answer:
      "Il codice viene inviato al motore AI per l'analisi. Se sei registrato, le chat possono essere salvate nel tuo account. Non vendiamo il tuo codice. Leggi la privacy policy per i dettagli.",
  },
  {
    question: "Posso caricare più file o uno ZIP?",
    answer:
      "Sì, fino a 5 file (100KB ciascuno) o un archivio ZIP in Chat AI. Puoi anche importare un singolo file da GitHub incollando l'URL.",
  },
  {
    question: "Qual è la differenza tra i piani?",
    answer:
      "Gratis: 30 crediti/mese ≈ ~6 analisi. Starter: 1.500 crediti/mese ≈ ~300 analisi e review approfondite. Pro: 3.000 crediti/mese ≈ ~600 analisi, ZIP e modelli avanzati. Team: lista d’attesa con fatturazione centralizzata, fino a 20 file.",
  },
  {
    question: "L'estensione Chrome è disponibile?",
    answer:
      "In arrivo: la listing sul Chrome Web Store è in preparazione (src/lib/extension.ts). Analizza codice su qualsiasi pagina dal pannello laterale una volta pubblicata; il codice analizzato non viene salvato di default.",
  },
  {
    question: "Serve connessione internet?",
    answer:
      "Sì, l'analisi AI richiede connessione. Puoi scrivere codice nell'editor offline e analizzare quando sei online.",
  },
];

export const faqsEn: FAQItem[] = [
  {
    question: "How does Semplycode work?",
    answer:
      "Open Chat AI, paste code or upload files. The AI produces a report with errors, explanations, suggestions and fixed code. You can also chat about the code, export the report or share a link.",
  },
  {
    question: "Do I need to sign up right away?",
    answer:
      "No. You can try Chat AI as a guest with 3 analyses per day. With a free account you get 30 credits per month (≈30k tokens, ~6 analyses), chat history and dashboard. 1 credit = 1,000 tokens ≈ 4,000 characters.",
  },
  {
    question: "Which languages are supported?",
    answer:
      "JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, PHP, SQL, CSS, HTML, JSON and more. The language is detected automatically.",
  },
  {
    question: "How is my data handled?",
    answer:
      "Code is sent to the AI engine for analysis. If you're registered, chats can be saved to your account. We don't sell your code. Read the privacy policy for details.",
  },
  {
    question: "Can I upload multiple files or a ZIP?",
    answer:
      "Yes, up to 5 files (100KB each) or a ZIP archive in Chat AI. You can also import a single file from GitHub by pasting the URL.",
  },
  {
    question: "What's the difference between plans?",
    answer:
      "Free: 30 credits/month ≈ ~6 analyses. Starter: 1,500 credits/month ≈ ~300 analyses and in-depth reviews. Pro: 3,000 credits/month ≈ ~600 analyses, ZIP and advanced models. Team: waitlist with centralized billing, up to 20 files.",
  },
  {
    question: "Is the Chrome extension available?",
    answer:
      "Coming soon: the Chrome Web Store listing is being prepared (src/lib/extension.ts). It analyzes code on any page from the side panel once published; analyzed code is not saved by default.",
  },
  {
    question: "Do I need an internet connection?",
    answer:
      "Yes, AI analysis requires a connection. You can write code in the editor offline and analyze when you're online.",
  },
];

// Alias IT per SEO JSON-LD (StructuredData.tsx importa `faqs`).
export const faqs: FAQItem[] = faqsIt;
