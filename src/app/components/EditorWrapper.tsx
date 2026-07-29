"use client";

import React, { useEffect, useState } from "react";

interface EditorWrapperProps {
  value?: string;
  onChange?: (value: string) => void;
  detectedLang?: string;
  onLineChange?: (lineNumber: number, text: string) => void;
}

export default function EditorWrapper({ value, onChange, detectedLang, onLineChange }: EditorWrapperProps) {
  const [CM, setCM] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [baseExtensions, setBaseExtensions] = useState<unknown[]>([]);
  const [langExtension, setLangExtension] = useState<unknown>(null);
  const [themeObj, setThemeObj] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [
        { default: CodeMirror },
        langJs,
        langPy,
        langCss,
        langHtml,
        langJson,
        langRust,
        langGo,
        langPhp,
        langSql,
        themeModule,
        viewModule,
      ] = await Promise.all([
        import("@uiw/react-codemirror"),
        import("@codemirror/lang-javascript"),
        import("@codemirror/lang-python"),
        import("@codemirror/lang-css"),
        import("@codemirror/lang-html"),
        import("@codemirror/lang-json"),
        import("@codemirror/lang-rust"),
        import("@codemirror/lang-go"),
        import("@codemirror/lang-php"),
        import("@codemirror/lang-sql"),
        import("@codemirror/theme-one-dark"),
        import("@codemirror/view"),
      ]);

      if (!mounted) return;

      const makeLang = (lang: string): unknown => {
        switch (lang) {
          case "python":
            return langPy.python();
          case "css":
            return langCss.css();
          case "markup":
            return langHtml.html();
          case "json":
            return langJson.json();
          case "rust":
            return langRust.rust();
          case "go":
            return langGo.go();
          case "php":
            return langPhp.php();
          case "sql":
            return langSql.sql();
          case "typescript":
            return langJs.javascript({ typescript: true });
          default:
            return langJs.javascript();
        }
      };

      const resolvedTheme = (themeModule as Record<string, unknown>).oneDark || (themeModule as Record<string, unknown>).default || themeModule;
      const EditorView = (viewModule as Record<string, unknown>).EditorView || viewModule;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCM(() => (CodeMirror as any).default || CodeMirror);
      setThemeObj(resolvedTheme);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBaseExtensions([
        (EditorView as any).lineWrapping,
        (EditorView as any).theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { minHeight: "100%" },
        }),
      ]);
      setLangExtension(makeLang(detectedLang ?? "javascript"));
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!CM) return;
    let cancelled = false;
    (async () => {
      try {
        const langMap: Record<string, () => Promise<unknown>> = {
          javascript: () => import("@codemirror/lang-javascript").then(m => m.javascript()),
          typescript: () => import("@codemirror/lang-javascript").then(m => m.javascript({ typescript: true })),
          python: () => import("@codemirror/lang-python").then(m => m.python()),
          css: () => import("@codemirror/lang-css").then(m => m.css()),
          markup: () => import("@codemirror/lang-html").then(m => m.html()),
          json: () => import("@codemirror/lang-json").then(m => m.json()),
          rust: () => import("@codemirror/lang-rust").then(m => m.rust()),
          go: () => import("@codemirror/lang-go").then(m => m.go()),
          php: () => import("@codemirror/lang-php").then(m => m.php()),
          sql: () => import("@codemirror/lang-sql").then(m => m.sql()),
        };

        const loader = langMap[detectedLang ?? ""] || langMap.javascript;
        const ext = await loader();
        if (!cancelled) setLangExtension(ext);
      } catch {
        // ignore; keep previous extension
      }
    })();
    return () => { cancelled = true; };
  }, [detectedLang, CM]);

  if (!CM) {
    return <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">Caricamento editor...</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CodeMirrorComp: any = CM;

  return (
    <CodeMirrorComp
      value={value}
      onChange={onChange}
      onUpdate={(update: { selectionSet?: boolean; docChanged?: boolean; state: { selection: { main: { head: number } }; doc: { lineAt: (pos: number) => { number: number; text: string } } } }) => {
        if (onLineChange && (update.selectionSet || update.docChanged)) {
          try {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            onLineChange(line.number, line.text);
          } catch {
            // ignore range errors
          }
        }
      }}
      extensions={langExtension ? [langExtension, ...baseExtensions] : baseExtensions}
      theme={themeObj}
      placeholder="// Scrivi il codice qui..."
      style={{ fontSize: 13, height: "100%" }}
      className="h-full"
    />
  );
}
