// Entry point per il bundle CodeMirror dell'estensione.
// Genera chrome-extension/codemirror-bundle.js con:
//   npm run build:extension-codemirror
// NON modificare mai a mano il bundle minificato: rigeneralo da qui.
import { EditorView, basicSetup } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

window.__SemplycodeCodeMirror = { EditorView, basicSetup, javascript, oneDark };
console.log("[Semplycode] CodeMirror 6 bundled assets loaded");
