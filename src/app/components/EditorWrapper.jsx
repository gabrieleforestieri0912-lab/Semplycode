"use client";

import React, { useEffect, useState } from "react";

// Lazy-load CodeMirror and language packages on the client to reduce initial bundle size

export default function EditorWrapper({ value, onChange, detectedLang }) {
  const [CM, setCM] = useState(null);
  const [extensions, setExtensions] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ default: CodeMirror }, langJs, langPy, langCss, langHtml, langJson, langRust, langGo, langPhp, langSql, { oneDark }, { EditorView }] = await Promise.all([
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

      const getLang = (lang) => {
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

      setCM(() => CodeMirror.default || CodeMirror);
      setExtensions([
        getLang(detectedLang),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { minHeight: "100%" },
        }),
      ]);
    })();
    return () => (mounted = false);
  }, [detectedLang]);

  if (!CM) {
    return <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">Caricamento editor...</div>;
  }

  const CodeMirrorComp = CM.default || CM;

  return (
    <CodeMirrorComp
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={oneDark}
      placeholder="// Scrivi il codice qui..."
      style={{ fontSize: 13, height: "100%" }}
      className="h-full"
    />
  );
}
