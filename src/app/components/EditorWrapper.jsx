"use client";

import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

const getLanguageExtension = (lang) => {
  switch (lang) {
    case "python":
      return python();
    case "css":
      return css();
    case "markup":
      return html();
    case "json":
      return json();
    case "rust":
      return rust();
    case "go":
      return go();
    case "php":
      return php();
    case "sql":
      return sql();
    case "typescript":
      return javascript({ typescript: true });
    default:
      return javascript();
  }
};

export default function EditorWrapper({ value, onChange, detectedLang }) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[
        getLanguageExtension(detectedLang),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { minHeight: "100%" },
        }),
      ]}
      theme={oneDark}
      placeholder="// Scrivi il codice qui..."
      style={{ fontSize: 13, height: "100%" }}
      className="h-full"
    />
  );
}
