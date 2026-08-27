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

const LANGS = ["javascript", "typescript", "python", "jsx"] as const;
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
  str: "#b45309",
  com: "#94a3b8",
  num: "#d97706",
  plain: "#475569",
};

const DARK_PALETTE: Palette = {
  kw: "#34d399",
  fn: "#a78bfa",
  str: "#fbbf24",
  com: "#64748b",
  num: "#f59e0b",
  plain: "#94a3b8",
};

const LIGHT_OVERLAY =
  "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0.72) 100%)";
const DARK_OVERLAY =
  "linear-gradient(180deg, rgba(8,13,20,0.72) 0%, rgba(8,13,20,0.28) 45%, rgba(8,13,20,0.72) 100%)";

/* Variante "sides": overlay orizzontale, trasparente ai bordi (codice visibile) e chiaro al centro (form leggibile) */
const LIGHT_SIDES_OVERLAY =
  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.88) 32%, rgba(255,255,255,0.96) 50%, rgba(255,255,255,0.88) 68%, rgba(255,255,255,0) 100%)";
const DARK_SIDES_OVERLAY =
  "linear-gradient(90deg, rgba(8,13,20,0) 0%, rgba(8,13,20,0.88) 32%, rgba(8,13,20,0.96) 50%, rgba(8,13,20,0.88) 68%, rgba(8,13,20,0) 100%)";

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
    "pass", "raise", "is", "None", "True", "False", "global", "nonlocal",
  ]),
  jsx: new Set([
    "async", "await", "const", "let", "var", "function", "return", "if", "else", "for", "while",
    "new", "class", "this", "typeof", "try", "catch", "throw", "import", "from", "export",
    "default", "extends", "null", "undefined", "true", "false",
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
      for (let j = 0; j < size; j++) m = Math.max(m, lineChars(lines[i + j]));
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
 * Layout anti-sovrapposizione, deterministico.
 * 7 righe orizzontali distanziate del 14% (~98px su hero 700px): un blocco di 4 righe
 * è alto ~99px + fluttuazione → mai in collisione verticale. Ogni riga ha 3 blocchi
 * (posizioni alternate tra le righe per l'effetto "sparso").
 */
const HERO_ROWS: Slot[][] = [
  [{ x: 5, max: 30 }, { x: 40, max: 26 }, { x: 76, max: 20 }],
  [{ x: 18, max: 24 }, { x: 55, max: 28 }, { x: 88, max: 18 }],
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

  for (let r = 0; r < rows; r++) {
    const y = yFor(r);
    const slots = variant === "sides" ? SIDES_ROWS[r % SIDES_ROWS.length] : HERO_ROWS[r % HERO_ROWS.length];
    let langIdx = r;
    for (const slot of slots) {
      // Varietà di dimensione: 4 o 3 righe spesso, 2 ogni tanto
      const sizes =
        rand() < 0.45 ? [4, 3, 2] : rand() < 0.9 ? [3, 4, 2] : [2, 4, 3];
      let picked: { w: Window; langIdx: number } | null = null;
      for (const size of sizes) {
        const res = pickWindow(languages, langIdx, slot.max, size, rand);
        langIdx = res.nextLangIdx;
        if (res.window) {
          picked = { w: res.window, langIdx };
          break;
        }
      }
      if (!picked) continue;
      const x = slot.x + (rand() * 3 - 1.5); // jitter orizzontale ±1.5% (mai in collisione)
      const dur = speed * (0.7 + rand() * 0.5);
      const delay = -rand() * dur * 2; // negativo: già "in corsa"
      const range = 6 + rand() * 6; // 6–12px
      const op = opacity * (0.85 + rand() * 0.3);
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
  opacity = 0.32,
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
            className="code-float-line font-mono text-[13px] leading-[1.9] whitespace-nowrap"
            style={
              {
                "--dur": `${b.dur}s`,
                "--delay": `${b.delay}s`,
                "--range": `${b.range}px`,
                "--op": b.op,
              } as React.CSSProperties
            }
          >
            {SNIPPETS[b.lang].slice(b.start, b.start + b.size).map((line, li) => (
              <div key={li} className="whitespace-pre">
                {line.map(([text, kind], ti) => (
                  <span key={ti} style={{ color: palette[kind] }}>
                    {text}
                  </span>
                ))}
              </div>
            ))}
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
