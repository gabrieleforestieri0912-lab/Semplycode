"use client";

/**
 * Smart merge tra codice editor (oldCode) e suggerimento AI (suggested).
 * Problema originale: l'AI restituisce spesso solo un frammento (es. una
 * funzione fixata) e l'"Applica" sostituiva l'intero editor con quel
 * frammento, cancellando tutto il resto.
 *
 * Strategia:
 * 1. Se il suggerimento contiene già tutto (o è già contenuto) -> full/already.
 * 2. Se sembra il file completo -> full replace sicuro.
 * 3. Altrimenti tenta patch chirurgica: per ogni blocco nominato nel
 *    suggerimento (function/class/const...), sostituisce il blocco omonimo
 *    nel codice originale tramite bilanciamento delle graffe.
 * 4. Se nessun blocco combacia -> fragment non sicuro: il chiamante deve
 *    mostrare un avviso e NON sostituire in silenzio.
 */

export type MergeMode = "full" | "patch" | "fragment" | "already-applied" | "empty";

export interface MergeResult {
  mode: MergeMode;
  /** Codice risultante da applicare (oldCode patchato oppure suggested se full). */
  merged: string;
  /** Nomi dei blocchi sostituiti (solo per mode=patch). */
  patchedBlocks: string[];
  /** True se è sicuro sostituire senza perdere codice. */
  safe: boolean;
  /** Messaggio spiegazione per la UI. */
  note: string;
}

function normalize(s: string): string {
  return (s || "").replace(/\r\n/g, "\n");
}

/** Dichiara se il suggerimento sembra un file completo rispetto all'originale. */
function looksLikeFullFile(oldLines: number, newLines: number): boolean {
  if (newLines === 0) return false;
  // File corti: quasi sempre full.
  if (oldLines <= 15) return true;
  // Se il suggerimento è almeno il 70% delle righe -> probabile file completo.
  if (newLines >= oldLines * 0.7) return true;
  // Suggerimento lungo in assoluto ma old corto -> full.
  if (newLines >= 40 && newLines >= oldLines * 0.5) return true;
  return false;
}

interface NamedBlock {
  name: string;
  kind: string;
  start: number; // indice riga inizio
  end: number; // indice riga fine (inclusiva)
  text: string;
}

/**
 * Estrae blocchi di primo livello: function nome, class nome,
 * const/let/var nome = (... => ... / function / oggetto con graffe).
 * Usa bilanciamento graffe a partire dalla prima "{" della dichiarazione.
 */
function extractNamedBlocks(code: string): NamedBlock[] {
  const lines = normalize(code).split("\n");
  const blocks: NamedBlock[] = [];
  const declRe =
    /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|class\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=)/;

  for (let i = 0; i < lines.length; i++) {
    const m = declRe.exec(lines[i]);
    if (!m) continue;
    const name = m[1] || m[2] || m[3];
    if (!name) continue;
    // Evita duplicati annidati: prendi solo se non dentro un blocco già catturato.
    if (blocks.some((b) => i >= b.start && i <= b.end)) continue;
    const end = findBlockEnd(lines, i);
    blocks.push({
      name,
      kind: m[1] ? "function" : m[2] ? "class" : "const",
      start: i,
      end,
      text: lines.slice(i, end + 1).join("\n"),
    });
  }
  return blocks;
}

/** Trova la riga di chiusura bilanciando { } a partire dalla riga start. */
function findBlockEnd(lines: string[], start: number): number {
  let depth = 0;
  let seenOpen = false;
  // Cerca la prima graffa aperta da start in poi (max 15 righe, per arrow/obj multilinea).
  let openLine = start;
  for (let i = start; i < Math.min(start + 15, lines.length); i++) {
    if (lines[i].includes("{")) {
      openLine = i;
      break;
    }
    // Arrow function a riga singola senza graffe: blocco = dichiarazione stessa.
    if (i > start && /=>\s*[^;{]*;?\s*$/.test(lines[i])) {
      return i;
    }
  }
  for (let i = openLine; i < lines.length; i++) {
    const line = stripStringsAndComments(lines[i]);
    for (const ch of line) {
      if (ch === "{") {
        depth++;
        seenOpen = true;
      } else if (ch === "}") {
        depth--;
        if (seenOpen && depth <= 0) return i;
      }
    }
    // Sicurezza: blocchi enormi -> ferma a 600 righe.
    if (i - openLine > 600) return i;
  }
  // Nessuna graffa: blocco monoriga.
  if (!seenOpen) return start;
  return lines.length - 1;
}

/** Rimuove stringhe e commenti // per non contare graffe spurie. */
function stripStringsAndComments(line: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      continue;
    }
    if (c === "/" && line[i + 1] === "/") break;
    out += c;
  }
  return out;
}

/** Sostituisce nel vecchio codice il blocco omonimo con il nuovo testo. */
function replaceBlockByName(oldCode: string, name: string, newBlockText: string): { code: string; replaced: boolean } {
  const lines = normalize(oldCode).split("\n");
  const declRe = new RegExp(
    `^\\s*(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?(?:function\\s+${name}\\b|class\\s+${name}\\b|(?:const|let|var)\\s+${name}\\s*=)`,
  );
  for (let i = 0; i < lines.length; i++) {
    if (!declRe.test(lines[i])) continue;
    const end = findBlockEnd(lines, i);
    const next = [...lines.slice(0, i), ...newBlockText.split("\n"), ...lines.slice(end + 1)].join("\n");
    return { code: next, replaced: true };
  }
  return { code: oldCode, replaced: false };
}

export function mergeSuggestion(oldCode: string, suggested: string): MergeResult {
  const oldN = normalize(oldCode ?? "");
  const sugN = normalize(suggested ?? "");
  const oldTrim = oldN.trim();
  const sugTrim = sugN.trim();

  if (!sugTrim) {
    return { mode: "empty", merged: oldN, patchedBlocks: [], safe: false, note: "Suggerimento vuoto." };
  }
  if (!oldTrim) {
    return { mode: "full", merged: sugN, patchedBlocks: [], safe: true, note: "Editor vuoto: inserimento diretto." };
  }
  if (oldTrim === sugTrim) {
    return { mode: "already-applied", merged: oldN, patchedBlocks: [], safe: true, note: "Codice già identico." };
  }
  // Suggerimento già contenuto nell'editor -> niente da fare.
  if (oldN.includes(sugTrim) || oldTrim.includes(sugTrim)) {
    return { mode: "already-applied", merged: oldN, patchedBlocks: [], safe: true, note: "Frammento già presente nel codice." };
  }

  const oldLines = oldN.split("\n").length;
  const sugLines = sugN.split("\n").length;

  if (looksLikeFullFile(oldLines, sugLines)) {
    return { mode: "full", merged: sugN, patchedBlocks: [], safe: true, note: "Il suggerimento sembra il file completo." };
  }

  // Tentativo patch chirurgica per blocchi nominati.
  const sugBlocks = extractNamedBlocks(sugN);
  if (sugBlocks.length > 0) {
    let patched = oldN;
    const patchedNames: string[] = [];
    let anyReplaced = false;
    for (const b of sugBlocks) {
      const res = replaceBlockByName(patched, b.name, b.text);
      if (res.replaced) {
        patched = res.code;
        anyReplaced = true;
        patchedNames.push(b.name);
      }
    }
    if (anyReplaced) {
      // Se restano blocchi del suggerimento senza corrispondenza, accodali?
      // No: meglio non inventare. Segnaliamo solo quelli patchati.
      const missing = sugBlocks.filter((b) => !patchedNames.includes(b.name));
      const note =
        missing.length === 0
          ? `Patch applicata ai blocchi: ${patchedNames.join(", ")}. Il resto del file è intatto.`
          : `Patch parziale (${patchedNames.join(", ")}). Non trovati: ${missing.map((b) => b.name).join(", ")}.`;
      return { mode: "patch", merged: patched, patchedBlocks: patchedNames, safe: true, note };
    }
  }

  // Fallback: cerca ancoraggio fuzzy (prime 3 righe non vuote del suggerimento
  // presenti nell'originale) -> sostituisci finestra di pari lunghezza.
  const fuzzy = tryFuzzyWindowReplace(oldN, sugN);
  if (fuzzy) {
    return {
      mode: "patch",
      merged: fuzzy,
      patchedBlocks: [],
      safe: true,
      note: "Patch applicata per ancoraggio di righe corrispondenti. Il resto del file è intatto.",
    };
  }

  return {
    mode: "fragment",
    merged: oldN,
    patchedBlocks: [],
    safe: false,
    note:
      "Il suggerimento è un frammento e non è stato trovato il punto esatto nel file. " +
      "Sostituirlo cancellerebbe il resto del codice: controlla l'anteprima o copia il codice.",
  };
}

/** Se le prime righe del suggerimento esistono nell'originale, sostituisce lì. */
function tryFuzzyWindowReplace(oldCode: string, suggested: string): string | null {
  const oldLines = oldCode.split("\n");
  const sugLines = suggested.split("\n");
  if (sugLines.length < 3 || sugLines.length >= oldLines.length) return null;
  const sigLines = sugLines.map((l) => l.trim()).filter(Boolean).slice(0, 3);
  if (sigLines.length < 2) return null;
  // Cerca la prima riga significativa nel vecchio codice.
  for (let i = 0; i < oldLines.length; i++) {
    if (oldLines[i].trim() === sigLines[0]) {
      // Verifica che almeno 2 delle 3 righe combacino in sequenza (tolleranza).
      let hits = 0;
      for (let k = 0; k < sigLines.length && i + k < oldLines.length; k++) {
        if (oldLines[i + k].trim() === sigLines[k]) hits++;
      }
      if (hits >= 2) {
        const next = [...oldLines.slice(0, i), ...sugLines, ...oldLines.slice(i + sugLines.length)].join("\n");
        return next;
      }
    }
  }
  return null;
}
