"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { codeSnippets, type CodeSnippet } from "@/lib/codeSnippets";

type TokenKind = "kw" | "fn" | "str" | "com" | "num" | "plain";
type Token = [text: string, kind: TokenKind];
type TokenLine = Token[];

interface CodeFloatBackgroundProps {
  /** "hero": blocchi di codice su tutta la sezione. "sides": concentrati ai lati (login/register). */
  variant?: "hero" | "sides";
  /** Durata base di un ciclo su/giù in secondi (ogni blocco varia intorno a questo valore). */
  speed?: number;
  /** Linguaggi mostrati, mescolati tra i blocchi. */
  languages?: CodeSnippet["language"][];
  /** Opacità base dei blocchi di codice. */
  opacity?: number;
  className?: string;
}

const LANGS = ["javascript", "typescript", "python", "jsx", "java", "go", "rust", "php", "sql", "cpp", "csharp", "css"] as const;
type Lang = (typeof LANGS)[number];

interface Palette {
  kw: string;
  fn: string;
  str: string;
  com: string;
  num: string;
  plain: string;
}

const LIGHT_PALETTE: Palette = {
  kw: "#059669",
  fn: "#7c3aed",
  str: "#d97706",
  com: "#64748b",
  num: "#dc2626",
  plain: "#1e293b",
};

const DARK_PALETTE: Palette = {
  kw: "#6ee7b7",
  fn: "#c4b5fd",
  str: "#fcd34d",
  com: "#94a3b8",
  num: "#f87171",
  plain: "#e2e8f0",
};

// Overlay radiale: centro opaco (testo hero leggibile) e lati trasparenti così i pezzi stanno intorno alle scritte senza contrasto
const LIGHT_OVERLAY =
  "radial-gradient(ellipse 68% 58% at 50% 42%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 28%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0.18) 68%, rgba(255,255,255,0) 82%)";
const DARK_OVERLAY =
  "radial-gradient(ellipse 68% 58% at 50% 42%, rgba(8,13,20,0.96) 0%, rgba(8,13,20,0.88) 28%, rgba(8,13,20,0.55) 48%, rgba(8,13,20,0.18) 68%, rgba(8,13,20,0) 82%)";

/* Variante "sides": overlay orizzontale, trasparente ai bordi (codice visibile) e chiaro al centro (form leggibile) */
const LIGHT_SIDES_OVERLAY =
  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.82) 32%, rgba(255,255,255,0.94) 50%, rgba(255,255,255,0.82) 68%, rgba(255,255,255,0) 100%)";
const DARK_SIDES_OVERLAY =
  "linear-gradient(90deg, rgba(8,13,20,0) 0%, rgba(8,13,20,0.82) 32%, rgba(8,13,20,0.94) 50%, rgba(8,13,20,0.82) 68%, rgba(8,13,20,0) 100%)";

/* Keyword per linguaggio: usate dal tokenizer per l'evidenziazione. */
const KEYWORDS: Record<Lang, ReadonlySet<string>> = {
  javascript: new Set([
    "async", "await", "const", "let", "var", "function", "return", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "new", "class", "this", "typeof", "instanceof",
    "try", "catch", "finally", "throw", "import", "from", "export", "default", "extends", "super",
    "yield", "delete", "void", "in", "of", "null", "undefined", "true", "false",
  ]),
  typescript: new Set([
    "async", "await", "const", "let", "var", "function", "return", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "new", "class", "this", "typeof", "instanceof",
    "try", "catch", "finally", "throw", "import", "from", "export", "default", "extends", "super",
    "yield", "delete", "void", "in", "of", "null", "undefined", "true", "false", "interface",
    "type", "readonly", "public", "private", "implements", "keyof", "as", "satisfies",
    "unknown", "any",
  ]),
  python: new Set([
    "def", "return", "import", "from", "as", "class", "if", "elif", "else", "for", "while", "in",
    "not", "and", "or", "try", "except", "finally", "with", "lambda", "yield", "async", "await",
    "pass", "raise", "is", "None", "True", "False", "global", "nonlocal", "match", "case",
  ]),
  jsx: new Set([
    "async", "await", "const", "let", "var", "function", "return", "if", "else", "for", "while",
    "new", "class", "this", "typeof", "try", "catch", "throw", "import", "from", "export",
    "default", "extends", "null", "undefined", "true", "false",
  ]),
  java: new Set([
    "public", "private", "protected", "class", "interface", "extends", "implements", "return", "if", "else", "for", "while", "switch", "case", "break", "default", "new", "import", "static", "final", "void", "boolean", "String", "int", "true", "false", "null", "throw", "try", "catch",
  ]),
  go: new Set([
    "func", "return", "if", "else", "for", "range", "switch", "case", "default", "break", "continue", "import", "package", "var", "const", "type", "struct", "interface", "map", "chan", "go", "defer", "select",
  ]),
  rust: new Set([
    "fn", "return", "if", "else", "for", "while", "loop", "match", "case", "break", "continue", "let", "mut", "const", "struct", "enum", "impl", "pub", "use", "mod", "crate", "true", "false",
  ]),
  php: new Set([
    "function", "return", "if", "else", "elseif", "for", "foreach", "while", "switch", "case", "break", "default", "class", "public", "private", "protected", "new", "try", "catch", "throw", "match", "echo", "isset",
  ]),
  sql: new Set([
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "GROUP", "BY", "ORDER", "HAVING", "INSERT", "UPDATE", "DELETE", "CASE", "WHEN", "THEN", "ELSE", "END", "AS", "AND", "OR", "NOT", "IN", "EXISTS",
  ]),
  cpp: new Set([
    "template", "typename", "class", "public", "private", "return", "if", "else", "for", "while", "switch", "case", "break", "default", "new", "auto", "const", "void", "int", "string", "include", "using", "namespace",
  ]),
  csharp: new Set([
    "class", "public", "private", "protected", "return", "if", "else", "for", "while", "switch", "case", "break", "default", "new", "using", "namespace", "var", "string", "bool", "true", "false", "null", "=>", "is",
  ]),
  css: new Set([
    "media", "import", "display", "grid", "flex", "repeat", "minmax", "auto", "content", "var",
  ]),
};

const CODE_TOKEN_RE =
  /(\/\/.*)|(#.*)|(`[^`]*`)|("[^"\n]*")|('[^'\n]*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;

function isKeyword(word: string, lang: Lang): boolean {
  return KEYWORDS[lang].has(word);
}

/* Converte il codice (stringa) di uno snippet in righe tokenizzate con colorazione. */
function tokenizeCode(code: string, lang: Lang): TokenLine[] {
  return code.split("\n").map((line) => {
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("#")) {
      return [[line, "com"]];
    }
    const tokens: TokenLine = [];
    let match: RegExpExecArray | null;
    CODE_TOKEN_RE.lastIndex = 0;
    let prevWord = "";
    while ((match = CODE_TOKEN_RE.exec(line))) {
      const [full, comment, pyComment, template, dquote, squote, num, word, ws, other] = match;
      if (comment || pyComment) {
        tokens.push([full, "com"]);
      } else if (template || dquote || squote) {
        tokens.push([full, "str"]);
      } else if (num) {
        tokens.push([full, "num"]);
      } else if (word) {
        if (isKeyword(word, lang)) {
          tokens.push([full, "kw"]);
        } else if (prevWord === "function" || prevWord === "def" || prevWord === "class") {
          tokens.push([full, "fn"]);
        } else {
          const rest = line.slice(CODE_TOKEN_RE.lastIndex).trimStart();
          tokens.push([full, rest.startsWith("(") ? "fn" : "plain"]);
        }
        prevWord = word;
      } else if (ws) {
        tokens.push([full, "plain"]);
      } else if (other) {
        tokens.push([full, "plain"]);
        if (!/[A-Za-z_$]/.test(other)) prevWord = "";
      }
    }
    return tokens;
  });
}

function lineChars(line: TokenLine): number {
  return line.reduce((n, [text]) => n + text.length, 0);
}

/*
 * Finestre di righe consecutive (2–4) per linguaggio: sono i candidati "blocco".
 * Vengono costruite DENTRO ogni singolo snippet, così un blocco non mischia mai
 * codice di snippet diversi.
 */
interface Window {
  lang: Lang;
  start: number;
  size: number;
  maxChars: number;
}

const SNIPPETS: Record<Lang, TokenLine[]> = {
  javascript: [],
  typescript: [],
  python: [],
  jsx: [],
  java: [],
  go: [],
  rust: [],
  php: [],
  sql: [],
  cpp: [],
  csharp: [],
  css: [],
};

const WINDOWS: Window[] = [];
for (const snippet of codeSnippets) {
  const lang: Lang = snippet.language;
  const lines = tokenizeCode(snippet.code, lang);
  const start = SNIPPETS[lang].length;
  SNIPPETS[lang].push(...lines);
  for (let size = 2; size <= 4; size++) {
    for (let i = 0; i + size <= lines.length; i++) {
      let m = 0;
      let meaningful = 0;
      for (let j = 0; j < size; j++) {
        m = Math.max(m, lineChars(lines[i + j]));
        const t = lines[i + j].map(([tx]) => tx).join('').trim();
        // conta righe con contenuto reale (non solo parentesi)
        if (t.length > 4 && /[A-Za-z0-9]/.test(t)) meaningful++;
      }
      if (meaningful === 0) continue; // evita blocchi di sole parentesi
      // Solo pezzi reali: funzioni, ternari, regex, cicli, switch, classi — evita return/parantesi/chiave-valore generici
      const windowText = lines.slice(i, i + size).map(l => l.map(([tx]) => tx).join('')).join('\n');
      const isRealPiece = /(function\s+\w+|def\s+\w+\s*\(|class\s+\w+|switch\s*\(|case\s+[^:]+:|for\s*\(|while\s*\(|=>|\?.*:.*:|\/\S+\/[gimuy]*|import\s+.*from|export\s+)/.test(windowText);
      if (!isRealPiece) continue;
      WINDOWS.push({ lang, start: start + i, size, maxChars: m });
    }
  }
}

/**
 * PRNG deterministico (niente Math.random: evita mismatch SSR/hydration).
 * Dato lo stesso seed, genera sempre la stessa sequenza di blocchi.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ScatteredBlock {
  /** Posizione orizzontale in % da sinistra (centro del blocco). */
  x: number;
  /** Posizione verticale in % dall'alto (centro del blocco). */
  y: number;
  lang: Lang;
  start: number;
  size: number;
  dur: number;
  delay: number;
  range: number;
  op: number;
}

interface Slot {
  x: number;
  /** Larghezza massima (in caratteri) per la riga più lunga del blocco: garantisce che non invada la corsia successiva. */
  max: number;
}

/*
 * Layout: 7 righe. Top/bottom (y 8/92) hanno 3 blocchi, le 5 centrali (intorno al testo hero)
 * hanno solo 2 blocchi laterali così il codice sta intorno alle scritte senza sovrapporsi
 * e senza creare contrasto dietro il testo. Max aumentato a 38-42 per evitare troncamenti
 * (almeno 2 righe garantite da Window size 2-4).
 */
const HERO_ROWS: Slot[][] = [
  [{ x: 7, max: 42 }, { x: 38, max: 40 }, { x: 70, max: 38 }], // y 8  top
  [{ x: 5, max: 36 }, { x: 85, max: 36 }], // y 22
  [{ x: 6, max: 34 }, { x: 84, max: 34 }], // y 36
  [{ x: 5, max: 32 }, { x: 85, max: 32 }], // y 50 centro
  [{ x: 6, max: 34 }, { x: 84, max: 34 }], // y 64
  [{ x: 5, max: 36 }, { x: 85, max: 36 }], // y 78
  [{ x: 7, max: 42 }, { x: 38, max: 40 }, { x: 70, max: 38 }], // y 92 bottom
];

/* Login/register: blocchi corti ai lati (sinistra e destra alternati). */
const SIDES_ROWS: Slot[][] = [
  [{ x: 5, max: 26 }, { x: 30, max: 26 }],
  [{ x: 66, max: 24 }, { x: 86, max: 14 }],
];

function pickWindow(
  languages: readonly Lang[],
  langIdx: number,
  maxChars: number,
  size: number,
  rand: () => number,
): { window: Window | null; nextLangIdx: number } {
  const lang = languages[langIdx % languages.length];
  const pool = WINDOWS.filter((w) => w.lang === lang && w.size === size && w.maxChars <= maxChars);
  if (pool.length) {
    return { window: pool[Math.floor(rand() * pool.length)], nextLangIdx: langIdx + 1 };
  }
  // Fallback: qualsiasi linguaggio con la stessa dimensione e limiti
  const anyPool = WINDOWS.filter((w) => w.size === size && w.maxChars <= maxChars);
  if (anyPool.length) {
    return { window: anyPool[Math.floor(rand() * anyPool.length)], nextLangIdx: langIdx + 1 };
  }
  return { window: null, nextLangIdx: langIdx };
}

function buildScatter(
  variant: "hero" | "sides",
  languages: readonly Lang[],
  speed: number,
  opacity: number,
  seed = 1337,
): ScatteredBlock[] {
  const rand = mulberry32(seed);
  const blocks: ScatteredBlock[] = [];
  const rows = 7;
  const yFor = (r: number) => 8 + r * 14; // 8, 22, 36, 50, 64, 78, 92
  const usedKeys = new Set<string>();
  const usedTexts = new Set<string>();

  for (let r = 0; r < rows; r++) {
    const baseY = yFor(r);
    // Sparpagliamento verticale: ±4% per rompere l'allineamento a griglia
    const yRaw = baseY + (rand() * 8 - 4);
    const y = Math.max(6, Math.min(94, yRaw));
    const slots = variant === "sides" ? SIDES_ROWS[r % SIDES_ROWS.length] : HERO_ROWS[r % HERO_ROWS.length];
    let langIdx = r;
    for (const slot of slots) {
      // Varietà di dimensione: 4 o 3 righe spesso, 2 ogni tanto
      const sizes =
        rand() < 0.45 ? [4, 3, 2] : rand() < 0.9 ? [3, 4, 2] : [2, 4, 3];
      let picked: { w: Window; langIdx: number } | null = null;
      // Prova fino a 6 volte evitando duplicati di chiave e testo
      for (let attempt = 0; attempt < 6 && !picked; attempt++) {
        for (const size of sizes) {
          const res = pickWindow(languages, langIdx, slot.max, size, rand);
          langIdx = res.nextLangIdx;
          if (!res.window) continue;
          const w = res.window;
          const key = `${w.lang}:${w.start}:${w.size}`;
          const text = SNIPPETS[w.lang].slice(w.start, w.start + w.size).map(l => l.map(([t]) => t).join('')).join('\n').trim();
          if (usedKeys.has(key) || usedTexts.has(text)) continue;
          picked = { w, langIdx };
          break;
        }
      }
      if (!picked) continue;
      // Sparpagliamento orizzontale: ±7% per non essere allineati, poi clamp per restare visibili per intero
      const rawX = slot.x + (rand() * 14 - 7);
      const x = Math.max(14, Math.min(86, rawX));
      const dur = speed * (0.7 + rand() * 0.5);
      const delay = -rand() * dur * 2; // negativo: già "in corsa"
      const range = 6 + rand() * 6; // 6–12px
      const op = opacity * (0.85 + rand() * 0.3);
      const key = `${picked.w.lang}:${picked.w.start}:${picked.w.size}`;
      const text = SNIPPETS[picked.w.lang].slice(picked.w.start, picked.w.start + picked.w.size).map(l => l.map(([t]) => t).join('')).join('\n').trim();
      usedKeys.add(key);
      usedTexts.add(text);
      blocks.push({
        x,
        y,
        lang: picked.w.lang,
        start: picked.w.start,
        size: picked.w.size,
        dur,
        delay,
        range,
        op,
      });
    }
  }
  return blocks;
}

export default function CodeFloatBackground({
  variant = "hero",
  speed = 7,
  languages = LANGS.slice(),
  opacity = 0.82,
  className = "",
}: CodeFloatBackgroundProps) {
  const { theme } = useTheme();
  const palette: Palette = theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
  const isSides = variant === "sides";
  const overlay =
    isSides
      ? theme === "dark"
        ? DARK_SIDES_OVERLAY
        : LIGHT_SIDES_OVERLAY
      : theme === "dark"
        ? DARK_OVERLAY
        : LIGHT_OVERLAY;

  const [seed, setSeed] = useState(1337);

  // Seed deterministico lato server (evita mismatch hydration);
  // dopo il mount il client rimescola con un seed casuale → codice diverso a ogni load.
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1_000_000));
  }, []);

  const blocks = useMemo(
    () => buildScatter(variant, languages, speed, opacity, seed),
    [variant, languages, speed, opacity, seed],
  );

  return (
    <div
      aria-hidden
      className={`code-float-bg absolute inset-0 pointer-events-none overflow-hidden select-none ${isSides ? "code-float-bg--sides " : ""}${className}`}
    >
      {blocks.map((b, i) => (
        <div
          key={i}
          className="code-float-item absolute"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="code-float-line font-mono whitespace-nowrap"
            style={
              {
                "--dur": `${b.dur}s`,
                "--delay": `${b.delay}s`,
                "--range": `${b.range}px`,
                "--op": b.op,
              } as React.CSSProperties
            }
          >
            <div className={`${isSides ? 'text-[13.5px] leading-[1.9]' : 'text-[13px] leading-[1.8]'}`}>
              {SNIPPETS[b.lang].slice(b.start, b.start + b.size).map((line, li) => (
                <div key={li} className="whitespace-pre" style={{ textShadow: theme === 'dark' ? '0 0 10px rgba(16,185,129,0.18)' : '0 1px 0 rgba(255,255,255,0.8)' }}>
                  {line.map(([text, kind], ti) => (
                    <span key={ti} style={{ color: palette[kind], fontWeight: kind === 'kw' || kind === 'fn' ? 700 : kind === 'str' || kind === 'num' ? 600 : 400 }}>
                      {text}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      {/* Overlay per la leggibilità del contenuto sopra (ultimo figlio: copre i blocchi) */}
      <div
        className="code-float-overlay absolute inset-0"
        style={{ background: overlay }}
      />
    </div>
  );
}
