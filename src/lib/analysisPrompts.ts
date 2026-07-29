interface BuildAnalysisSystemPromptParams {
  analysisType?: string;
  lang?: string;
  needsLineRefs?: boolean;
  hasErrorContext?: boolean;
}

const BASE_STRUCTURE = `
## Errori Trovati
[Se non ci sono errori, scrivere "Nessun errore trovato." Altrimenti, per ogni errore indicare la riga esatta e la soluzione:]
- [Errore 1] - riga X: [descrizione dell'errore] -> [come correggerlo]

## Spiegazione degli Errori
[Breve spiegazione di ciascun errore trovato e perché è problematico]

## Suggerimenti di Miglioramento
[Dopo gli errori, ottimizzazioni e best practices]
1. [Tipo] - [descrizione]

## Codice Corretto
\`\`\`{{LANG}}
[Codice con tutti gli errori corretti]
\`\`\``;

const TYPE_FOCUS: Record<string, string> = {
  full: 'Analisi completa: errori, spiegazioni, miglioramenti e codice corretto.',
  security:
    'Focus SICUREZZA: vulnerabilità (injection, XSS, secret esposti, auth debole), rischi e fix prioritari.',
  performance:
    'Focus PERFORMANCE: complessità, allocazioni, query lente, loop inefficienti, ottimizzazioni concrete.',
  style:
    'Focus STILE E MANUTENIBILITÀ: naming, struttura, DRY, leggibilità, convenzioni del linguaggio.',
  debug:
    "Focus DEBUG: usa il messaggio di errore/stack trace fornito dall'utente per individuare la causa radice e proporre fix mirati.",
};

export function buildAnalysisSystemPrompt({
  analysisType = 'full',
  lang = 'javascript',
  needsLineRefs = false,
  hasErrorContext = false,
}: BuildAnalysisSystemPromptParams): string {
  const focus = TYPE_FOCUS[analysisType] || TYPE_FOCUS.full;
  const lineRule = needsLineRefs
    ? ' Per codici oltre 50 righe, cita SEMPRE le righe con "riga XX".'
    : '';
  const errorRule = hasErrorContext
    ? ' Priorizza la correlazione tra stack trace / messaggio errore e le righe del codice.'
    : '';

  const structure = BASE_STRUCTURE.replace(/\{\{LANG\}\}/g, lang);

  return `Sei un esperto Code Reviewer italiano. Rispondi SEMPRE in italiano.
${focus}
La PRIORITÀ è individuare, spiegare e correggere gli errori.${errorRule}${lineRule}
Usa questa struttura Markdown (solo testo, niente emoji):
${structure}`;
}

export const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  full: 'Completa',
  security: 'Sicurezza',
  performance: 'Performance',
  style: 'Stile',
  debug: 'Debug errore',
};
