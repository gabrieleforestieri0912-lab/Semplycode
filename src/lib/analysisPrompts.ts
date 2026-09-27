interface BuildAnalysisSystemPromptParams {
  analysisType?: string;
  lang?: string;
  needsLineRefs?: boolean;
  hasErrorContext?: boolean;
}

/**
 * Regole di qualità vincolanti per ogni analisi: l'utente deve potersi fidare
 * del report quando ha un problema reale di codice. Niente superficialità:
 * ogni affermazione deve avere una prova (riga + frammento di codice).
 */
const QUALITY_RULES = `
Regole di qualità (tassative):
- Analizza DAVVERO il codice riga per riga: cita sempre riga esatta e frammento di codice per ogni problema ("riga 12: \`totale += ...\`").
- Classifica ogni problema per gravità: [Critico] blocca o rompe, [Importante] bug probabile o rischio, [Minore] stile/robustezza.
- MAI inventare errori: se il codice è corretto, scrivi "Nessun errore trovato" e spiega perché regge (casi limite verificati).
- Ogni fix deve essere verificato mentalmente sul codice dato: niente soluzioni generiche copia-incolla, niente consigli vaghi ("fai attenzione", "potresti migliorare").
- Spiega il PERCHÉ di ogni errore (causa-effetto), non solo il cosa.
- Chiudi con "Come verificare": comandi o casi di test concreti per confermare che il fix funziona.
- Conciso ma completo: niente riempitivo, niente emoji.`;

const BASE_CORRECTION = `
## Errori Trovati
[Se non ci sono errori reali, scrivere "Nessun errore trovato." Altrimenti, per ogni errore: gravità ([Critico]/[Importante]/[Minore]), riga esatta, frammento di codice e soluzione:]
- [Critico] - riga X: \`frammento\` - [descrizione] -> [come correggerlo]

## Spiegazione degli Errori
[Per ciascun errore: causa-effetto, perché è problematico, in quali casi si manifesta]

## Codice Corretto (solo fix minimi)
\`\`\`{{LANG}}
[Codice con SOLO gli errori corretti, senza ottimizzazioni extra]
\`\`\`

## Come Verificare
[Comandi o casi di test concreti per confermare ogni fix]`;

const BASE_REVISION = `
## Errori Corretti
[Elenco errori trovati con gravità, riga esatta e frammento di codice; se nessuno, scrivere "Nessun errore trovato."]

## Codice Revisionato e Ottimizzato
\`\`\`{{LANG}}
[Codice ripulito: naming, DRY, leggibilità, performance, gestione errori]
\`\`\`

## Miglioramenti Applicati
1. [Categoria] - riga X - [descrizione, beneficio misurabile e perché è meglio così]

## Best Practice Suggerite
- [consigli specifici per QUESTO codice in {{LANG}}, non generici]

## Come Verificare
[Comandi o casi di test concreti per confermare che tutto funziona]`;

const BASE_CREATION = `
## Panoramica Progetto
[Descrizione concreta di cosa costruiremo e stack in {{LANG}}, scelte motivate in 1-2 righe]

## Prerequisiti
- [tool e versioni esatte, comandi di setup verificabili]

## Struttura Progetto
\`\`\`
[albero cartelle/file reale, non placeholder]
\`\`\`

## Passo 1 — [Titolo]
[Obiettivo del passo, comandi + snippet codice completo e funzionante]

## Passo 2 — [Titolo]
[Come sopra, ogni passo produce qualcosa di verificabile]

## Passo 3 — [Titolo e successivi fino a progetto funzionante]

## Codice Completo Finale
\`\`\`{{LANG}}
[codice finale minimo ma davvero funzionante, niente TODO o "..."]
\`\`\`

## Come Eseguire e Testare
[comandi run/test esatti con output atteso]

## Prossimi Passi / Estensioni
- [idee concrete con punto di partenza nel codice sopra]`;

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
  const raw = (analysisType || '').toLowerCase().trim();
  const normalized = normalizeAnalysisType(analysisType);
  // Il focus specifico (es. Sicurezza, Performance) ha precedenza su quello normalizzato.
  const focusRaw = TYPE_FOCUS[raw] || TYPE_FOCUS[normalized] || TYPE_FOCUS.correction;
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
${QUALITY_RULES}
Usa questa struttura Markdown (solo testo, niente emoji):
${structure}`;
}

/**
 * Regole di profondità per le domande libere in chat (follow-up sul codice):
 * risposte concrete e verificabili, mai generiche.
 */
export const REVIEWER_DEPTH_RULES =
  'Sii concreto e approfondito: cita righe e frammenti reali del codice, spiega il perché, proponi fix verificati. MAI risposte generiche o superficiali e MAI errori inventati: se qualcosa non è un problema, dillo chiaramente.';

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
