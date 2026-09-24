interface BuildAnalysisSystemPromptParams {
  analysisType?: string;
  lang?: string;
  needsLineRefs?: boolean;
  hasErrorContext?: boolean;
}

const BASE_CORRECTION = `
## Errori Trovati
[Se non ci sono errori, scrivere "Nessun errore trovato." Altrimenti, per ogni errore indicare la riga esatta e la soluzione:]
- [Errore 1] - riga X: [descrizione] -> [come correggerlo]

## Spiegazione degli Errori
[Breve spiegazione di ciascun errore e perché è problematico]

## Codice Corretto (solo fix minimi)
\`\`\`{{LANG}}
[Codice con SOLO gli errori corretti, senza ottimizzazioni extra]
\`\`\``;

const BASE_REVISION = `
## Errori Corretti
[Elenco errori trovati e fix applicati]

## Codice Revisionato e Ottimizzato
\`\`\`{{LANG}}
[Codice ripulito: naming, DRY, leggibilità, performance, gestione errori]
\`\`\`

## Miglioramenti Applicati
1. [Categoria] - [descrizione e beneficio]

## Best Practice Suggerite
- [consigli per mantenere il codice pulito in {{LANG}}]`;

const BASE_CREATION = `
## Panoramica Progetto
[Descrizione breve di cosa costruiremo e stack in {{LANG}}]

## Prerequisiti
- [tool, versioni, comandi di setup]

## Struttura Progetto
\`\`\`
[albero cartelle/file]
\`\`\`

## Passo 1 — [Titolo]
[Spiegazione + comandi + snippet codice]

## Passo 2 — [Titolo]
[Spiegazione + snippet]

## Passo 3 — [Titolo e successivi fino a progetto funzionante]

## Codice Completo Finale
\`\`\`{{LANG}}
[codice finale minimo funzionante]
\`\`\`

## Come Eseguire e Testare
[comandi run/test]

## Prossimi Passi / Estensioni
- [idee per evolvere il progetto]`;

const BASE_FULL = `
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
  correction:
    'MODALITÀ CORREZIONE: correggi SOLO gli errori sintattici, logici e di runtime. NON rifattorizzare, NON ottimizzare, NON cambiare stile oltre lo stretto necessario. Mantieni la struttura originale.',
  revision:
    'MODALITÀ REVISIONE: oltre a correggere gli errori, ripulisci e ottimizza il codice (naming, DRY, leggibilità, performance, sicurezza, gestione errori, best practice di {{LANG}}). Spiega ogni miglioramento.',
  creation:
    'MODALITÀ CREAZIONE: guida passo-passo la costruzione del progetto da zero in {{LANG}}. Parti dai prerequisiti, struttura cartelle, ogni passo con comandi e snippet, fino a un progetto funzionante. Adatta la guida a web, CLI, API, script, ecc. a seconda della richiesta.',
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

const STRUCTURE_BY_TYPE: Record<string, string> = {
  correction: BASE_CORRECTION,
  revision: BASE_REVISION,
  creation: BASE_CREATION,
};

export function buildAnalysisSystemPrompt({
  analysisType = 'correction',
  lang = 'javascript',
  needsLineRefs = false,
  hasErrorContext = false,
}: BuildAnalysisSystemPromptParams): string {
  const normalized = normalizeAnalysisType(analysisType);
  const focusRaw = TYPE_FOCUS[normalized] || TYPE_FOCUS.correction;
  const focus = focusRaw.replace(/\{\{LANG\}\}/g, lang);
  const lineRule = needsLineRefs
    ? ' Per codici oltre 50 righe, cita SEMPRE le righe con "riga XX".'
    : '';
  const errorRule = hasErrorContext
    ? ' Priorizza la correlazione tra stack trace / messaggio errore e le righe del codice.'
    : '';

  const structureRaw = STRUCTURE_BY_TYPE[normalized] || BASE_CORRECTION;
  const structure = structureRaw.replace(/\{\{LANG\}\}/g, lang);

  return `Sei un esperto Code Reviewer e Tutor italiano. Rispondi SEMPRE in italiano.
${focus}
${normalized === 'creation' ? 'Se il codice fornito è vuoto o parziale, proponi tu il progetto base coerente con la richiesta.' : 'La PRIORITÀ è il codice fornito dall\'utente.'}${errorRule}${lineRule}
Usa questa struttura Markdown (solo testo, niente emoji):
${structure}`;
}

function normalizeAnalysisType(t: string): string {
  const v = (t || '').toLowerCase().trim();
  if (['correction', 'correzione', 'correct', 'fix'].includes(v)) return 'correction';
  if (['revision', 'revisione', 'optimize', 'refactor', 'review'].includes(v)) return 'revision';
  if (['creation', 'creazione', 'create', 'project', 'guida', 'build'].includes(v)) return 'creation';
  if (['full', 'completa', 'analisi'].includes(v)) return 'revision'; // legacy full -> revision
  if (['security', 'sicurezza'].includes(v)) return 'revision';
  if (['performance', 'prestazioni'].includes(v)) return 'revision';
  if (['style', 'stile'].includes(v)) return 'revision';
  if (['debug'].includes(v)) return 'correction';
  return v || 'correction';
}

export const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  correction: 'Correzione',
  revision: 'Revisione',
  creation: 'Creazione',
  // legacy (mantenuti per compatibilità)
  full: 'Revisione (legacy)',
  security: 'Sicurezza',
  performance: 'Performance',
  style: 'Stile',
  debug: 'Debug',
};

export const ANALYSIS_TYPE_DESCRIPTIONS: Record<string, string> = {
  correction: 'Corregge solo gli errori',
  revision: 'Ripulisce e ottimizza',
  creation: 'Guida passo-passo al progetto',
};
