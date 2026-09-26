export interface FAQItem {
  question: string;
  answer: string;
}

export const faqs: FAQItem[] = [
  {
    question: "Come funziona Semplycode?",
    answer:
      "Apri Chat AI, incolla codice o carica file. L'AI produce un report con errori, spiegazioni, suggerimenti e codice corretto. Puoi anche chattare sul codice, esportare il report o condividere un link.",
  },
  {
    question: "Devo registrarmi subito?",
    answer:
      "No. Puoi provare Chat AI come ospite con 3 analisi al giorno. Con un account gratuito hai 100.000 crediti al mese (≈ ~20 analisi), cronologia chat e dashboard. 1 credito = 1 token ≈ 4 caratteri.",
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
      "Gratis: 100.000 crediti/mese ≈ ~20 analisi. Starter: 1.500.000 crediti/mese ≈ ~300 analisi e review approfondite. Pro: 3.000.000 crediti/mese ≈ ~600 analisi, ZIP e modelli avanzati. Team: lista d’attesa con fatturazione centralizzata, fino a 20 file.",
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
