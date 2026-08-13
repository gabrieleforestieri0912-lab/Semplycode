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
      "No. Puoi provare Chat AI come ospite con 3 analisi al giorno. Con un account gratuito hai 10 analisi giornaliere, cronologia chat e dashboard.",
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
      "Gratuito: 10 analisi al giorno. Pro: analisi illimitate e funzionalità avanzate. Enterprise: per team con esigenze dedicate.",
  },
  {
    question: "L'estensione Chrome è disponibile?",
    answer:
      "L'estensione è in arrivo. Nel frattempo usa Chat AI sul web e il caricamento file per analizzare il tuo codice.",
  },
  {
    question: "Serve connessione internet?",
    answer:
      "Sì, l'analisi AI richiede connessione. Puoi scrivere codice nell'editor offline e analizzare quando sei online.",
  },
];
